"use server";

import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cats, timelinePosts, users } from "@/lib/db/schema";

export type TimelineActionState = {
  error?: string;
  success?: string;
};

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function createTimelinePost(
  catId: string,
  _prevState: TimelineActionState,
  formData: FormData
): Promise<TimelineActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const content = (formData.get("content") as string)?.trim();
  if (!content) {
    return { error: "Post content is required" };
  }
  if (content.length > 1000) {
    return { error: "Post must be 1000 characters or fewer" };
  }

  // Verify ownership
  const [cat] = await db
    .select({ id: cats.id, ownerId: cats.ownerId, slug: cats.slug })
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);

  if (!cat || cat.ownerId !== session.user.id) {
    return { error: "Cat not found or access denied" };
  }

  // Handle optional image
  let imageUrl: string | null = null;
  const imageFile = formData.get("image");

  if (imageFile instanceof File && imageFile.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.has(imageFile.type)) {
      return { error: "Image must be PNG, JPG, WEBP, or GIF" };
    }
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return { error: "Image must be 5 MB or smaller" };
    }

    const ext =
      imageFile.type.split("/")[1] === "jpeg"
        ? "jpg"
        : imageFile.type.split("/")[1];
    const filename = `timeline/${catId}-${randomUUID()}.${ext}`;
    const blob = await put(filename, imageFile, {
      access: "public",
      addRandomSuffix: false,
    });
    imageUrl = blob.url;
  }

  await db.insert(timelinePosts).values({
    catId,
    authorId: session.user.id,
    content,
    imageUrl,
  });

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user) {
    revalidatePath(`/${user.username}/${cat.slug}/timeline`);
    revalidatePath(`/${user.username}/${cat.slug}`);
  }

  return { success: "Posted!" };
}

export async function deleteTimelinePost(
  postId: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [post] = await db
    .select({
      id: timelinePosts.id,
      authorId: timelinePosts.authorId,
      catId: timelinePosts.catId,
      imageUrl: timelinePosts.imageUrl,
    })
    .from(timelinePosts)
    .where(eq(timelinePosts.id, postId))
    .limit(1);

  if (!post || post.authorId !== session.user.id) {
    return { error: "Post not found or access denied" };
  }

  // Delete image from blob if present
  if (post.imageUrl?.startsWith("https://")) {
    try {
      await del(post.imageUrl);
    } catch {
      /* ignore */
    }
  }

  await db.delete(timelinePosts).where(eq(timelinePosts.id, postId));

  const [cat] = await db
    .select({ slug: cats.slug, ownerId: cats.ownerId })
    .from(cats)
    .where(eq(cats.id, post.catId))
    .limit(1);

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user && cat) {
    revalidatePath(`/${user.username}/${cat.slug}/timeline`);
    revalidatePath(`/${user.username}/${cat.slug}`);
  }

  return {};
}
