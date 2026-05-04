import { PrismaClient, TaskStatus, TaskPriority } from "@prisma/client";
import {
  CreateTaskDto,
  UpdateTaskStatusDto,
  UpdateTaskDto,
} from "../validators/task.validator";

const prisma = new PrismaClient();

async function ownsLot(userId: string, lotId: string) {
  return prisma.lot.findFirst({
    where: { id: lotId, coop: { farm: { userId } } },
  });
}

async function ownsTask(userId: string, taskId: string) {
  return prisma.calendarTask.findFirst({
    where: { id: taskId, lot: { coop: { farm: { userId } } } },
  });
}

// ── Templates ────────────────────────────────────────────────────────────────

export async function listActiveTemplates() {
  return prisma.taskTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

// ── Calendar tasks ────────────────────────────────────────────────────────────

export async function createTask(
  userId: string,
  lotId: string,
  dto: CreateTaskDto,
) {
  const lot = await ownsLot(userId, lotId);
  if (!lot) return { status: "not_found" as const };

  let resolvedTitle = dto.title?.trim() ?? "";
  let resolvedDescription = dto.description?.trim();

  if (dto.templateId) {
    const template = await prisma.taskTemplate.findFirst({
      where: { id: dto.templateId, isActive: true },
    });
    if (!template) return { status: "template_not_found" as const };
    if (!resolvedTitle) resolvedTitle = template.name;
    if (!resolvedDescription && template.description) {
      resolvedDescription = template.description;
    }
  }

  const task = await prisma.calendarTask.create({
    data: {
      lotId,
      templateId: dto.templateId ?? null,
      title: resolvedTitle,
      description: resolvedDescription ?? null,
      scheduledDate: new Date(dto.scheduledDate),
      priority: (dto.priority as TaskPriority) ?? null,
      status: TaskStatus.PENDING,
    },
    include: { template: true },
  });

  return { status: "created" as const, task };
}

export async function getLotTasks(
  userId: string,
  lotId: string,
  from?: string,
  to?: string,
) {
  const lot = await ownsLot(userId, lotId);
  if (!lot) return null;

  const where: Record<string, unknown> = { lotId };
  if (from || to) {
    where.scheduledDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  return prisma.calendarTask.findMany({
    where,
    orderBy: { scheduledDate: "asc" },
    include: { template: true },
  });
}

export async function getCalendarTasks(
  userId: string,
  from: string,
  to: string,
  farmId?: string,
  lotId?: string,
) {
  const lotFilter: Record<string, unknown> = {
    coop: { farm: { userId, ...(farmId ? { id: farmId } : {}) } },
  };
  if (lotId) lotFilter.id = lotId;

  return prisma.calendarTask.findMany({
    where: {
      lot: lotFilter,
      scheduledDate: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    orderBy: { scheduledDate: "asc" },
    include: { template: true, lot: { select: { id: true, code: true } } },
  });
}

export async function updateTaskStatus(
  userId: string,
  taskId: string,
  dto: UpdateTaskStatusDto,
) {
  const existing = await ownsTask(userId, taskId);
  if (!existing) return { status: "not_found" as const };

  const completedAt =
    dto.status === "DONE"
      ? new Date()
      : existing.status === "DONE"
        ? null
        : existing.completedAt;

  const task = await prisma.calendarTask.update({
    where: { id: taskId },
    data: {
      status: dto.status as TaskStatus,
      completedAt,
    },
    include: { template: true },
  });

  return { status: "ok" as const, task };
}

export async function updateTask(
  userId: string,
  taskId: string,
  dto: UpdateTaskDto,
) {
  const existing = await ownsTask(userId, taskId);
  if (!existing) return { status: "not_found" as const };

  const task = await prisma.calendarTask.update({
    where: { id: taskId },
    data: {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description.trim() || null }
        : {}),
      ...(dto.scheduledDate !== undefined
        ? { scheduledDate: new Date(dto.scheduledDate) }
        : {}),
      ...(dto.priority !== undefined
        ? { priority: dto.priority as TaskPriority }
        : {}),
    },
    include: { template: true },
  });

  return { status: "ok" as const, task };
}

export async function deleteTask(userId: string, taskId: string) {
  const existing = await ownsTask(userId, taskId);
  if (!existing) return { status: "not_found" as const };

  await prisma.calendarTask.delete({ where: { id: taskId } });
  return { status: "deleted" as const };
}
