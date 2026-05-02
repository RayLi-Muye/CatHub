import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { cats, weightLogs } from "@/lib/db/schema";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

const paramsSchema = z.object({ catId: z.uuid() });

const bodySchema = z.object({
  weightKg: z
    .union([z.string(), z.number()])
    .transform((value) => (typeof value === "number" ? value.toString() : value))
    .pipe(
      z
        .string()
        .min(1, "Weight is required")
        .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), {
          message: "Weight must be a number with up to 2 decimals",
        })
    ),
  recordedAt: z
    .string()
    .min(1, "Date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Invalid date",
    }),
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
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "Invalid weight log payload"
    );
  }

  const weight = Number.parseFloat(parsed.data.weightKg);
  if (Number.isNaN(weight) || weight <= 0 || weight > 50) {
    return apiError("Weight must be between 0 and 50 kg");
  }

  const [cat] = await db
    .select({ id: cats.id, ownerId: cats.ownerId })
    .from(cats)
    .where(eq(cats.id, parsedParams.data.catId))
    .limit(1);

  if (!cat || cat.ownerId !== user.id) {
    return apiError("Cat not found or access denied", 404);
  }

  const [row] = await db
    .insert(weightLogs)
    .values({
      catId: cat.id,
      weightKg: parsed.data.weightKg,
      recordedAt: new Date(parsed.data.recordedAt),
      notes: parsed.data.notes?.trim() || null,
    })
    .returning({
      id: weightLogs.id,
      weightKg: weightLogs.weightKg,
      recordedAt: weightLogs.recordedAt,
      notes: weightLogs.notes,
    });

  return NextResponse.json(
    {
      ok: true,
      data: {
        weight: {
          id: row.id,
          weightKg: row.weightKg,
          recordedAt: row.recordedAt.toISOString(),
          notes: row.notes,
        },
      },
    },
    { status: 201 }
  );
}

const WEIGHTS_MAX = 200;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ catId: string }> }
) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return apiError("Invalid cat id");

  const [cat] = await db
    .select({ id: cats.id, ownerId: cats.ownerId, isPublic: cats.isPublic })
    .from(cats)
    .where(eq(cats.id, parsedParams.data.catId))
    .limit(1);

  if (!cat) return apiError("Cat not found", 404);
  if (cat.ownerId !== user.id && !cat.isPublic) {
    return apiError("Cat not found", 404);
  }

  const rows = await db
    .select({
      id: weightLogs.id,
      weightKg: weightLogs.weightKg,
      recordedAt: weightLogs.recordedAt,
      notes: weightLogs.notes,
    })
    .from(weightLogs)
    .where(eq(weightLogs.catId, cat.id))
    .orderBy(desc(weightLogs.recordedAt))
    .limit(WEIGHTS_MAX);

  return NextResponse.json({
    ok: true,
    data: {
      weights: rows.map((row) => ({
        id: row.id,
        weightKg: row.weightKg,
        recordedAt: row.recordedAt.toISOString(),
        notes: row.notes,
      })),
    },
  });
}
