import { apiClient } from "./api";
import {
  ApiResponse,
  CalendarTask,
  CreateTaskDto,
  TaskTemplate,
  TaskStatus,
  normalizeApiError,
  parseApiResponse,
} from "./types";

async function getTaskTemplates(): Promise<TaskTemplate[]> {
  try {
    const response =
      await apiClient.get<ApiResponse<TaskTemplate[]>>("/task-templates");
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function createTask(
  lotId: string,
  dto: CreateTaskDto,
): Promise<CalendarTask> {
  try {
    const response = await apiClient.post<ApiResponse<CalendarTask>>(
      `/lots/${lotId}/tasks`,
      dto,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function getLotTasks(
  lotId: string,
  params?: { from?: string; to?: string },
): Promise<CalendarTask[]> {
  try {
    const response = await apiClient.get<ApiResponse<CalendarTask[]>>(
      `/lots/${lotId}/tasks`,
      { params },
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function getCalendarTasks(params: {
  from: string;
  to: string;
  farmId?: string;
  lotId?: string;
}): Promise<CalendarTask[]> {
  try {
    const response = await apiClient.get<ApiResponse<CalendarTask[]>>(
      "/tasks/calendar",
      { params },
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<CalendarTask> {
  try {
    const response = await apiClient.patch<ApiResponse<CalendarTask>>(
      `/tasks/${taskId}/status`,
      { status },
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const tasksApi = {
  getTaskTemplates,
  createTask,
  getLotTasks,
  getCalendarTasks,
  updateTaskStatus,
};
