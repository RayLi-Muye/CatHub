import { z } from "zod/v4";

export const lineageParentRoleSchema = z.enum(["sire", "dam", "unknown"]);

export const internalParentSchema = z.object({
  parentCatId: z.uuid("Choose a cat from your records"),
  notes: z.string().max(1000, "Notes must be at most 1000 characters").optional(),
});

export const externalParentRoleSchema = z.enum(["sire", "dam"]);

export const externalLineageRequestSchema = z.object({
  parentRole: externalParentRoleSchema,
  identityCode: z
    .string()
    .trim()
    .min(1, "Enter the shared identity code")
    .max(32, "Identity code is too long")
    .transform((value) => value.toUpperCase())
    .pipe(
      z.string().regex(
        /^CAT-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/,
        "Use a valid CAT-XXXX-XXXX-XXXX identity code"
      )
    ),
  requestNote: z
    .string()
    .trim()
    .max(1000, "Note must be at most 1000 characters")
    .optional()
    .transform((value) => value || undefined),
});

export const lineageConnectionResponseSchema = z.object({
  responseNote: z
    .string()
    .trim()
    .max(1000, "Response note must be at most 1000 characters")
    .optional()
    .transform((value) => value || undefined),
});

export type LineageParentRole = z.infer<typeof lineageParentRoleSchema>;
export type ExternalParentRole = z.infer<typeof externalParentRoleSchema>;
