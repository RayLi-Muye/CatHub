import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { LineageParentRole } from "@/lib/validators/lineage";

export type CatSnapshotSource = {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  breed: string | null;
  sex: "male" | "female" | "unknown" | null;
  birthdate: Date | null;
  avatarUrl: string | null;
};

export function snapshotCat(cat: CatSnapshotSource) {
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

export async function wouldCreateCycle(
  parentCatId: string,
  childCatId: string
) {
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
        and not e.child_cat_id = any(d.path)
    )
    select id::text as id
    from descendants
    where id = ${parentCatId}::uuid
    limit 1
  `);

  return result.rows.length > 0;
}

export function validateRoleSex(
  role: LineageParentRole,
  parent: CatSnapshotSource
) {
  if (role === "sire" && parent.sex === "female") {
    return "A dam/female cat cannot be linked as sire.";
  }
  if (role === "dam" && parent.sex === "male") {
    return "A sire/male cat cannot be linked as dam.";
  }
  return null;
}
