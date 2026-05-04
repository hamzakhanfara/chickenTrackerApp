import { apiClient } from "./api";
import {
  ApiResponse,
  OperationalAlert,
  normalizeApiError,
  parseApiResponse,
} from "./types";

export interface GetAlertsParams {
  unreadOnly?: boolean;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  farmId?: string;
  lotId?: string;
  type?: "TASK_DUE" | "MISSING_DAILY_ENTRY" | "HIGH_MORTALITY";
  limit?: number;
}

async function getAlerts(
  params?: GetAlertsParams,
): Promise<OperationalAlert[]> {
  try {
    const response = await apiClient.get<ApiResponse<OperationalAlert[]>>(
      "/alerts",
      { params },
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function markAlertRead(alertId: string): Promise<OperationalAlert> {
  try {
    const response = await apiClient.patch<ApiResponse<OperationalAlert>>(
      `/alerts/${alertId}/read`,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function markAllAlertsRead(params?: {
  farmId?: string;
  lotId?: string;
}): Promise<{ updated: number }> {
  try {
    const response = await apiClient.patch<ApiResponse<{ updated: number }>>(
      "/alerts/read-all",
      undefined,
      { params },
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const alertsApi = {
  getAlerts,
  markAlertRead,
  markAllAlertsRead,
};
