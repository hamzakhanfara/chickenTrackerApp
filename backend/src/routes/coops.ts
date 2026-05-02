import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as coopsController from "../controllers/coops.controller";
import lotsRouter from "./lots";

// Nested under /farms/:farmId/coops (mergeParams for farmId) and standalone /coops
const router = Router({ mergeParams: true });

router.use(authMiddleware);

// Nested: POST /farms/:farmId/coops and GET /farms/:farmId/coops
router.post("/", coopsController.create);
router.get("/", coopsController.list);

// Single coop access
router.get("/:coopId", coopsController.getOne);
router.patch("/:coopId", coopsController.update);
router.delete("/:coopId", coopsController.remove);

// Nested lots: /coops/:coopId/lots (or /farms/:farmId/coops/:coopId/lots)
router.use("/:coopId/lots", lotsRouter);

export default router;
