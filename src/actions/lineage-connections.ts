"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  catIdentityCodes,
  catLineageEdges,
  cats,
  lineageConnectionRequests,
  users,
} from "@/lib/db/schema";
import {
  snapshotCat,
  validateRoleSex,
  wouldCreateCycle,
} from "@/lib/lineage/graph";
import {
  externalLineageRequestSchema,
  lineageConnectionResponseSchema,
} from "@/lib/validators/lineage";

export type LineageConnectionActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0]);
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

function isUniqueViolation(error: unknown, constraintName: string) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(constraintName);
}

function revalidateRequestPaths({
  childUsername,
  childSlug,
  parentUsername,
  parentSlug,
}: {
  childUsername: string;
  childSlug: string;
  parentUsername: string;
  parentSlug: string;
}) {
  revalidatePath("/dashboard");
  revalidatePath(`/${childUsername}/${childSlug}`);
  revalidatePath(`/${childUsername}/${childSlug}/lineage`);
  revalidatePath(`/${parentUsername}/${parentSlug}/lineage`);
}

async function getUserUsername(userId: string) {
  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.username ?? null;
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

export async function requestExternalLineageConnection(
  childCatId: string,
  _prevState: LineageConnectionActionState,
  formData: FormData
): Promise<LineageConnectionActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parsed = externalLineageRequestSchema.safeParse({
    parentRole: formData.get("parentRole"),
    identityCode: formData.get("identityCode"),
    requestNote:
      (formData.get("requestNote") as string | null)?.trim() || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const requesterUserId = session.user.id;
  const { identityCode, parentRole, requestNote } = parsed.data;

  const [child, childUsername] = await Promise.all([
    getCatSnapshot(childCatId),
    getUserUsername(requesterUserId),
  ]);

  if (!child || child.ownerId !== requesterUserId || !childUsername) {
    return { error: "Cat not found or access denied." };
  }

  const [identityRow] = await db
    .select({
      id: catIdentityCodes.id,
      code: catIdentityCodes.code,
      catId: catIdentityCodes.catId,
    })
    .from(catIdentityCodes)
    .where(
      and(
        eq(catIdentityCodes.code, identityCode),
        eq(catIdentityCodes.isActive, true)
      )
    )
    .limit(1);

  if (!identityRow) {
    return { error: "No active cat identity code found." };
  }

  const [parent, parentUsername] = await Promise.all([
    getCatSnapshot(identityRow.catId),
    db
      .select({ username: users.username })
      .from(cats)
      .innerJoin(users, eq(users.id, cats.ownerId))
      .where(eq(cats.id, identityRow.catId))
      .limit(1)
      .then((rows) => rows[0]?.username ?? null),
  ]);

  if (!parent || !parentUsername) {
    return { error: "The shared identity code is no longer linked to a cat." };
  }

  if (parent.ownerId === requesterUserId) {
    return {
      error:
        "This identity code belongs to one of your cats. Use internal parent links instead.",
    };
  }

  if (parent.id === child.id) {
    return { error: "A cat cannot be its own parent." };
  }

  const roleError = validateRoleSex(parentRole, parent);
  if (roleError) {
    return { error: roleError };
  }

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
    return { success: "This external lineage link is already confirmed." };
  }

  if (confirmedSamePair && confirmedSamePair.parentRole !== parentRole) {
    return {
      error: "This parent-child pair is already confirmed with another role.",
    };
  }

  if (await wouldCreateCycle(parent.id, child.id)) {
    return {
      error:
        "This request would create a lineage cycle. A cat cannot be both ancestor and descendant.",
    };
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
    return { success: "A pending request for this link already exists." };
  }

  try {
    await db.insert(lineageConnectionRequests).values({
      requesterUserId,
      responderUserId: parent.ownerId,
      childCatId: child.id,
      parentCatId: parent.id,
      identityCodeId: identityRow.id,
      parentRole,
      status: "pending",
      requestNote: requestNote ?? null,
      identitySnapshot: {
        identityCode: identityRow.code,
        parent: snapshotCat(parent),
        child: snapshotCat(child),
      },
    });
  } catch (error) {
    if (
      isUniqueViolation(
        error,
        "lineage_connection_requests_pending_unique_idx"
      )
    ) {
      return { success: "A pending request for this link already exists." };
    }
    return { error: "Failed to create external lineage request." };
  }

  revalidateRequestPaths({
    childUsername,
    childSlug: child.slug,
    parentUsername,
    parentSlug: parent.slug,
  });

  return {
    success:
      "External lineage request sent. The other owner must confirm before CatHub links the cats.",
  };
}

export async function acceptLineageConnectionRequest(
  requestId: string,
  _prevState: LineageConnectionActionState,
  formData: FormData
): Promise<LineageConnectionActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parsed = lineageConnectionResponseSchema.safeParse({
    responseNote:
      (formData.get("responseNote") as string | null)?.trim() || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const [request] = await db
    .select()
    .from(lineageConnectionRequests)
    .where(eq(lineageConnectionRequests.id, requestId))
    .limit(1);

  if (!request || request.status !== "pending") {
    return { error: "This request is no longer pending." };
  }

  if (request.responderUserId !== session.user.id) {
    return { error: "Only the shared cat owner can confirm this request." };
  }

  const [child, parent, childUsername, parentUsername] = await Promise.all([
    getCatSnapshot(request.childCatId),
    getCatSnapshot(request.parentCatId),
    getUserUsername(request.requesterUserId),
    getUserUsername(request.responderUserId),
  ]);

  if (!child || !parent || !childUsername || !parentUsername) {
    return { error: "One of the cats or users no longer exists." };
  }

  if (
    child.ownerId !== request.requesterUserId ||
    parent.ownerId !== request.responderUserId
  ) {
    return {
      error: "Cat ownership changed. Ask the requester to send a new request.",
    };
  }

  if (parent.id === child.id) {
    return { error: "A cat cannot be its own parent." };
  }

  const roleError = validateRoleSex(request.parentRole, parent);
  if (roleError) {
    return { error: roleError };
  }

  const [samePairOtherRole] = await db
    .select({ id: catLineageEdges.id })
    .from(catLineageEdges)
    .where(
      and(
        eq(catLineageEdges.parentCatId, parent.id),
        eq(catLineageEdges.childCatId, child.id),
        eq(catLineageEdges.status, "confirmed"),
        ne(catLineageEdges.parentRole, request.parentRole)
      )
    )
    .limit(1);

  if (samePairOtherRole) {
    return {
      error: "This parent-child pair is already confirmed with another role.",
    };
  }

  if (await wouldCreateCycle(parent.id, child.id)) {
    return {
      error:
        "Confirming this request would create a lineage cycle. A cat cannot be both ancestor and descendant.",
    };
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
        eq(catLineageEdges.parentRole, request.parentRole),
        eq(catLineageEdges.status, "confirmed")
      )
    )
    .limit(1);

  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      let edgeId: string | null = currentForRole?.id ?? null;

      if (currentForRole && currentForRole.parentCatId !== parent.id) {
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
            parentCatId: parent.id,
            childCatId: child.id,
            parentRole: request.parentRole,
            status: "confirmed",
            sourceType: "external",
            createdByUserId: request.requesterUserId,
            confirmedByUserId: request.responderUserId,
            notes: parsed.data.responseNote ?? request.requestNote ?? null,
            identitySnapshot: {
              parent: snapshotCat(parent),
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
          responseNote: parsed.data.responseNote ?? null,
          edgeId,
          respondedAt: now,
          updatedAt: now,
        })
        .where(eq(lineageConnectionRequests.id, request.id));
    });
  } catch (error) {
    if (
      isUniqueViolation(error, "lineage_edges_child_sire_confirmed_idx") ||
      isUniqueViolation(error, "lineage_edges_child_dam_confirmed_idx")
    ) {
      return { error: "A confirmed parent for this role already exists." };
    }
    if (isUniqueViolation(error, "lineage_edges_parent_child_confirmed_idx")) {
      return { error: "This parent-child link is already confirmed." };
    }
    return { error: "Failed to accept lineage request." };
  }

  revalidateRequestPaths({
    childUsername,
    childSlug: child.slug,
    parentUsername,
    parentSlug: parent.slug,
  });

  return { success: "Request accepted. The external lineage link is confirmed." };
}

