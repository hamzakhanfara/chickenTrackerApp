import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as tasksController from "../controllers/tasks.controller";

// ── Task templates ────────────────────────────────────────────────────────────
export const taskTemplatesRouter = Router();
taskTemplatesRouter.use(authMiddleware);
taskTemplatesRouter.get("/", tasksController.getTemplates);

// ── Per-lot tasks (nested under /lots/:lotId/tasks) ──────────────────────────
export const lotTasksRouter = Router({ mergeParams: true });
lotTasksRouter.use(authMiddleware);
lotTasksRouter.post("/", tasksController.createTask);
lotTasksRouter.get("/", tasksController.getLotTasks);

// ── Standalone task routes (/tasks/:taskId) ───────────────────────────────────
export const tasksRouter = Router();
tasksRouter.use(authMiddleware);
tasksRouter.get("/calendar", tasksController.getCalendarTasks);
tasksRouter.patch("/:taskId/status", tasksController.updateTaskStatus);
tasksRouter.patch("/:taskId", tasksController.updateTask);
tasksRouter.delete("/:taskId", tasksController.deleteTask);
