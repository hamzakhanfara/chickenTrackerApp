import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as lotExpensesController from "../controllers/lotExpenses.controller";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

// GET  /lots/:lotId/expenses
router.get("/", lotExpensesController.getExpenses);

// PUT  /lots/:lotId/expenses
router.put("/", lotExpensesController.upsertExpenses);

// PATCH /lots/:lotId/expenses (partial update — same handler, partial fields already allowed)
router.patch("/", lotExpensesController.upsertExpenses);

export default router;
