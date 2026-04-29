import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
  catIdentityCodes,
  catLineageEdges,
  cats,
  lineageConnectionRequests,
  users,
} from "@/lib/db/schema";
import { snapshotCat, validateRoleSex, wouldCreateCycle } from "@/lib/lineage/graph";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import { externalLineageRequestSchema } from "@/lib/validators/lineage";

export const runtime = "nodejs";

const mobileLineageRequestSchema = externalLineageRequestSchema.extend({
  childCatId: z.uuid("Choose one of your cats"),
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

async function findIdentityCode(code: string) {
  const [row] = await db
    .select({
      identityCodeId: catIdentityCodes.id,
      identityCode: catIdentityCodes.code,
      catId: cats.id,
      ownerId: cats.ownerId,
      slug: cats.slug,
      name: cats.name,
      breed: cats.breed,
      sex: cats.sex,
      birthdate: cats.birthdate,
      avatarUrl: cats.avatarUrl,
      ownerUsername: users.username,
      ownerDisplayName: users.displayName,
    })
    .from(catIdentityCodes)
    .innerJoin(cats, eq(cats.id, catIdentityCodes.catId))
    .innerJoin(users, eq(users.id, cats.ownerId))
    .where(
      and(
        eq(catIdentityCodes.code, code),
        eq(catIdentityCodes.isActive, true)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const url = new URL(request.url);
  const parsed = externalLineageRequestSchema
    .pick({ identityCode: true })
    .safeParse({ identityCode: url.searchParams.get("code") });

  if (!parsed.success) {
    return apiError("Use a valid CAT-XXXX-XXXX-XXXX identity code.");
  }

  const identity = await findIdentityCode(parsed.data.identityCode);
  if (!identity) return apiError("No active cat identity code found.", 404);

  if (identity.ownerId === user.id) {
    return apiError(
      "This code belongs to one of your cats. Use internal parent links instead."
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      identityCode: identity.identityCode,
      cat: {
        id: identity.catId,
        slug: identity.slug,
        name: identity.name,
        breed: identity.breed,
        sex: identity.sex,
        birthdate: identity.birthdate?.toISOString() ?? null,
        avatarUrl: identity.avatarUrl,
        owner: {
          username: identity.ownerUsername,
          displayName: identity.ownerDisplayName,
        },
      },
    },
  });
}

export async function POST(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const parsed = mobileLineageRequestSchema.safeParse(
    await request.json().catch(() => null)
  );

  if (!parsed.success) {
    return apiError("Invalid lineage request payload.");
  }

  const { childCatId, identityCode, parentRole, requestNote } = parsed.data;
  const [child, identity] = await Promise.all([
    getCatSnapshot(childCatId),
    findIdentityCode(identityCode),
  ]);

  if (!child || child.ownerId !== user.id) {
    return apiError("Child cat not found or access denied.", 404);
  }

  if (!identity) return apiError("No active cat identity code found.", 404);
  if (identity.ownerId === user.id) {
    return apiError(
      "This code belongs to one of your cats. Use internal parent links instead."
    );
  }
  if (identity.catId === child.id) {
    return apiError("A cat cannot be its own parent.");
  }

  const parent = await getCatSnapshot(identity.catId);
  if (!parent) {
    return apiError("The shared identity code is no longer linked to a cat.");
  }

  const roleError = validateRoleSex(parentRole, parent);
  if (roleError) return apiError(roleError);

  const [confirmedSamePair] = await db
    .select({ id: catLineageEdges.id, parentRole: catLineageEdges.parentRole })
    .from(catLineageEdges)
    .where(
      and(
        eq(catLineageEdges.parentCatId, parent.id),
        eq(catLineageEdges.childCatId, child.id),
        eq(catLineageEdges.status, "confirmed")
      )
    )
    .limit(1);

  if (confirmedSamePair?.parentRole === parentRole) {
    return NextResponse.json({
      ok: true,
      data: {
        requestId: confirmedSamePair.id,
        status: "already_confirmed",
        message: "This external lineage link is already confirmed.",
      },
    });
  }

  if (confirmedSamePair && confirmedSamePair.parentRole !== parentRole) {
    return apiError("This parent-child pair is already confirmed with another role.");
  }

  const [sameRoleOtherParent] = await db
    .select({ id: catLineageEdges.id })
    .from(catLineageEdges)
    .where(
      and(
        eq(catLineageEdges.childCatId, child.id),
        eq(catLineageEdges.parentRole, parentRole),
        eq(catLineageEdges.status, "confirmed"),
        ne(catLineageEdges.parentCatId, parent.id)
      )
    )
    .limit(1);

  if (sameRoleOtherParent) {
    return apiError(
      "This cat already has a confirmed parent for that role. Resolve it on the web lineage page first."
    );
  }

  if (await wouldCreateCycle(parent.id, child.id)) {
    return apiError(
      "This request would create a lineage cycle. A cat cannot be both ancestor and descendant."
    );
  }

  const [existingPending] = await db
    .select({ id: lineageConnectionRequests.id })
    .from(lineageConnectionRequests)
    .where(
      and(
        eq(lineageConnectionRequests.childCatId, child.id),
        eq(lineageConnectionRequests.parentCatId, parent.id),
        eq(lineageConnectionRequests.parentRole, parentRole),
        eq(lineageConnectionRequests.status, "pending")
      )
    )
    .limit(1);

  if (existingPending) {
    return NextResponse.json({
      ok: true,
      data: {
        requestId: existingPending.id,
        status: "already_pending",
        message: "A pending request for this link already exists.",
      },
    });
  }

  try {
    const [requestRow] = await db
      .insert(lineageConnectionRequests)
      .values({
        requesterUserId: user.id,
        responderUserId: parent.ownerId,
        childCatId: child.id,
        parentCatId: parent.id,
        identityCodeId: identity.identityCodeId,
        parentRole,
        status: "pending",
        requestNote: requestNote ?? null,
        identitySnapshot: {
          identityCode: identity.identityCode,
          parent: snapshotCat(parent),
          child: snapshotCat(child),
        },
      })
      .returning({ id: lineageConnectionRequests.id });

    return NextResponse.json(
      {
        ok: true,
        data: {
          requestId: requestRow.id,
          status: "pending",
          message:
            "External lineage request sent. The other owner must confirm before CatHub links the cats.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      isUniqueViolation(
        error,
        "lineage_connection_requests_pending_unique_idx"
      )
    ) {
      return apiError("A pending request for this link already exists.", 409);
    }

    return apiError("Failed to create external lineage request.", 500);
  }
}
