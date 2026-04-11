import { z } from "zod/v4";

export const dailyCheckinSchema = z.object({
  date: z.string().min(1, "Date is required"),
  appetiteScore: z.coerce
    .number()
    .int()
    .min(1, "Appetite score must be 1-5")
    .max(5, "Appetite score must be 1-5"),
  energyScore: z.coerce
    .number()
    .int()
    .min(1, "Energy score must be 1-5")
    .max(5, "Energy score must be 1-5"),
  bowelStatus: z.enum([
    "normal",
    "soft",
    "hard",
    "diarrhea",
    "constipation",
    "none",
  ]),
  moodEmoji: z.string().max(10).optional(),
  notes: z.string().max(500).optional(),
});
