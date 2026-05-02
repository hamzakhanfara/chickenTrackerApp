import { z } from "zod";

export const createCoopSchema = z.object({
  name: z.string().min(1, "Name is required"),
  capacity: z.number().int().positive("Capacity must be > 0"),
  areaM2: z.number().positive("Area must be > 0"),
  buildingType: z.enum(["open", "semi_closed", "closed"]),
});

export const updateCoopSchema = createCoopSchema.partial();

export type CreateCoopDto = z.infer<typeof createCoopSchema>;
export type UpdateCoopDto = z.infer<typeof updateCoopSchema>;
