"use server";

import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { slugify as transliterate } from "transliteration";
import { db } from "@/lib/db";
import { catImages, cats, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { catSchema } from "@/lib/validators/cat";
import {
  deleteStoredAvatar,
  getAvatarFile,
  saveCatAvatar,
  validateAvatarFile,
} from "@/lib/storage/cat-images";

export type CatActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function slugify(name: string): string {
  return transliterate(name, { lowercase: true, separator: "-" }).slice(0, 100) || `cat-${Date.now().toString(36)}`;
}

export async function createCat(
  _prevState: CatActionState,
  formData: FormData
): Promise<CatActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const raw = {
    name: formData.get("name") as string,
    breed: (formData.get("breed") as string) || undefined,
    sex: (formData.get("sex") as string) || "unknown",
    birthdate: (formData.get("birthdate") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    colorMarkings: (formData.get("colorMarkings") as string) || undefined,
    microchipId: (formData.get("microchipId") as string) || undefined,
    isNeutered: formData.get("isNeutered") === "on",
    isPublic: formData.get("isPublic") !== "off",
  };

  const result = catSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  const avatarFile = getAvatarFile(formData);
  const avatarError = validateAvatarFile(avatarFile);
  if (avatarError) {
    return { fieldErrors: { avatar: [avatarError] } };
  }

  const data = result.data;
  const catId = randomUUID();
  let slug = slugify(data.name);

  // Ensure slug is unique for this user
  const [existing] = await db
    .select({ id: cats.id })
    .from(cats)
    .where(and(eq(cats.ownerId, userId), eq(cats.slug, slug)))
    .limit(1);

  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Get username for redirect
  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { error: "User not found" };
  }

  let uploadedAvatar:
    | Awaited<ReturnType<typeof saveCatAvatar>>
    | null = null;

  if (avatarFile) {
    try {
      uploadedAvatar = await saveCatAvatar({ catId, file: avatarFile, slug });
    } catch {
      return { error: "Failed to upload avatar. Please try again." };
    }
  }

  try {
    await db.transaction(async (tx) => {
      const catValues: typeof cats.$inferInsert = {
        id: catId,
        ownerId: userId,
        slug,
        name: data.name,
        breed: data.breed ?? null,
        sex: data.sex as "male" | "female" | "unknown",
        birthdate: data.birthdate ? new Date(data.birthdate) : null,
        description: data.description ?? null,
        avatarUrl: uploadedAvatar?.publicUrl ?? null,
        colorMarkings: data.colorMarkings ?? null,
        microchipId: data.microchipId ?? null,
        isNeutered: data.isNeutered,
        isPublic: data.isPublic,
      };

      await tx.insert(cats).values(catValues);

      if (uploadedAvatar) {
        await tx.insert(catImages).values({
          catId,
          url: uploadedAvatar.publicUrl,
          filename: uploadedAvatar.filename,
          mimeType: uploadedAvatar.mimeType,
          sizeBytes: uploadedAvatar.sizeBytes,
          isPrimary: true,
          sortOrder: 0,
        });
      }
    });
  } catch (error) {
    if (uploadedAvatar) {
      await deleteStoredAvatar(uploadedAvatar.publicUrl);
    }
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);
  redirect(`/${user.username}/${slug}`);
}

export async function updateCat(
  catId: string,
  _prevState: CatActionState,
  formData: FormData
): Promise<CatActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // Verify ownership
  const [cat] = await db
    .select({
      id: cats.id,
      ownerId: cats.ownerId,
      slug: cats.slug,
      avatarUrl: cats.avatarUrl,
    })
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);

  if (!cat || cat.ownerId !== userId) {
    return { error: "Cat not found or access denied" };
  }

  const avatarFile = getAvatarFile(formData);
  const avatarError = validateAvatarFile(avatarFile);
  if (avatarError) {
    return { fieldErrors: { avatar: [avatarError] } };
  }

  const raw = {
    name: formData.get("name") as string,
    breed: (formData.get("breed") as string) || undefined,
    sex: (formData.get("sex") as string) || "unknown",
    birthdate: (formData.get("birthdate") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    colorMarkings: (formData.get("colorMarkings") as string) || undefined,
    microchipId: (formData.get("microchipId") as string) || undefined,
    isNeutered: formData.get("isNeutered") === "on",
    isPublic: formData.get("isPublic") !== "off",
  };

  const result = catSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  const data = result.data;
  const [currentPrimaryImage] = await db
    .select({ id: catImages.id, url: catImages.url })
    .from(catImages)
    .where(and(eq(catImages.catId, cat.id), eq(catImages.isPrimary, true)))
    .limit(1);

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { error: "User not found" };
  }

  let uploadedAvatar:
    | Awaited<ReturnType<typeof saveCatAvatar>>
    | null = null;

  if (avatarFile) {
    try {
      uploadedAvatar = await saveCatAvatar({ catId, file: avatarFile, slug: cat.slug });
    } catch {
      return { error: "Failed to upload avatar. Please try again." };
    }
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(cats)
        .set({
          name: data.name,
          breed: data.breed ?? null,
          sex: data.sex as "male" | "female" | "unknown",
          birthdate: data.birthdate ? new Date(data.birthdate) : null,
          description: data.description ?? null,
          avatarUrl: uploadedAvatar?.publicUrl ?? cat.avatarUrl ?? null,
          colorMarkings: data.colorMarkings ?? null,
          microchipId: data.microchipId ?? null,
          isNeutered: data.isNeutered,
          isPublic: data.isPublic,
          updatedAt: new Date(),
        })
        .where(eq(cats.id, catId));

      if (uploadedAvatar) {
        if (currentPrimaryImage) {
          await tx.delete(catImages).where(eq(catImages.id, currentPrimaryImage.id));
        }

        await tx.insert(catImages).values({
          catId,
          url: uploadedAvatar.publicUrl,
          filename: uploadedAvatar.filename,
          mimeType: uploadedAvatar.mimeType,
          sizeBytes: uploadedAvatar.sizeBytes,
          isPrimary: true,
          sortOrder: 0,
        });
      }
    });
  } catch (error) {
    if (uploadedAvatar) {
      await deleteStoredAvatar(uploadedAvatar.publicUrl);
    }
    throw error;
  }

  if (uploadedAvatar) {
    await deleteStoredAvatar(currentPrimaryImage?.url ?? cat.avatarUrl);
  }

  revalidatePath(`/${user.username}/${cat.slug}`);
  revalidatePath(`/${user.username}`);
  revalidatePath("/dashboard");
  redirect(`/${user.username}/${cat.slug}`);
}

export async function deleteCat(catId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [cat] = await db
    .select({ id: cats.id, ownerId: cats.ownerId, avatarUrl: cats.avatarUrl })
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);

  if (!cat || cat.ownerId !== userId) {
    return { error: "Cat not found or access denied" };
  }

  const imageRows = await db
    .select({ url: catImages.url })
    .from(catImages)
    .where(eq(catImages.catId, catId));

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await db.delete(cats).where(eq(cats.id, catId));

  const imageUrls = new Set(
    [cat.avatarUrl, ...imageRows.map((image) => image.url)].filter(Boolean)
  );

  await Promise.all(
    [...imageUrls].map((imageUrl) => deleteStoredAvatar(imageUrl))
  );

  revalidatePath("/dashboard");
  if (user) {
    revalidatePath(`/${user.username}`);
  }
  redirect("/dashboard");
}
