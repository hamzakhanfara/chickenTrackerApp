import { action, makeObservable, observable } from "mobx";
import { tasksApi } from "../services/tasks.api";
import {
  ApiServiceError,
  CalendarTask,
  CreateTaskDto,
  TaskStatus,
  TaskTemplate,
} from "../services/types";

export class TaskStore {
  templates: TaskTemplate[] = [];
  tasksByDate: Record<string, CalendarTask[]> = {};
  tasksByLot: Record<string, CalendarTask[]> = {};
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  constructor() {
    makeObservable(this, {
      templates: observable,
      tasksByDate: observable,
      tasksByLot: observable,
      isLoading: observable,
      isSubmitting: observable,
      error: observable,
      setLoading: action,
      setSubmitting: action,
      setError: action,
      resetError: action,
      fetchTemplates: action,
      fetchCalendarTasks: action,
      fetchLotTasks: action,
      createTask: action,
      setTaskStatus: action,
    });
  }

  setLoading(value: boolean) {
    this.isLoading = value;
  }

  setSubmitting(value: boolean) {
    this.isSubmitting = value;
  }

  setError(message: string | null) {
    this.error = message;
  }

  resetError() {
    this.error = null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof ApiServiceError) return error.message;
    return "Erreur inattendue";
  }

  async fetchTemplates() {
    this.setLoading(true);
    this.resetError();
    try {
      const templates = await tasksApi.getTaskTemplates();
      this.templates = templates;
      return templates;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return [];
    } finally {
      this.setLoading(false);
    }
  }

  async fetchCalendarTasks(params: {
    from: string;
    to: string;
    farmId?: string;
    lotId?: string;
  }) {
    this.setLoading(true);
    this.resetError();
    try {
      const tasks = await tasksApi.getCalendarTasks(params);
      // Group by scheduledDate (YYYY-MM-DD)
      const grouped: Record<string, CalendarTask[]> = {};
      for (const task of tasks) {
        const day = task.scheduledDate.substring(0, 10);
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(task);
      }
      this.tasksByDate = grouped;
      return tasks;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return [];
    } finally {
      this.setLoading(false);
    }
  }

  async fetchLotTasks(lotId: string, params?: { from?: string; to?: string }) {
    this.setLoading(true);
    this.resetError();
    try {
      const tasks = await tasksApi.getLotTasks(lotId, params);
      this.tasksByLot[lotId] = tasks;
      return tasks;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return [];
    } finally {
      this.setLoading(false);
    }
  }

  async createTask(lotId: string, dto: CreateTaskDto) {
    this.setSubmitting(true);
    this.resetError();
    try {
      const task = await tasksApi.createTask(lotId, dto);
      // Insert into tasksByDate
      const day = task.scheduledDate.substring(0, 10);
      if (!this.tasksByDate[day]) this.tasksByDate[day] = [];
      this.tasksByDate[day].push(task);
      // Insert into tasksByLot
      if (!this.tasksByLot[lotId]) this.tasksByLot[lotId] = [];
      this.tasksByLot[lotId].push(task);
      return task;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setSubmitting(false);
    }
  }

  async setTaskStatus(taskId: string, status: TaskStatus) {
    this.setSubmitting(true);
    this.resetError();
    try {
      const updated = await tasksApi.updateTaskStatus(taskId, status);
      // Update in tasksByDate
      for (const day in this.tasksByDate) {
        const idx = this.tasksByDate[day].findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          this.tasksByDate[day][idx] = updated;
          break;
        }
      }
      // Update in tasksByLot
      for (const lotId in this.tasksByLot) {
        const idx = this.tasksByLot[lotId].findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          this.tasksByLot[lotId][idx] = updated;
          break;
        }
      }
      return updated;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setSubmitting(false);
    }
  }
}
