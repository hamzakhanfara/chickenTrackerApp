import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date string YYYY-MM-DD");

export const createTaskSchema = z
  .object({
    templateId: z.string().uuid().optional(),
    title: z.string().min(1, "Title is required").max(200).optional(),
    description: z.string().max(1000).optional(),
    scheduledDate: dateString,
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  })
  .refine((d) => d.templateId || (d.title && d.title.trim().length > 0), {
    message: "title is required when no templateId is provided",
    path: ["title"],
  });

export const updateTaskStatusSchema = z.object({
  status: z.enum(["PENDING", "DONE", "CANCELED"]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  scheduledDate: dateString.optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export const calendarRangeSchema = z.object({
  from: dateString,
  to: dateString,
  farmId: z.string().uuid().optional(),
  lotId: z.string().uuid().optional(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskStatusDto = z.infer<typeof updateTaskStatusSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
export type CalendarRangeDto = z.infer<typeof calendarRangeSchema>;
