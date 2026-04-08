import { z } from "zod/v4";

export const healthRecordSchema = z.object({
  type: z.enum([
    "checkup",
    "vaccination",
    "surgery",
    "illness",
    "medication",
    "other",
  ]),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().max(5000).optional(),
  date: z.string().min(1, "Date is required"),
  vetName: z.string().max(100).optional(),
  vetClinic: z.string().max(200).optional(),
});

export const weightLogSchema = z.object({
  weightKg: z.string().min(1, "Weight is required"),
  recordedAt: z.string().min(1, "Date is required"),
  notes: z.string().max(500).optional(),
});
