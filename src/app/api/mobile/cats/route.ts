import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { slugify as transliterate } from "transliteration";
import { db } from "@/lib/db";
import { cats, users } from "@/lib/db/schema";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

const createBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  breed: z.string().trim().max(100).optional().nullable(),
  sex: z.enum(["male", "female", "unknown"]).optional(),
  birthdate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (value) =>
        value === undefined ||
        value === null ||
        value === "" ||
        !Number.isNaN(Date.parse(value)),
      { message: "Invalid birthdate" }
    ),
  description: z.string().trim().max(2000).optional().nullable(),
  colorMarkings: z.string().trim().max(255).optional().nullable(),
  microchipId: z.string().trim().max(50).optional().nullable(),
  isNeutered: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

function apiError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function slugifyCatName(name: string) {
  return (
    transliterate(name, { lowercase: true, separator: "-" }).slice(0, 100) ||
    `cat-${Date.now().toString(36)}`
  );
}

export async function POST(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const json = await request.json().catch(() => null);
  const parsed = createBodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid cat payload");
  }

  let slug = slugifyCatName(parsed.data.name);
  const [conflict] = await db
    .select({ id: cats.id })
    .from(cats)
    .where(and(eq(cats.ownerId, user.id), eq(cats.slug, slug)))
    .limit(1);
  if (conflict) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const [row] = await db
    .insert(cats)
    .values({
      ownerId: user.id,
      slug,
      name: parsed.data.name,
      breed: parsed.data.breed?.trim() || null,
      sex: parsed.data.sex ?? "unknown",
      birthdate: parsed.data.birthdate
        ? new Date(parsed.data.birthdate)
        : null,
      description: parsed.data.description?.trim() || null,
      colorMarkings: parsed.data.colorMarkings?.trim() || null,
      microchipId: parsed.data.microchipId?.trim() || null,
      isNeutered: parsed.data.isNeutered ?? false,
      isPublic: parsed.data.isPublic ?? true,
    })
    .returning({
      id: cats.id,
      slug: cats.slug,
      name: cats.name,
      breed: cats.breed,
      sex: cats.sex,
      birthdate: cats.birthdate,
      avatarUrl: cats.avatarUrl,
      description: cats.description,
      colorMarkings: cats.colorMarkings,
      isNeutered: cats.isNeutered,
      isPublic: cats.isPublic,
      createdAt: cats.createdAt,
    });

  const [owner] = await db
    .select({
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return NextResponse.json(
    {
      ok: true,
      data: {
        cat: {
          id: row.id,
          slug: row.slug,
          name: row.name,
          breed: row.breed,
          sex: row.sex,
          birthdate: row.birthdate?.toISOString() ?? null,
          avatarUrl: row.avatarUrl,
          description: row.description,
          colorMarkings: row.colorMarkings,
          isNeutered: row.isNeutered,
          isPublic: row.isPublic,
          createdAt: row.createdAt.toISOString(),
          owner: {
            username: owner?.username ?? user.username,
            displayName: owner?.displayName ?? user.displayName,
            avatarUrl: owner?.avatarUrl ?? user.avatarUrl,
          },
          isOwner: true,
        },
      },
    },
    { status: 201 }
  );
}
