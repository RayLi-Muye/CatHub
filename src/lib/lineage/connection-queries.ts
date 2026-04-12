import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { LineageParentRole } from "@/lib/validators/lineage";

export type LineageConnectionRequestSummary = {
  id: string;
  status: "pending" | "accepted" | "declined" | "canceled";
  parentRole: LineageParentRole;
  requestNote: string | null;
  responseNote: string | null;
  createdAt: Date;
  respondedAt: Date | null;
  child: {
    id: string;
    name: string;
    breed: string | null;
    sex: "male" | "female" | "unknown" | null;
    slug: string;
    username: string;
    ownerDisplayName: string | null;
  };
  parent: {
    id: string;
    name: string;
    breed: string | null;
    sex: "male" | "female" | "unknown" | null;
    slug: string;
    username: string;
    ownerDisplayName: string | null;
  };
  requester: {
    username: string;
    displayName: string | null;
  };
  responder: {
    username: string;
    displayName: string | null;
  };
};

type LineageConnectionRequestRow = {
  id: string;
  status: "pending" | "accepted" | "declined" | "canceled";
  parent_role: LineageParentRole;
  request_note: string | null;
  response_note: string | null;
  created_at: Date;
  responded_at: Date | null;
  child_id: string;
  child_name: string;
  child_breed: string | null;
  child_sex: "male" | "female" | "unknown" | null;
  child_slug: string;
  child_username: string;
  child_owner_display_name: string | null;
  parent_id: string;
  parent_name: string;
  parent_breed: string | null;
  parent_sex: "male" | "female" | "unknown" | null;
  parent_slug: string;
  parent_username: string;
  parent_owner_display_name: string | null;
  requester_username: string;
  requester_display_name: string | null;
  responder_username: string;
  responder_display_name: string | null;
};

function mapRequestRow(
  row: LineageConnectionRequestRow
): LineageConnectionRequestSummary {
  return {
    id: row.id,
    status: row.status,
    parentRole: row.parent_role,
    requestNote: row.request_note,
    responseNote: row.response_note,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
    child: {
      id: row.child_id,
      name: row.child_name,
      breed: row.child_breed,
      sex: row.child_sex,
      slug: row.child_slug,
      username: row.child_username,
      ownerDisplayName: row.child_owner_display_name,
    },
    parent: {
      id: row.parent_id,
      name: row.parent_name,
      breed: row.parent_breed,
      sex: row.parent_sex,
      slug: row.parent_slug,
      username: row.parent_username,
      ownerDisplayName: row.parent_owner_display_name,
    },
    requester: {
      username: row.requester_username,
      displayName: row.requester_display_name,
    },
    responder: {
      username: row.responder_username,
      displayName: row.responder_display_name,
    },
  };
}

async function getPendingRequests(
  userId: string,
  direction: "incoming" | "outgoing"
) {
  const userColumn =
    direction === "incoming" ? "responder_user_id" : "requester_user_id";

  const result = await db.execute<LineageConnectionRequestRow>(sql`
    select
      r.id::text as id,
      r.status,
      r.parent_role,
      r.request_note,
      r.response_note,
      r.created_at,
      r.responded_at,
      child.id::text as child_id,
      child.name as child_name,
      child.breed as child_breed,
      child.sex as child_sex,
      child.slug as child_slug,
      child_owner.username as child_username,
      child_owner.display_name as child_owner_display_name,
      parent.id::text as parent_id,
      parent.name as parent_name,
      parent.breed as parent_breed,
      parent.sex as parent_sex,
      parent.slug as parent_slug,
      parent_owner.username as parent_username,
      parent_owner.display_name as parent_owner_display_name,
      requester.username as requester_username,
      requester.display_name as requester_display_name,
      responder.username as responder_username,
      responder.display_name as responder_display_name
    from lineage_connection_requests r
    join cats child on child.id = r.child_cat_id
    join users child_owner on child_owner.id = child.owner_id
    join cats parent on parent.id = r.parent_cat_id
    join users parent_owner on parent_owner.id = parent.owner_id
    join users requester on requester.id = r.requester_user_id
    join users responder on responder.id = r.responder_user_id
    where ${
      userColumn === "responder_user_id"
        ? sql`r.responder_user_id`
        : sql`r.requester_user_id`
    } = ${userId}::uuid
      and r.status = 'pending'
    order by r.created_at desc
  `);

  return result.rows.map(mapRequestRow);
}

export async function getLineageConnectionInbox(userId: string) {
  const [incoming, outgoing] = await Promise.all([
    getPendingRequests(userId, "incoming"),
    getPendingRequests(userId, "outgoing"),
  ]);

  return { incoming, outgoing };
}
