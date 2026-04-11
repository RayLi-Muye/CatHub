"use server";

import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cats, dailyCheckins, users } from "@/lib/db/schema";
import { dailyCheckinSchema } from "@/lib/validators/checkin";

export type CheckinActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: string;
};

export async function createDailyCheckin(
  catId: string,
  _prevState: CheckinActionState,
  formData: FormData
): Promise<CheckinActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const raw = {
    date: formData.get("date") as string,
    appetiteScore: formData.get("appetiteScore") as string,
    energyScore: formData.get("energyScore") as string,
    bowelStatus: formData.get("bowelStatus") as string,
    moodEmoji: (formData.get("moodEmoji") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  };

  const result = dailyCheckinSchema.safeParse(raw);
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

  // Verify ownership
  const [cat] = await db
    .select({ id: cats.id, ownerId: cats.ownerId, slug: cats.slug })
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);

  if (!cat || cat.ownerId !== session.user.id) {
    return { error: "Cat not found or access denied" };
  }

  // Parse date
  const checkinDate = new Date(data.date);
  // Normalize to date only (strip time)
  checkinDate.setHours(0, 0, 0, 0);

  // Check for existing check-in on same day
  const [existing] = await db
    .select({ id: dailyCheckins.id })
    .from(dailyCheckins)
    .where(
      and(eq(dailyCheckins.catId, catId), eq(dailyCheckins.date, checkinDate))
    )
    .limit(1);

  if (existing) {
    return { error: "A check-in already exists for this date" };
  }

  await db.insert(dailyCheckins).values({
    catId,
    authorId: session.user.id,
    date: checkinDate,
    appetiteScore: data.appetiteScore,
    energyScore: data.energyScore,
    bowelStatus: data.bowelStatus,
    moodEmoji: data.moodEmoji || null,
    notes: data.notes || null,
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

  return { success: "Check-in recorded!" };
}

export async function deleteDailyCheckin(
  checkinId: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [checkin] = await db
    .select({
      id: dailyCheckins.id,
      authorId: dailyCheckins.authorId,
      catId: dailyCheckins.catId,
    })
    .from(dailyCheckins)
    .where(eq(dailyCheckins.id, checkinId))
    .limit(1);

  if (!checkin || checkin.authorId !== session.user.id) {
    return { error: "Check-in not found or access denied" };
  }

  await db.delete(dailyCheckins).where(eq(dailyCheckins.id, checkinId));

  const [cat] = await db
    .select({ slug: cats.slug })
    .from(cats)
    .where(eq(cats.id, checkin.catId))
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

export async function getTodayCheckin(catId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [checkin] = await db
    .select()
    .from(dailyCheckins)
    .where(
      and(eq(dailyCheckins.catId, catId), eq(dailyCheckins.date, today))
    )
    .limit(1);

  return checkin ?? null;
}

export async function getRecentCheckins(catId: string, limit = 14) {
  return db
    .select()
    .from(dailyCheckins)
    .where(eq(dailyCheckins.catId, catId))
    .orderBy(desc(dailyCheckins.date))
    .limit(limit);
}
