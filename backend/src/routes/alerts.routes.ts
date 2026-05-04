import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as alertsController from "../controllers/alerts.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", alertsController.list);
router.patch("/read-all", alertsController.markAllRead);
router.patch("/:id/read", alertsController.markRead);

export default router;
