import { z } from "zod/v4";

function emptyStringToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(40, "Username must be at most 40 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, hyphens and underscores"
  );

const emailSchema = z.email("Invalid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be at most 100 characters");

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  displayName: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .max(100, "Display name must be at most 100 characters")
      .optional()
  ),
  bio: z.preprocess(
    emptyStringToUndefined,
    z.string().max(500, "Bio must be at most 500 characters").optional()
  ),
});

export const accountSettingsSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    currentPassword: z.preprocess(
      emptyStringToUndefined,
      z.string().max(100, "Current password is too long").optional()
    ),
    newPassword: z.preprocess(emptyStringToUndefined, passwordSchema.optional()),
    confirmPassword: z.preprocess(
      emptyStringToUndefined,
      z.string().max(100, "Password confirmation is too long").optional()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword && !data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Please confirm your new password",
        path: ["confirmPassword"],
      });
    }

    if (!data.newPassword && data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a new password first",
        path: ["newPassword"],
      });
    }

    if (
      data.newPassword &&
      data.confirmPassword &&
      data.newPassword !== data.confirmPassword
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });
