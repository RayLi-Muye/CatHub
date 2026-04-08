"use server";

import { compare, hash } from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cats, users } from "@/lib/db/schema";
import {
  accountSettingsSchema,
  profileSchema,
} from "@/lib/validators/user";

export type UserSettingsState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

function collectFieldErrors(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

export async function updateProfile(
  _prevState: UserSettingsState,
  formData: FormData
): Promise<UserSettingsState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const raw = {
    displayName: formData.get("displayName") as string,
    bio: formData.get("bio") as string,
  };

  const result = profileSchema.safeParse(raw);
  if (!result.success) {
    return { fieldErrors: collectFieldErrors(result.error) };
  }

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { error: "User not found" };
  }

  await db
    .update(users)
    .set({
      displayName: result.data.displayName ?? null,
      bio: result.data.bio ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return { success: "Profile updated" };
}

export async function updateAccountCredentials(
  _prevState: UserSettingsState,
  formData: FormData
): Promise<UserSettingsState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const raw = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = accountSettingsSchema.safeParse(raw);
  if (!result.success) {
    return { fieldErrors: collectFieldErrors(result.error) };
  }

  const [user] = await db
    .select({
      username: users.username,
      email: users.email,
      passwordHash: users.passwordHash,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { error: "User not found" };
  }

  const data = result.data;
  const usernameChanged = data.username !== user.username;
  const emailChanged = data.email !== user.email;
  const passwordChanged = Boolean(data.newPassword);

  if (!usernameChanged && !emailChanged && !passwordChanged) {
    return { success: "No account changes to save" };
  }

  if (!data.currentPassword) {
    return {
      fieldErrors: {
        currentPassword: [
          "Current password is required to update login details",
        ],
      },
    };
  }

  const isValidPassword = await compare(data.currentPassword, user.passwordHash);
  if (!isValidPassword) {
    return {
      fieldErrors: {
        currentPassword: ["Current password is incorrect"],
      },
    };
  }

  if (usernameChanged || emailChanged) {
    const duplicateChecks = [];
    if (usernameChanged) {
      duplicateChecks.push(eq(users.username, data.username));
    }
    if (emailChanged) {
      duplicateChecks.push(eq(users.email, data.email));
    }

    const duplicates =
      duplicateChecks.length === 0
        ? []
        : await db
            .select({
              username: users.username,
              email: users.email,
            })
            .from(users)
            .where(
              duplicateChecks.length === 1
                ? duplicateChecks[0]
                : or(...duplicateChecks)
            )
            .limit(5);

    if (duplicates.some((duplicate) => duplicate.username === data.username)) {
      return {
        fieldErrors: {
          username: ["Username is already taken"],
        },
      };
    }

    if (duplicates.some((duplicate) => duplicate.email === data.email)) {
      return {
        fieldErrors: {
          email: ["Email is already taken"],
        },
      };
    }
  }

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (usernameChanged) {
    updates.username = data.username;
    if (!user.displayName || user.displayName === user.username) {
      updates.displayName = data.username;
    }
  }

  if (emailChanged) {
    updates.email = data.email;
  }

  if (passwordChanged && data.newPassword) {
    updates.passwordHash = await hash(data.newPassword, 12);
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  const userCats = await db
    .select({ slug: cats.slug })
    .from(cats)
    .where(eq(cats.ownerId, userId));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  if (usernameChanged) {
    revalidatePath(`/${data.username}`);
  }

  for (const cat of userCats) {
    revalidatePath(`/${user.username}/${cat.slug}`);
    revalidatePath(`/${user.username}/${cat.slug}/health`);

    if (usernameChanged) {
      revalidatePath(`/${data.username}/${cat.slug}`);
      revalidatePath(`/${data.username}/${cat.slug}/health`);
    }
  }

  if (passwordChanged && (usernameChanged || emailChanged)) {
    return { success: "Account credentials updated" };
  }

  if (passwordChanged) {
    return { success: "Password updated" };
  }

  if (usernameChanged && emailChanged) {
    return { success: "Username and email updated" };
  }

  return { success: usernameChanged ? "Username updated" : "Email updated" };
}