export async function declineLineageConnectionRequest(
  requestId: string,
  _prevState: LineageConnectionActionState,
  formData: FormData
): Promise<LineageConnectionActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parsed = lineageConnectionResponseSchema.safeParse({
    responseNote:
      (formData.get("responseNote") as string | null)?.trim() || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const [request] = await db
    .select()
    .from(lineageConnectionRequests)
    .where(eq(lineageConnectionRequests.id, requestId))
    .limit(1);

  if (!request || request.status !== "pending") {
    return { error: "This request is no longer pending." };
  }

  if (request.responderUserId !== session.user.id) {
    return { error: "Only the shared cat owner can decline this request." };
  }

  await db
    .update(lineageConnectionRequests)
    .set({
      status: "declined",
      responseNote: parsed.data.responseNote ?? null,
      respondedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(lineageConnectionRequests.id, request.id));

  revalidatePath("/dashboard");

  return { success: "Request declined." };
}

export async function cancelLineageConnectionRequest(
  requestId: string,
  _prevState: LineageConnectionActionState,
  _formData: FormData
): Promise<LineageConnectionActionState> {
  void _prevState;
  void _formData;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [request] = await db
    .select()
    .from(lineageConnectionRequests)
    .where(eq(lineageConnectionRequests.id, requestId))
    .limit(1);

  if (!request || request.status !== "pending") {
    return { error: "This request is no longer pending." };
  }

  if (request.requesterUserId !== session.user.id) {
    return { error: "Only the requester can cancel this request." };
  }

  await db
    .update(lineageConnectionRequests)
    .set({
      status: "canceled",
      respondedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(lineageConnectionRequests.id, request.id));

  revalidatePath("/dashboard");

  return { success: "Request canceled." };
}
