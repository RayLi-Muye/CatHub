"use server";

import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { cats, users, healthRecords, weightLogs } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { healthRecordSchema, weightLogSchema } from "@/lib/validators/health";

export type HealthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

async function verifyCatOwnership(catId: string, userId: string) {
  const [cat] = await db
    .select({ id: cats.id, ownerId: cats.ownerId, slug: cats.slug })
    .from(cats)
    .where(and(eq(cats.id, catId), eq(cats.ownerId, userId)))
    .limit(1);
  return cat;
}

async function getUsername(userId: string) {
  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user.username;
}

export async function createHealthRecord(
  catId: string,
  _prevState: HealthActionState,
  formData: FormData
): Promise<HealthActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cat = await verifyCatOwnership(catId, session.user.id);
  if (!cat) return { error: "Cat not found or access denied" };

  const raw = {
    type: formData.get("type") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    date: formData.get("date") as string,
    vetName: (formData.get("vetName") as string) || undefined,
    vetClinic: (formData.get("vetClinic") as string) || undefined,
  };

  const result = healthRecordSchema.safeParse(raw);
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

  await db.insert(healthRecords).values({
    catId,
    type: data.type as "checkup" | "vaccination" | "surgery" | "illness" | "medication" | "other",
    title: data.title,
    description: data.description ?? null,
    date: new Date(data.date),
    vetName: data.vetName ?? null,
    vetClinic: data.vetClinic ?? null,
  });

  const username = await getUsername(session.user.id);
  revalidatePath(`/${username}/${cat.slug}`);
  revalidatePath(`/${username}/${cat.slug}/health`);
  redirect(`/${username}/${cat.slug}/health`);
}

export async function deleteHealthRecord(
  recordId: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [record] = await db
    .select({
      id: healthRecords.id,
      catId: healthRecords.catId,
    })
    .from(healthRecords)
    .where(eq(healthRecords.id, recordId))
    .limit(1);

  if (!record) return { error: "Record not found" };

  const cat = await verifyCatOwnership(record.catId, session.user.id);
  if (!cat) return { error: "Access denied" };

  await db.delete(healthRecords).where(eq(healthRecords.id, recordId));

  const username = await getUsername(session.user.id);
  revalidatePath(`/${username}/${cat.slug}/health`);
  return {};
}

export async function logWeight(
  catId: string,
  _prevState: HealthActionState,
  formData: FormData
): Promise<HealthActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cat = await verifyCatOwnership(catId, session.user.id);
  if (!cat) return { error: "Cat not found or access denied" };

  const raw = {
    weightKg: formData.get("weightKg") as string,
    recordedAt: formData.get("recordedAt") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const result = weightLogSchema.safeParse(raw);
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
  const weight = parseFloat(data.weightKg);
  if (isNaN(weight) || weight <= 0 || weight > 50) {
    return { fieldErrors: { weightKg: ["Weight must be between 0 and 50 kg"] } };
  }

  await db.insert(weightLogs).values({
    catId,
    weightKg: data.weightKg,
    recordedAt: new Date(data.recordedAt),
    notes: data.notes ?? null,
  });

  const username = await getUsername(session.user.id);
  revalidatePath(`/${username}/${cat.slug}/health`);
  return { success: true };
}
