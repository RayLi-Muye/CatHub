import { z } from "zod/v4";

export const timelinePostSchema = z.object({
  content: z
    .string()
    .min(1, "Post content is required")
    .max(1000, "Post must be 1000 characters or fewer"),
  isHealthAlert: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined
    ),
});
