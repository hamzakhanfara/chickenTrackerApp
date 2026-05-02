import { apiClient } from "./api";
import {
  ApiResponse,
  LotExpense,
  UpsertLotExpenseDto,
  normalizeApiError,
  parseApiResponse,
} from "./types";

async function getLotExpenses(lotId: string): Promise<LotExpense | null> {
  try {
    const response = await apiClient.get<ApiResponse<LotExpense | null>>(
      `/lots/${lotId}/expenses`,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function upsertLotExpenses(
  lotId: string,
  dto: UpsertLotExpenseDto,
): Promise<LotExpense> {
  try {
    const response = await apiClient.put<ApiResponse<LotExpense>>(
      `/lots/${lotId}/expenses`,
      dto,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const lotExpensesApi = { getLotExpenses, upsertLotExpenses };
