import { apiClient } from "./api";
import {
  ApiResponse,
  LotReportSummary,
  normalizeApiError,
  parseApiResponse,
} from "./types";

export interface ReportEstimatorParams {
  sellPricePerKg?: number;
  projectedAvgWeightKg?: number;
  projectedSurvivingBirds?: number;
}

async function getLotReportSummary(
  lotId: string,
  params?: ReportEstimatorParams,
): Promise<LotReportSummary> {
  try {
    const response = await apiClient.get<ApiResponse<LotReportSummary>>(
      `/reports/lots/${lotId}/summary`,
      { params },
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function getCoopReportSummary(
  coopId: string,
  params?: ReportEstimatorParams,
): Promise<unknown> {
  try {
    const response = await apiClient.get<ApiResponse<unknown>>(
      `/reports/coops/${coopId}/summary`,
      { params },
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function getFarmReportSummary(
  farmId: string,
  params?: ReportEstimatorParams,
): Promise<unknown> {
  try {
    const response = await apiClient.get<ApiResponse<unknown>>(
      `/reports/farms/${farmId}/summary`,
      { params },
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const reportsApi = {
  getLotReportSummary,
  getCoopReportSummary,
  getFarmReportSummary,
};
