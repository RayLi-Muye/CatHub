"use server";

import { hash } from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signIn } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validators/user";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function register(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  const { username, email, password } = result.data;

  // Check for existing user
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)))
    .limit(1);

  if (existing) {
    return { error: "Username or email already taken" };
  }

  const passwordHash = await hash(password, 12);

  await db.insert(users).values({
    username,
    email,
    passwordHash,
    displayName: username,
  });

  // Auto sign in after registration
  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  redirect("/dashboard");
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirect: false,
    });
  } catch {
    return { error: "Invalid email or password" };
  }

  redirect("/dashboard");
}
