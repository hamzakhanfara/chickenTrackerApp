import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date string YYYY-MM-DD");

export const createLotSchema = z
  .object({
    code: z.string().min(3, "Code must be at least 3 characters"),
    breed: z.enum(["ROSS_308", "COBB_500", "HUBBARD", "OTHER"]),
    sourceSupplier: z.string().optional(),
    startDate: dateString,
    targetEndDate: dateString.optional(),
    initialChickCount: z
      .number()
      .int()
      .positive("initialChickCount must be > 0"),
    initialAvgWeightG: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.targetEndDate) {
        return data.startDate <= data.targetEndDate;
      }
      return true;
    },
    { message: "targetEndDate must be >= startDate", path: ["targetEndDate"] },
  );

export const updateLotSchema = z.object({
  code: z.string().min(3).optional(),
  breed: z.enum(["ROSS_308", "COBB_500", "HUBBARD", "OTHER"]).optional(),
  sourceSupplier: z.string().optional(),
  targetEndDate: dateString.optional(),
});

export type CreateLotDto = z.infer<typeof createLotSchema>;
export type UpdateLotDto = z.infer<typeof updateLotSchema>;
