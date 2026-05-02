import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date string YYYY-MM-DD");

export const createDailyEntrySchema = z.object({
  entryDate: dateString,
  mortalityCount: z.number().int().min(0, "mortalityCount must be >= 0"),
  feedKg: z.number().min(0, "feedKg must be >= 0"),
  waterLiters: z.number().min(0, "waterLiters must be >= 0").optional(),
  avgWeightGrams: z.number().positive("avgWeightGrams must be > 0").optional(),
  notes: z.string().max(500, "notes must be <= 500 chars").optional(),
});

export const dailyEntryDateParamSchema = z.object({
  entryDate: dateString,
});

export type CreateDailyEntryDto = z.infer<typeof createDailyEntrySchema>;
