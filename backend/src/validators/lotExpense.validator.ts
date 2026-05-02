import { z } from "zod";

const nonNegativeDecimal = z
  .number({ message: "Must be a number" })
  .min(0, "Must be >= 0")
  .optional();

export const upsertLotExpenseSchema = z.object({
  entryMode: z.enum(["PER_CHICK", "TOTAL"]),
  chickPrice: nonNegativeDecimal,
  vaccinationExpense: nonNegativeDecimal,
  coopExpense: nonNegativeDecimal,
  farmerExpense: nonNegativeDecimal,
  gasExpense: nonNegativeDecimal,
  waterExpense: nonNegativeDecimal,
  feedExpense: nonNegativeDecimal,
  additionalExpenses: z
    .array(
      z.object({
        label: z
          .string()
          .trim()
          .min(1, "Label is required")
          .max(80, "Label max 80 chars"),
        amount: z
          .number({ message: "Amount must be a number" })
          .min(0, "Amount must be >= 0"),
      }),
    )
    .optional()
    .default([]),
});

export type UpsertLotExpenseDto = z.infer<typeof upsertLotExpenseSchema>;
