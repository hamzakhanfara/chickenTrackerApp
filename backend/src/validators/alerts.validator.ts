import { z } from "zod";

const boolish = z.preprocess((value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}, z.boolean().optional());

export const listAlertsQuerySchema = z.object({
  unreadOnly: boolish,
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
  farmId: z.string().uuid().optional(),
  lotId: z.string().uuid().optional(),
  type: z
    .enum(["TASK_DUE", "MISSING_DAILY_ENTRY", "HIGH_MORTALITY"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const alertIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const markAllReadSchema = z.object({
  farmId: z.string().uuid().optional(),
  lotId: z.string().uuid().optional(),
});

export type ListAlertsQueryDto = z.infer<typeof listAlertsQuerySchema>;
export type MarkAllReadDto = z.infer<typeof markAllReadSchema>;
