import { z } from "zod";

export const reportParamsSchema = z.object({
  lotId: z.string().uuid().optional(),
  coopId: z.string().uuid().optional(),
  farmId: z.string().uuid().optional(),
});

export const reportEstimatorQuerySchema = z.object({
  sellPricePerKg: z.coerce.number().positive().optional(),
  projectedAvgWeightKg: z.coerce.number().positive().optional(),
  projectedSurvivingBirds: z.coerce.number().int().positive().optional(),
});

export type ReportEstimatorQueryDto = z.infer<
  typeof reportEstimatorQuerySchema
>;
