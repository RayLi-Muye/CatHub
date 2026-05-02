import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { cats, dailyCheckins } from "@/lib/db/schema";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

const paramsSchema = z.object({ catId: z.uuid() });

const bodySchema = z.object({
  date: z
    .string()
    .min(1, "Date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Invalid date",
    }),
  appetiteScore: z.coerce.number().int().min(1).max(5),
  energyScore: z.coerce.number().int().min(1).max(5),
  bowelStatus: z.enum([
    "normal",
    "soft",
    "hard",
    "diarrhea",
    "constipation",
    "none",
  ]),
  moodEmoji: z.string().trim().max(10).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

function apiError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ catId: string }> }
) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return apiError("Invalid cat id");

  const json = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return apiError(
      parsedBody.error.issues[0]?.message ?? "Invalid check-in payload"
    );
  }

  const [cat] = await db
    .select({ id: cats.id, ownerId: cats.ownerId })
    .from(cats)
    .where(eq(cats.id, parsedParams.data.catId))
    .limit(1);

  if (!cat || cat.ownerId !== user.id) {
    return apiError("Cat not found or access denied", 404);
  }

  const checkinDate = new Date(parsedBody.data.date);
  checkinDate.setHours(0, 0, 0, 0);

  const [existing] = await db
    .select({ id: dailyCheckins.id })
    .from(dailyCheckins)
    .where(
      and(eq(dailyCheckins.catId, cat.id), eq(dailyCheckins.date, checkinDate))
    )
    .limit(1);

  if (existing) {
    return apiError("A check-in already exists for this date", 409);
  }

  const moodEmoji = parsedBody.data.moodEmoji?.trim() || null;
  const notes = parsedBody.data.notes?.trim() || null;

  const [row] = await db
    .insert(dailyCheckins)
    .values({
      catId: cat.id,
      authorId: user.id,
      date: checkinDate,
      appetiteScore: parsedBody.data.appetiteScore,
      energyScore: parsedBody.data.energyScore,
      bowelStatus: parsedBody.data.bowelStatus,
      moodEmoji,
      notes,
    })
    .returning({
      id: dailyCheckins.id,
      date: dailyCheckins.date,
      appetiteScore: dailyCheckins.appetiteScore,
      energyScore: dailyCheckins.energyScore,
      bowelStatus: dailyCheckins.bowelStatus,
      moodEmoji: dailyCheckins.moodEmoji,
      notes: dailyCheckins.notes,
    });

  return NextResponse.json(
    {
      ok: true,
      data: {
        checkin: {
          id: row.id,
          date: row.date.toISOString(),
          appetiteScore: row.appetiteScore,
          energyScore: row.energyScore,
          bowelStatus: row.bowelStatus,
          moodEmoji: row.moodEmoji,
          notes: row.notes,
        },
      },
    },
    { status: 201 }
  );
}
