import { desc, eq } from "drizzle-orm";
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

const HEALTH_PAGE_SIZE = 20;
const HEALTH_MAX_PAGE_SIZE = 50;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ catId: string }> }
) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return apiError("Invalid cat id");

  const url = new URL(request.url);
  const offset = Math.max(
    0,
    Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0
  );
  const limit = Math.min(
    HEALTH_MAX_PAGE_SIZE,
    Math.max(
      1,
      Number.parseInt(
        url.searchParams.get("limit") ?? `${HEALTH_PAGE_SIZE}`,
        10
      ) || HEALTH_PAGE_SIZE
    )
  );

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
    .offset(offset)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;

  return NextResponse.json({
    ok: true,
    data: {
      records: slice.map((record) => ({
        id: record.id,
        type: record.type,
        title: record.title,
        description: record.description,
        date: record.date.toISOString(),
        vetName: record.vetName,
      })),
      nextOffset: hasMore ? offset + limit : null,
    },
  });
}
