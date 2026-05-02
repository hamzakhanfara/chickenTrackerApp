import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as dailyEntriesController from "../controllers/dailyEntries.controller";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post("/", dailyEntriesController.create);
router.get("/", dailyEntriesController.list);
router.get("/:entryDate", dailyEntriesController.getByDate);

export default router;
