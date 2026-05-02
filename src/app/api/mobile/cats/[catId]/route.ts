import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
  cats,
  dailyCheckins,
  healthRecords,
  timelinePosts,
  users,
  weightLogs,
} from "@/lib/db/schema";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import { slugify as transliterate } from "transliteration";
import { and } from "drizzle-orm";

export const runtime = "nodejs";

const paramsSchema = z.object({ catId: z.uuid() });

const TIMELINE_LIMIT = 10;
const HEALTH_LIMIT = 5;
const WEIGHT_LIMIT = 30;

const updateBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
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
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ catId: string }> }
) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return apiError("Invalid cat id");

  const [cat] = await db
    .select({
      id: cats.id,
      ownerId: cats.ownerId,
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
      ownerUsername: users.username,
      ownerDisplayName: users.displayName,
      ownerAvatarUrl: users.avatarUrl,
    })
    .from(cats)
    .innerJoin(users, eq(users.id, cats.ownerId))
    .where(eq(cats.id, parsed.data.catId))
    .limit(1);

  if (!cat) return apiError("Cat not found", 404);

  const isOwner = cat.ownerId === user.id;
  if (!isOwner && !cat.isPublic) {
    return apiError("Cat not found", 404);
  }

  const [timeline, health, weights, checkin] = await Promise.all([
    db
      .select({
        id: timelinePosts.id,
        content: timelinePosts.content,
        imageUrl: timelinePosts.imageUrl,
        videoUrl: timelinePosts.videoUrl,
        mediaType: timelinePosts.mediaType,
        isHealthAlert: timelinePosts.isHealthAlert,
        createdAt: timelinePosts.createdAt,
      })
      .from(timelinePosts)
      .where(eq(timelinePosts.catId, cat.id))
      .orderBy(desc(timelinePosts.createdAt))
      .limit(TIMELINE_LIMIT),
    db
      .select({
        id: healthRecords.id,
        type: healthRecords.type,
        title: healthRecords.title,
        description: healthRecords.description,
        date: healthRecords.date,
        vetName: healthRecords.vetName,
      })
      .from(healthRecords)
      .where(eq(healthRecords.catId, cat.id))
      .orderBy(desc(healthRecords.date))
      .limit(HEALTH_LIMIT),
    db
      .select({
        id: weightLogs.id,
        weightKg: weightLogs.weightKg,
        recordedAt: weightLogs.recordedAt,
        notes: weightLogs.notes,
      })
      .from(weightLogs)
      .where(eq(weightLogs.catId, cat.id))
      .orderBy(desc(weightLogs.recordedAt))
      .limit(WEIGHT_LIMIT),
    isOwner
      ? db
          .select({
            id: dailyCheckins.id,
            date: dailyCheckins.date,
            appetiteScore: dailyCheckins.appetiteScore,
            energyScore: dailyCheckins.energyScore,
            bowelStatus: dailyCheckins.bowelStatus,
            moodEmoji: dailyCheckins.moodEmoji,
            notes: dailyCheckins.notes,
          })
          .from(dailyCheckins)
          .where(eq(dailyCheckins.catId, cat.id))
          .orderBy(desc(dailyCheckins.date))
          .limit(1)
      : Promise.resolve([] as Array<{
          id: string;
          date: Date;
          appetiteScore: number;
          energyScore: number;
          bowelStatus:
            | "normal"
            | "soft"
            | "hard"
            | "diarrhea"
            | "constipation"
            | "none";
          moodEmoji: string | null;
          notes: string | null;
        }>),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      cat: {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        breed: cat.breed,
        sex: cat.sex,
        birthdate: cat.birthdate?.toISOString() ?? null,
        avatarUrl: cat.avatarUrl,
        description: cat.description,
        colorMarkings: cat.colorMarkings,
        isNeutered: cat.isNeutered,
        isPublic: cat.isPublic,
        createdAt: cat.createdAt.toISOString(),
        owner: {
          username: cat.ownerUsername,
          displayName: cat.ownerDisplayName,
          avatarUrl: cat.ownerAvatarUrl,
        },
        isOwner,
      },
      recentTimeline: timeline.map((post) => ({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        mediaType: post.mediaType,
        isHealthAlert: post.isHealthAlert,
        createdAt: post.createdAt.toISOString(),
      })),
      recentHealth: health.map((record) => ({
        id: record.id,
        type: record.type,
        title: record.title,
        description: record.description,
        date: record.date.toISOString(),
        vetName: record.vetName,
      })),
      recentWeights: weights.map((log) => ({
        id: log.id,
        weightKg: log.weightKg,
        recordedAt: log.recordedAt.toISOString(),
        notes: log.notes,
      })),
      latestCheckin: checkin[0]
        ? {
            id: checkin[0].id,
            date: checkin[0].date.toISOString(),
            appetiteScore: checkin[0].appetiteScore,
            energyScore: checkin[0].energyScore,
            bowelStatus: checkin[0].bowelStatus,
            moodEmoji: checkin[0].moodEmoji,
            notes: checkin[0].notes,
          }
        : null,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ catId: string }> }
) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return apiError("Invalid cat id");

  const json = await request.json().catch(() => null);
  const parsed = updateBodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid update payload");
  }

  const [existing] = await db
    .select({
      id: cats.id,
      ownerId: cats.ownerId,
      slug: cats.slug,
      name: cats.name,
    })
    .from(cats)
    .where(eq(cats.id, parsedParams.data.catId))
    .limit(1);

  if (!existing || existing.ownerId !== user.id) {
    return apiError("Cat not found or access denied", 404);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.breed !== undefined)
    updates.breed = parsed.data.breed?.trim() || null;
  if (parsed.data.sex !== undefined) updates.sex = parsed.data.sex;
  if (parsed.data.birthdate !== undefined) {
    if (!parsed.data.birthdate) {
      updates.birthdate = null;
    } else {
      updates.birthdate = new Date(parsed.data.birthdate);
    }
  }
  if (parsed.data.description !== undefined)
    updates.description = parsed.data.description?.trim() || null;
  if (parsed.data.colorMarkings !== undefined)
    updates.colorMarkings = parsed.data.colorMarkings?.trim() || null;
  if (parsed.data.microchipId !== undefined)
    updates.microchipId = parsed.data.microchipId?.trim() || null;
  if (parsed.data.isNeutered !== undefined)
    updates.isNeutered = parsed.data.isNeutered;
  if (parsed.data.isPublic !== undefined)
    updates.isPublic = parsed.data.isPublic;

  // Regenerate slug only when name changes.
  let nextSlug = existing.slug;
  if (parsed.data.name && parsed.data.name !== existing.name) {
    let candidate = slugifyCatName(parsed.data.name);
    const [conflict] = await db
      .select({ id: cats.id })
      .from(cats)
      .where(and(eq(cats.ownerId, user.id), eq(cats.slug, candidate)))
      .limit(1);
    if (conflict && conflict.id !== existing.id) {
      candidate = `${candidate}-${Date.now().toString(36)}`;
    }
    nextSlug = candidate;
    updates.slug = nextSlug;
  }

  updates.updatedAt = new Date();

  const [row] = await db
    .update(cats)
    .set(updates)
    .where(eq(cats.id, existing.id))
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

  return NextResponse.json({
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
  });
}
