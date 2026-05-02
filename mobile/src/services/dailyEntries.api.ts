import { apiClient } from "./api";
import {
  ApiResponse,
  CreateDailyEntryDto,
  DailyEntry,
  DailyEntryListData,
  normalizeApiError,
  parseApiResponse,
} from "./types";

export interface ListDailyEntriesParams {
  page?: number;
  limit?: number;
}

async function createDailyEntry(
  lotId: string,
  dto: CreateDailyEntryDto,
): Promise<DailyEntry> {
  try {
    const response = await apiClient.post<ApiResponse<DailyEntry>>(
      `/lots/${lotId}/daily-entries`,
      dto,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function getDailyEntriesByLot(
  lotId: string,
  params?: ListDailyEntriesParams,
): Promise<DailyEntryListData> {
  try {
    const response = await apiClient.get<ApiResponse<DailyEntryListData>>(
      `/lots/${lotId}/daily-entries`,
      { params },
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function getDailyEntryByDate(
  lotId: string,
  entryDate: string,
): Promise<DailyEntry> {
  try {
    const response = await apiClient.get<ApiResponse<DailyEntry>>(
      `/lots/${lotId}/daily-entries/${entryDate}`,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const dailyEntriesApi = {
  createDailyEntry,
  getDailyEntriesByLot,
  getDailyEntryByDate,
};
