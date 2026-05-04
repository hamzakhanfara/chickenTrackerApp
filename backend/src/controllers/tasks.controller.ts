import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  createTaskSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
  calendarRangeSchema,
} from "../validators/task.validator";
import * as tasksService from "../services/tasks.service";

export async function getTemplates(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const templates = await tasksService.listActiveTemplates();
  res.json({ success: true, data: templates });
}

export async function createTask(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const result = await tasksService.createTask(
    req.user!.id,
    req.params.lotId,
    parsed.data,
  );
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }
  if (result.status === "template_not_found") {
    res
      .status(404)
      .json({ success: false, error: "Template not found or inactive" });
    return;
  }
  res.status(201).json({ success: true, data: result.task });
}

export async function getLotTasks(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { from, to } = req.query as Record<string, string | undefined>;
  const tasks = await tasksService.getLotTasks(
    req.user!.id,
    req.params.lotId,
    from,
    to,
  );
  if (!tasks) {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }
  res.json({ success: true, data: tasks });
}

export async function getCalendarTasks(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = calendarRangeSchema.safeParse(req.query);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const { from, to, farmId, lotId } = parsed.data;
  const tasks = await tasksService.getCalendarTasks(
    req.user!.id,
    from,
    to,
    farmId,
    lotId,
  );
  res.json({ success: true, data: tasks });
}

export async function updateTaskStatus(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = updateTaskStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const result = await tasksService.updateTaskStatus(
    req.user!.id,
    req.params.taskId,
    parsed.data,
  );
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Task not found" });
    return;
  }
  res.json({ success: true, data: result.task });
}

export async function updateTask(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const result = await tasksService.updateTask(
    req.user!.id,
    req.params.taskId,
    parsed.data,
  );
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Task not found" });
    return;
  }
  res.json({ success: true, data: result.task });
}

export async function deleteTask(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const result = await tasksService.deleteTask(req.user!.id, req.params.taskId);
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Task not found" });
    return;
  }
  res.json({ success: true, data: { deleted: true } });
}
