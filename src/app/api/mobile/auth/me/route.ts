import { NextResponse } from "next/server";
import { getMobileAuthUser, serializeMobileUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: { user: serializeMobileUser(user) },
  });
}
