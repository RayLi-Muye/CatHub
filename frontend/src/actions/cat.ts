"use server";

import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { cats, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { catSchema } from "@/lib/validators/cat";

export type CatActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100) || "cat";
}

export async function createCat(
  _prevState: CatActionState,
  formData: FormData
): Promise<CatActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
  let slug = slugify(data.name);

  // Ensure slug is unique for this user
  const [existing] = await db
    .select({ id: cats.id })
    .from(cats)
    .where(and(eq(cats.ownerId, session.user.id), eq(cats.slug, slug)))
    .limit(1);

  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Get username for redirect
  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  await db.insert(cats).values({
    ownerId: session.user.id,
    slug,
    name: data.name,
    breed: data.breed ?? null,
    sex: data.sex as "male" | "female" | "unknown",
    birthdate: data.birthdate ? new Date(data.birthdate) : null,
    description: data.description ?? null,
    colorMarkings: data.colorMarkings ?? null,
    microchipId: data.microchipId ?? null,
    isNeutered: data.isNeutered,
    isPublic: data.isPublic,
  });

  revalidatePath("/dashboard");
  redirect(`/${user.username}/${slug}`);
}

export async function updateCat(
  catId: string,
  _prevState: CatActionState,
  formData: FormData
): Promise<CatActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Verify ownership
  const [cat] = await db
    .select({ id: cats.id, ownerId: cats.ownerId, slug: cats.slug })
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);

  if (!cat || cat.ownerId !== session.user.id) {
    return { error: "Cat not found or access denied" };
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

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  await db
    .update(cats)
    .set({
      name: data.name,
      breed: data.breed ?? null,
      sex: data.sex as "male" | "female" | "unknown",
      birthdate: data.birthdate ? new Date(data.birthdate) : null,
      description: data.description ?? null,
      colorMarkings: data.colorMarkings ?? null,
      microchipId: data.microchipId ?? null,
      isNeutered: data.isNeutered,
      isPublic: data.isPublic,
      updatedAt: new Date(),
    })
    .where(eq(cats.id, catId));

  revalidatePath(`/${user.username}/${cat.slug}`);
  revalidatePath("/dashboard");
  redirect(`/${user.username}/${cat.slug}`);
}

export async function deleteCat(catId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [cat] = await db
    .select({ id: cats.id, ownerId: cats.ownerId })
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);

  if (!cat || cat.ownerId !== session.user.id) {
    return { error: "Cat not found or access denied" };
  }

  await db.delete(cats).where(eq(cats.id, catId));

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
