import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as lotsController from "../controllers/lots.controller";
import dailyEntriesRouter from "./dailyEntries";
import lotExpensesRouter from "./lotExpenses.routes";

// mergeParams so parent coopId is available when nested under /coops/:coopId/lots
const router = Router({ mergeParams: true });

router.use(authMiddleware);

// Nested: POST /coops/:coopId/lots and GET /coops/:coopId/lots
router.post("/", lotsController.create);
router.get("/", lotsController.list);

// Nested daily entries: /lots/:lotId/daily-entries (also under /coops/:coopId/lots/:lotId/daily-entries)
router.use("/:lotId/daily-entries", dailyEntriesRouter);

// Nested expenses: /lots/:lotId/expenses
router.use("/:lotId/expenses", lotExpensesRouter);

// Single lot access
router.get("/:lotId", lotsController.getOne);
router.patch("/:lotId", lotsController.update);
router.patch("/:lotId/close", lotsController.closeLot);
router.post("/:lotId/close", lotsController.closeLot);
router.delete("/:lotId", lotsController.remove);

export default router;
