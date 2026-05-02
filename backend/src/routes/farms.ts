import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as farmsController from "../controllers/farms.controller";
import coopsRouter from "./coops";

const router = Router();

router.use(authMiddleware);

router.post("/", farmsController.create);
router.get("/", farmsController.list);
router.get("/:farmId", farmsController.getOne);
router.patch("/:farmId", farmsController.update);
router.delete("/:farmId", farmsController.remove);

// Nested: /farms/:farmId/coops
router.use("/:farmId/coops", coopsRouter);

export default router;
