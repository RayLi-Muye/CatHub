import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { LineageParentRole } from "@/lib/validators/lineage";

export type LineageCatSummary = {
  id: string;
  ownerId: string;
  username: string;
  ownerDisplayName: string | null;
  slug: string;
  name: string;
  breed: string | null;
  sex: "male" | "female" | "unknown" | null;
  birthdate: Date | null;
  avatarUrl: string | null;
  isPublic: boolean | null;
};

export type LineageEntry = {
  edgeId: string;
  depth: number;
  parentRole: LineageParentRole;
  cat: LineageCatSummary;
};

type LineageRow = {
  edge_id: string;
  depth: number;
  parent_role: LineageParentRole;
  cat_id: string;
  owner_id: string;
  username: string;
  owner_display_name: string | null;
  slug: string;
  name: string;
  breed: string | null;
  sex: "male" | "female" | "unknown" | null;
  birthdate: Date | null;
  avatar_url: string | null;
  is_public: boolean | null;
};

function mapLineageRow(row: LineageRow): LineageEntry {
  return {
    edgeId: row.edge_id,
    depth: Number(row.depth),
    parentRole: row.parent_role,
    cat: {
      id: row.cat_id,
      ownerId: row.owner_id,
      username: row.username,
      ownerDisplayName: row.owner_display_name,
      slug: row.slug,
      name: row.name,
      breed: row.breed,
      sex: row.sex,
      birthdate: row.birthdate,
      avatarUrl: row.avatar_url,
      isPublic: row.is_public,
    },
  };
}

export async function getAncestorEntries(
  catId: string,
  maxDepth = 3
): Promise<LineageEntry[]> {
  const result = await db.execute<LineageRow>(sql`
    with recursive ancestors as (
      select
        e.id as edge_id,
        e.parent_cat_id as cat_id,
        e.child_cat_id,
        e.parent_role,
        1 as depth,
        array[e.child_cat_id, e.parent_cat_id]::uuid[] as path
      from cat_lineage_edges e
      where e.child_cat_id = ${catId}::uuid
        and e.status = 'confirmed'

      union all

      select
        e.id as edge_id,
        e.parent_cat_id as cat_id,
        e.child_cat_id,
        e.parent_role,
        a.depth + 1 as depth,
        a.path || e.parent_cat_id
      from cat_lineage_edges e
      join ancestors a on e.child_cat_id = a.cat_id
      where e.status = 'confirmed'
        and a.depth < ${maxDepth}
        and not e.parent_cat_id = any(a.path)
    )
    select
      a.edge_id::text as edge_id,
      a.depth,
      a.parent_role,
      c.id::text as cat_id,
      c.owner_id::text as owner_id,
      u.username,
      u.display_name as owner_display_name,
      c.slug,
      c.name,
      c.breed,
      c.sex,
      c.birthdate,
      c.avatar_url,
      c.is_public
    from ancestors a
    join cats c on c.id = a.cat_id
    join users u on u.id = c.owner_id
    order by a.depth asc, a.parent_role asc, c.name asc
  `);

  return result.rows.map(mapLineageRow);
}

export async function getDescendantEntries(
  catId: string,
  maxDepth = 3
): Promise<LineageEntry[]> {
  const result = await db.execute<LineageRow>(sql`
    with recursive descendants as (
      select
        e.id as edge_id,
        e.child_cat_id as cat_id,
        e.parent_cat_id,
        e.parent_role,
        1 as depth,
        array[e.parent_cat_id, e.child_cat_id]::uuid[] as path
      from cat_lineage_edges e
      where e.parent_cat_id = ${catId}::uuid
        and e.status = 'confirmed'

      union all

      select
        e.id as edge_id,
        e.child_cat_id as cat_id,
        e.parent_cat_id,
        e.parent_role,
        d.depth + 1 as depth,
        d.path || e.child_cat_id
      from cat_lineage_edges e
      join descendants d on e.parent_cat_id = d.cat_id
      where e.status = 'confirmed'
        and d.depth < ${maxDepth}
        and not e.child_cat_id = any(d.path)
    )
    select
      d.edge_id::text as edge_id,
      d.depth,
      d.parent_role,
      c.id::text as cat_id,
      c.owner_id::text as owner_id,
      u.username,
      u.display_name as owner_display_name,
      c.slug,
      c.name,
      c.breed,
      c.sex,
      c.birthdate,
      c.avatar_url,
      c.is_public
    from descendants d
    join cats c on c.id = d.cat_id
    join users u on u.id = c.owner_id
    order by d.depth asc, c.name asc
  `);

  return result.rows.map(mapLineageRow);
}

export function groupLineageByDepth(entries: LineageEntry[]) {
  return entries.reduce<Record<number, LineageEntry[]>>((groups, entry) => {
    groups[entry.depth] ??= [];
    groups[entry.depth].push(entry);
    return groups;
  }, {});
}
