import { z } from "zod";

export const createFarmSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  region: z.string().min(2, "Region must be at least 2 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  address: z.string().optional(),
});

export const updateFarmSchema = createFarmSchema.partial();

export type CreateFarmDto = z.infer<typeof createFarmSchema>;
export type UpdateFarmDto = z.infer<typeof updateFarmSchema>;
