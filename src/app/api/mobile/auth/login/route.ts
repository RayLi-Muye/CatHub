import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validators/user";
import {
  createMobileAccessToken,
  serializeMobileUser,
} from "@/lib/mobile-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = loginSchema.safeParse(await request.json().catch(() => null));

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid login payload" },
      { status: 400 }
    );
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      passwordHash: users.passwordHash,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.email, result.data.email))
    .limit(1);

  if (!user || !(await compare(result.data.password, user.passwordHash))) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      user: serializeMobileUser({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      }),
      token: createMobileAccessToken(user.id),
    },
  });
}
