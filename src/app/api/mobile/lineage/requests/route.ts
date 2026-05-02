import { NextResponse } from "next/server";
import { getLineageConnectionInbox } from "@/lib/lineage/connection-queries";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

function apiError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function serializeSummary(
  row: Awaited<ReturnType<typeof getLineageConnectionInbox>>["incoming"][number]
) {
  return {
    id: row.id,
    status: row.status,
    parentRole: row.parentRole,
    requestNote: row.requestNote,
    responseNote: row.responseNote,
    createdAt: row.createdAt.toISOString(),
    respondedAt: row.respondedAt ? row.respondedAt.toISOString() : null,
    child: row.child,
    parent: row.parent,
    requester: row.requester,
    responder: row.responder,
  };
}

export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const { incoming, outgoing } = await getLineageConnectionInbox(user.id);

  return NextResponse.json({
    ok: true,
    data: {
      incoming: incoming.map(serializeSummary),
      outgoing: outgoing.map(serializeSummary),
    },
  });
}
