import { put } from "@vercel/blob";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { cats, timelinePosts } from "@/lib/db/schema";
import { getMobileAuthUser } from "@/lib/mobile-auth";

const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const paramsSchema = z.object({ catId: z.uuid() });

const contentSchema = z
  .string()
  .trim()
  .min(1, "Post content is required")
  .max(1000, "Post must be 1000 characters or fewer");

function apiError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function extensionFor(mimeType: string) {
  const sub = mimeType.split("/")[1];
  if (!sub) return "bin";
  return sub === "jpeg" ? "jpg" : sub;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ catId: string }> }
) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return apiError("Invalid cat id");

  const rawFormData = await request.formData().catch(() => null);
  if (!rawFormData) return apiError("Expected multipart/form-data body");

  // Node's typings for the global FormData lose method definitions when DOM
  // globals are also present (interface merge resolves to `{}`). The runtime
  // value is fully spec-compliant, so re-type it via a minimal contract.
  type FormDataLike = {
    get: (name: string) => string | File | null;
  };
  const formData = rawFormData as unknown as FormDataLike;

  const contentParse = contentSchema.safeParse(formData.get("content"));
  if (!contentParse.success) {
    return apiError(
      contentParse.error.issues[0]?.message ?? "Invalid post content"
    );
  }

  const isHealthAlert = formData.get("isHealthAlert") === "true";
  const tagsRaw = formData.get("tags");
  const tags =
    typeof tagsRaw === "string" && tagsRaw.trim()
      ? tagsRaw
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 10)
      : null;

  const [cat] = await db
    .select({ id: cats.id, ownerId: cats.ownerId })
    .from(cats)
    .where(eq(cats.id, parsedParams.data.catId))
    .limit(1);

  if (!cat || cat.ownerId !== user.id) {
    return apiError("Cat not found or access denied", 404);
  }

  let imageUrl: string | null = null;
  let mediaType: "none" | "image" | "video" = "none";

  const imageEntry = formData.get("image");
  if (imageEntry instanceof File && imageEntry.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.has(imageEntry.type)) {
      return apiError("Image must be JPEG, PNG, WEBP, or GIF");
    }
    if (imageEntry.size > MAX_IMAGE_SIZE) {
      return apiError("Image must be 5 MB or smaller");
    }

    const filename = `timeline/${cat.id}-${randomUUID()}.${extensionFor(imageEntry.type)}`;
    try {
      const blob = await put(filename, imageEntry, {
        access: "public",
        addRandomSuffix: false,
      });
      imageUrl = blob.url;
      mediaType = "image";
    } catch {
      return apiError("Failed to upload image", 500);
    }
  }

  const [post] = await db
    .insert(timelinePosts)
    .values({
      catId: cat.id,
      authorId: user.id,
      content: contentParse.data,
      imageUrl,
      videoUrl: null,
      mediaType,
      isHealthAlert,
      tags,
    })
    .returning({
      id: timelinePosts.id,
      content: timelinePosts.content,
      imageUrl: timelinePosts.imageUrl,
      videoUrl: timelinePosts.videoUrl,
      mediaType: timelinePosts.mediaType,
      isHealthAlert: timelinePosts.isHealthAlert,
      createdAt: timelinePosts.createdAt,
    });

  return NextResponse.json(
    {
      ok: true,
      data: {
        post: {
          id: post.id,
          content: post.content,
          imageUrl: post.imageUrl,
          videoUrl: post.videoUrl,
          mediaType: post.mediaType,
          isHealthAlert: post.isHealthAlert,
          createdAt: post.createdAt.toISOString(),
        },
      },
    },
    { status: 201 }
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ catId: string }> }
) {
  const user = await getMobileAuthUser(request);
  if (!user) return apiError("Not authenticated", 401);

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return apiError("Invalid cat id");

  const url = new URL(request.url);
  const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      Number.parseInt(url.searchParams.get("limit") ?? `${PAGE_SIZE}`, 10) ||
        PAGE_SIZE
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
    .offset(offset)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;

  return NextResponse.json({
    ok: true,
    data: {
      posts: slice.map((post) => ({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        mediaType: post.mediaType,
        isHealthAlert: post.isHealthAlert,
        createdAt: post.createdAt.toISOString(),
      })),
      nextOffset: hasMore ? offset + limit : null,
    },
  });
}
