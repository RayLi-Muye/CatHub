import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { cats, healthRecords } from "@/lib/db/schema";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

const paramsSchema = z.object({ catId: z.uuid() });

const bodySchema = z.object({
  type: z.enum([
    "checkup",
    "vaccination",
    "surgery",
    "illness",
    "medication",
    "other",
  ]),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Invalid date",
    }),
  vetName: z.string().trim().max(100).optional().nullable(),
  vetClinic: z.string().trim().max(200).optional().nullable(),
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
      parsed.error.issues[0]?.message ?? "Invalid health record payload"
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

  const [row] = await db
    .insert(healthRecords)
    .values({
      catId: cat.id,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description?.trim() || null,
      date: new Date(parsed.data.date),
      vetName: parsed.data.vetName?.trim() || null,
      vetClinic: parsed.data.vetClinic?.trim() || null,
    })
    .returning({
      id: healthRecords.id,
      type: healthRecords.type,
      title: healthRecords.title,
      description: healthRecords.description,
      date: healthRecords.date,
      vetName: healthRecords.vetName,
    });

  return NextResponse.json(
    {
      ok: true,
      data: {
        record: {
          id: row.id,
          type: row.type,
          title: row.title,
          description: row.description,
          date: row.date.toISOString(),
          vetName: row.vetName,
        },
      },
    },
    { status: 201 }
  );
}
