import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { upsertLotExpenseSchema } from "../validators/lotExpense.validator";
import * as lotExpensesService from "../services/lotExpenses.service";

export async function getExpenses(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const result = await lotExpensesService.getLotExpenses(
    req.user!.id,
    req.params.lotId,
  );
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }
  res.json({ success: true, data: result.expense ?? null });
}

export async function upsertExpenses(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = upsertLotExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const result = await lotExpensesService.upsertLotExpenses(
    req.user!.id,
    req.params.lotId,
    parsed.data,
  );
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }
  res.json({ success: true, data: result.expense });
}
