"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { catLineageEdges, cats, users } from "@/lib/db/schema";
import {
  internalParentSchema,
  lineageParentRoleSchema,
  type LineageParentRole,
} from "@/lib/validators/lineage";

export type LineageActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

type CatSnapshotSource = {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  breed: string | null;
  sex: "male" | "female" | "unknown" | null;
  birthdate: Date | null;
  avatarUrl: string | null;
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

function snapshotCat(cat: CatSnapshotSource) {
  return {
    id: cat.id,
    ownerId: cat.ownerId,
    slug: cat.slug,
    name: cat.name,
    breed: cat.breed,
    sex: cat.sex,
    birthdate: cat.birthdate?.toISOString() ?? null,
    avatarUrl: cat.avatarUrl,
  };
}

async function wouldCreateCycle(parentCatId: string, childCatId: string) {
  const result = await db.execute<{ id: string }>(sql`
    with recursive descendants(id, depth, path) as (
      select
        e.child_cat_id,
        1 as depth,
        array[e.parent_cat_id, e.child_cat_id]::uuid[] as path
      from cat_lineage_edges e
      where e.parent_cat_id = ${childCatId}::uuid
        and e.status = 'confirmed'

      union all

      select
        e.child_cat_id,
        d.depth + 1,
        d.path || e.child_cat_id
      from cat_lineage_edges e
      join descendants d on e.parent_cat_id = d.id
      where e.status = 'confirmed'
        and d.depth < 25
        and not e.child_cat_id = any(d.path)
    )
    select id::text as id
    from descendants
    where id = ${parentCatId}::uuid
    limit 1
  `);

  return result.rows.length > 0;
}

function validateRoleSex(role: LineageParentRole, parent: CatSnapshotSource) {
  if (role === "sire" && parent.sex === "female") {
    return "A dam/female cat cannot be linked as sire.";
  }
  if (role === "dam" && parent.sex === "male") {
    return "A sire/male cat cannot be linked as dam.";
  }
  return null;
}

export async function setInternalParent(
  childCatId: string,
  parentRole: LineageParentRole,
  _prevState: LineageActionState,
  formData: FormData
): Promise<LineageActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const roleResult = lineageParentRoleSchema.safeParse(parentRole);
  if (!roleResult.success) {
    return { error: "Invalid parent role." };
  }

  const parsed = internalParentSchema.safeParse({
    parentCatId: formData.get("parentCatId"),
    notes: (formData.get("notes") as string | null)?.trim() || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const userId = session.user.id;
  const { parentCatId, notes } = parsed.data;

  if (parentCatId === childCatId) {
    return { error: "A cat cannot be its own parent." };
  }

  const [child] = await db
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
    .where(eq(cats.id, childCatId))
    .limit(1);

  const [parent] = await db
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
    .where(eq(cats.id, parentCatId))
    .limit(1);

  if (!child || child.ownerId !== userId) {
    return { error: "Cat not found or access denied." };
  }

  if (!parent || parent.ownerId !== userId) {
    return {
      error: "For internal lineage, choose a parent from your own records.",
    };
  }

  const roleError = validateRoleSex(roleResult.data, parent);
  if (roleError) {
    return { error: roleError };
  }

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { error: "User not found." };
  }

  const [currentForRole] = await db
    .select({
      id: catLineageEdges.id,
      parentCatId: catLineageEdges.parentCatId,
    })
    .from(catLineageEdges)
    .where(
      and(
        eq(catLineageEdges.childCatId, childCatId),
        eq(catLineageEdges.parentRole, roleResult.data),
        eq(catLineageEdges.status, "confirmed")
      )
    )
    .limit(1);

  if (currentForRole?.parentCatId === parentCatId) {
    await db
      .update(catLineageEdges)
      .set({ notes: notes ?? null, updatedAt: new Date() })
      .where(eq(catLineageEdges.id, currentForRole.id));

    revalidatePath(`/${user.username}/${child.slug}/lineage`);
    return { success: "Lineage link already exists. Notes updated." };
  }

  const [samePairOtherRole] = await db
    .select({ id: catLineageEdges.id })
    .from(catLineageEdges)
    .where(
      and(
        eq(catLineageEdges.parentCatId, parentCatId),
        eq(catLineageEdges.childCatId, childCatId),
        eq(catLineageEdges.status, "confirmed"),
        ne(catLineageEdges.parentRole, roleResult.data)
      )
    )
    .limit(1);

  if (samePairOtherRole) {
    return { error: "This cat is already linked to the child with another role." };
  }

  if (await wouldCreateCycle(parentCatId, childCatId)) {
    return {
      error:
        "This link would create a lineage cycle. A cat cannot be both ancestor and descendant.",
    };
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    if (currentForRole) {
      await tx
        .update(catLineageEdges)
        .set({ status: "revoked", updatedAt: now })
        .where(eq(catLineageEdges.id, currentForRole.id));
    }

    await tx.insert(catLineageEdges).values({
      parentCatId,
      childCatId,
      parentRole: roleResult.data,
      status: "confirmed",
      sourceType: "internal",
      createdByUserId: userId,
      confirmedByUserId: userId,
      notes: notes ?? null,
      identitySnapshot: {
        parent: snapshotCat(parent),
        child: snapshotCat(child),
      },
      confirmedAt: now,
      updatedAt: now,
    });
  });

  revalidatePath(`/${user.username}/${child.slug}`);
  revalidatePath(`/${user.username}/${child.slug}/lineage`);
  revalidatePath(`/${user.username}/${parent.slug}/lineage`);

  return { success: "Lineage link updated." };
}

export async function removeLineageEdge(
  edgeId: string,
  _formData?: FormData
): Promise<void> {
  void _formData;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [edge] = await db
    .select({
      id: catLineageEdges.id,
      parentCatId: catLineageEdges.parentCatId,
      childCatId: catLineageEdges.childCatId,
      status: catLineageEdges.status,
    })
    .from(catLineageEdges)
    .where(eq(catLineageEdges.id, edgeId))
    .limit(1);

  if (!edge || edge.status !== "confirmed") return;

  const [child] = await db
    .select({ ownerId: cats.ownerId, slug: cats.slug })
    .from(cats)
    .where(eq(cats.id, edge.childCatId))
    .limit(1);

  if (!child || child.ownerId !== session.user.id) return;

  const [parent] = await db
    .select({ slug: cats.slug })
    .from(cats)
    .where(eq(cats.id, edge.parentCatId))
    .limit(1);

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  await db
    .update(catLineageEdges)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(catLineageEdges.id, edgeId));

  if (user) {
    revalidatePath(`/${user.username}/${child.slug}`);
    revalidatePath(`/${user.username}/${child.slug}/lineage`);
    if (parent) {
      revalidatePath(`/${user.username}/${parent.slug}/lineage`);
    }
  }
}
