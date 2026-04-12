import { z } from "zod/v4";

export const lineageParentRoleSchema = z.enum(["sire", "dam", "unknown"]);

export const internalParentSchema = z.object({
  parentCatId: z.uuid("Choose a cat from your records"),
  notes: z.string().max(1000, "Notes must be at most 1000 characters").optional(),
});

export type LineageParentRole = z.infer<typeof lineageParentRoleSchema>;
