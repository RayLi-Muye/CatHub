import { z } from "zod/v4";

export const catSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  breed: z.string().max(100).optional(),
  sex: z.enum(["male", "female", "unknown"]).default("unknown"),
  birthdate: z.string().optional(),
  description: z.string().max(2000).optional(),
  colorMarkings: z.string().max(255).optional(),
  microchipId: z.string().max(50).optional(),
  isNeutered: z.boolean().default(false),
  isPublic: z.boolean().default(true),
});

export type CatInput = z.infer<typeof catSchema>;
