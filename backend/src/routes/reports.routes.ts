import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as reportsController from "../controllers/reports.controller";

const router = Router();

router.use(authMiddleware);

router.get("/lots/:lotId/summary", reportsController.getLotSummary);
router.get("/coops/:coopId/summary", reportsController.getCoopSummary);
router.get("/farms/:farmId/summary", reportsController.getFarmSummary);

export default router;
