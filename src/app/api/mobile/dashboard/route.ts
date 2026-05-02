import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cats } from "@/lib/db/schema";
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

  const myCats = await db
    .select({
      id: cats.id,
      slug: cats.slug,
      name: cats.name,
      breed: cats.breed,
      sex: cats.sex,
      birthdate: cats.birthdate,
      avatarUrl: cats.avatarUrl,
      description: cats.description,
      isPublic: cats.isPublic,
      createdAt: cats.createdAt,
    })
    .from(cats)
    .where(eq(cats.ownerId, user.id))
    .orderBy(cats.createdAt);

  return NextResponse.json({
    ok: true,
    data: {
      user: serializeMobileUser(user),
      cats: myCats.map((cat) => ({
        ...cat,
        birthdate: cat.birthdate?.toISOString() ?? null,
        createdAt: cat.createdAt.toISOString(),
      })),
    },
  });
}
