import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
  catLineageEdges,
  cats,
  lineageConnectionRequests,
  users,
} from "@/lib/db/schema";
import { snapshotCat, validateRoleSex, wouldCreateCycle } from "@/lib/lineage/graph";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

const paramsSchema = z.object({ requestId: z.uuid() });

const bodySchema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
  responseNote: z.string().trim().max(500).optional().nullable(),
});

function apiError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function isUniqueViolation(error: unknown, constraintName: string) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(constraintName);
}

async function getCatSnapshot(catId: string) {
  const [cat] = await db
    .select({
      id: cats.id,
      ownerId: cats.ownerId,
      slug: cats.slug,
      name: cats.name,
      breed: cats.breed,
      sex: cats.sex,
      birthdate: cats.birthdate,
      avatarUrl: cats.avatarUrl,
    })
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);

  return cat ?? null;
}

async function loadSummary(requestId: string) {
  const [row] = await db
    .select({
      id: lineageConnectionRequests.id,
      status: lineageConnectionRequests.status,
      parentRole: lineageConnectionRequests.parentRole,
      requestNote: lineageConnectionRequests.requestNote,
      responseNote: lineageConnectionRequests.responseNote,
      createdAt: lineageConnectionRequests.createdAt,
      respondedAt: lineageConnectionRequests.respondedAt,
      childCatId: lineageConnectionRequests.childCatId,
      parentCatId: lineageConnectionRequests.parentCatId,
      requesterUserId: lineageConnectionRequests.requesterUserId,
      responderUserId: lineageConnectionRequests.responderUserId,
    })
    .from(lineageConnectionRequests)
    .where(eq(lineageConnectionRequests.id, requestId))
    .limit(1);

  if (!row) return null;

  const [child] = await db
    .select({
      id: cats.id,
      name: cats.name,
      breed: cats.breed,
      sex: cats.sex,
      slug: cats.slug,
      ownerUsername: users.username,
      ownerDisplayName: users.displayName,
    })
    .from(cats)
    .innerJoin(users, eq(users.id, cats.ownerId))
    .where(eq(cats.id, row.childCatId))
    .limit(1);

  const [parentCat] = await db
    .select({
      id: cats.id,
      name: cats.name,
      breed: cats.breed,
      sex: cats.sex,
      slug: cats.slug,
      ownerUsername: users.username,
      ownerDisplayName: users.displayName,
    })
    .from(cats)
    .innerJoin(users, eq(users.id, cats.ownerId))
    .where(eq(cats.id, row.parentCatId))
    .limit(1);

  const [requester] = await db
    .select({ username: users.username, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, row.requesterUserId))
    .limit(1);

  const [responder] = await db
    .select({ username: users.username, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, row.responderUserId))
    .limit(1);

  if (!child || !parentCat || !requester || !responder) return null;

  return {
    id: row.id,
    status: row.status,
    parentRole: row.parentRole,
    requestNote: row.requestNote,
    responseNote: row.responseNote,
    createdAt: row.createdAt.toISOString(),
    respondedAt: row.respondedAt ? row.respondedAt.toISOString() : null,
    child: {
      id: child.id,
      name: child.name,
      breed: child.breed,
      sex: child.sex,
      slug: child.slug,
      username: child.ownerUsername,
      ownerDisplayName: child.ownerDisplayName,
    },
    parent: {
      id: parentCat.id,
      name: parentCat.name,
      breed: parentCat.breed,
      sex: parentCat.sex,
      slug: parentCat.slug,
      username: parentCat.ownerUsername,
      ownerDisplayName: parentCat.ownerDisplayName,
    },
    requester,
    responder,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return apiError("Invalid request id");

  const json = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return apiError(parsedBody.error.issues[0]?.message ?? "Invalid payload");
  }

  const { action, responseNote } = parsedBody.data;
  const requestId = parsedParams.data.requestId;

  const [row] = await db
    .select()
    .from(lineageConnectionRequests)
    .where(eq(lineageConnectionRequests.id, requestId))
    .limit(1);

  if (!row || row.status !== "pending") {
    return apiError("This request is no longer pending.", 409);
  }

  if (action === "cancel") {
    if (row.requesterUserId !== user.id) {
      return apiError("Only the requester can cancel this request.", 403);
    }

    await db
      .update(lineageConnectionRequests)
      .set({
        status: "canceled",
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(lineageConnectionRequests.id, requestId));
  } else {
    if (row.responderUserId !== user.id) {
      return apiError(
        "Only the shared cat owner can respond to this request.",
        403
      );
    }

    if (action === "decline") {
      await db
        .update(lineageConnectionRequests)
        .set({
          status: "declined",
          responseNote: responseNote?.trim() || null,
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(lineageConnectionRequests.id, requestId));
    } else {
      // accept
      const [child, parentCat] = await Promise.all([
        getCatSnapshot(row.childCatId),
        getCatSnapshot(row.parentCatId),
      ]);

      if (!child || !parentCat) {
        return apiError("One of the cats no longer exists.", 404);
      }

      if (
        child.ownerId !== row.requesterUserId ||
        parentCat.ownerId !== row.responderUserId
      ) {
        return apiError(
          "Cat ownership changed. Ask the requester to send a new request."
        );
      }

      if (parentCat.id === child.id) {
        return apiError("A cat cannot be its own parent.");
      }

      const roleError = validateRoleSex(row.parentRole, parentCat);
      if (roleError) return apiError(roleError);

      const [samePairOtherRole] = await db
        .select({ id: catLineageEdges.id })
        .from(catLineageEdges)
        .where(
          and(
            eq(catLineageEdges.parentCatId, parentCat.id),
            eq(catLineageEdges.childCatId, child.id),
            eq(catLineageEdges.status, "confirmed"),
            ne(catLineageEdges.parentRole, row.parentRole)
          )
        )
        .limit(1);

      if (samePairOtherRole) {
        return apiError(
          "This parent-child pair is already confirmed with another role."
        );
      }

      if (await wouldCreateCycle(parentCat.id, child.id)) {
        return apiError(
          "Confirming this request would create a lineage cycle."
        );
      }

      const [currentForRole] = await db
        .select({
          id: catLineageEdges.id,
          parentCatId: catLineageEdges.parentCatId,
        })
        .from(catLineageEdges)
        .where(
          and(
            eq(catLineageEdges.childCatId, child.id),
            eq(catLineageEdges.parentRole, row.parentRole),
            eq(catLineageEdges.status, "confirmed")
          )
        )
        .limit(1);

      const now = new Date();

      try {
        await db.transaction(async (tx) => {
          let edgeId: string | null = currentForRole?.id ?? null;

          if (currentForRole && currentForRole.parentCatId !== parentCat.id) {
            await tx
              .update(catLineageEdges)
              .set({ status: "disputed", updatedAt: now })
              .where(eq(catLineageEdges.id, currentForRole.id));
            edgeId = null;
          }

          if (!edgeId) {
            const [edge] = await tx
              .insert(catLineageEdges)
              .values({
                parentCatId: parentCat.id,
                childCatId: child.id,
                parentRole: row.parentRole,
                status: "confirmed",
                sourceType: "external",
                createdByUserId: row.requesterUserId,
                confirmedByUserId: row.responderUserId,
                notes: responseNote?.trim() || row.requestNote || null,
                identitySnapshot: {
                  parent: snapshotCat(parentCat),
                  child: snapshotCat(child),
                },
                confirmedAt: now,
                updatedAt: now,
              })
              .returning({ id: catLineageEdges.id });
            edgeId = edge.id;
          }

          await tx
            .update(lineageConnectionRequests)
            .set({
              status: "accepted",
              responseNote: responseNote?.trim() || null,
              edgeId,
              respondedAt: now,
              updatedAt: now,
            })
            .where(eq(lineageConnectionRequests.id, requestId));
        });
      } catch (error) {
        if (
          isUniqueViolation(error, "lineage_edges_child_sire_confirmed_idx") ||
          isUniqueViolation(error, "lineage_edges_child_dam_confirmed_idx")
        ) {
          return apiError("A confirmed parent for this role already exists.");
        }
        if (
          isUniqueViolation(error, "lineage_edges_parent_child_confirmed_idx")
        ) {
          return apiError("This parent-child link is already confirmed.");
        }
        return apiError("Failed to accept lineage request.", 500);
      }
    }
  }

  const summary = await loadSummary(requestId);
  if (!summary) return apiError("Request not found after update", 500);

  const message =
    action === "accept"
      ? "Request accepted. Lineage link confirmed."
      : action === "decline"
        ? "Request declined."
        : "Request canceled.";

  return NextResponse.json({
    ok: true,
    data: { request: summary, message },
  });
}
