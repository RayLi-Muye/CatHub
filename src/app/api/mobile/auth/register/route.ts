import { hash } from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validators/user";
import {
  createMobileAccessToken,
  serializeMobileUser,
} from "@/lib/mobile-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = registerSchema.safeParse(await request.json().catch(() => null));

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid registration payload" },
      { status: 400 }
    );
  }

  const { username, email, password } = result.data;
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Username or email already taken" },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({
      username,
      email,
      passwordHash,
      displayName: username,
    })
    .returning({
      id: users.id,
      email: users.email,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    });

  return NextResponse.json(
    {
      ok: true,
      data: {
        user: serializeMobileUser(user),
        token: createMobileAccessToken(user.id),
      },
    },
    { status: 201 }
  );
}
