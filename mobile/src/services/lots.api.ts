import { apiClient } from "./api";
import {
  ApiResponse,
  CreateLotDto,
  Lot,
  LotListData,
  MessageData,
  UpdateLotDto,
  normalizeApiError,
  parseApiResponse,
} from "./types";

export interface ListLotsParams {
  page?: number;
  limit?: number;
}

async function create(coopId: string, dto: CreateLotDto): Promise<Lot> {
  try {
    const response = await apiClient.post<ApiResponse<Lot>>(
      `/coops/${coopId}/lots`,
      dto,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function list(
  coopId: string,
  params?: ListLotsParams,
): Promise<LotListData> {
  try {
    const response = await apiClient.get<ApiResponse<LotListData>>(
      `/coops/${coopId}/lots`,
      { params },
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function getById(lotId: string): Promise<Lot> {
  try {
    const response = await apiClient.get<ApiResponse<Lot>>(`/lots/${lotId}`);
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function update(lotId: string, dto: UpdateLotDto): Promise<Lot> {
  try {
    const response = await apiClient.patch<ApiResponse<Lot>>(
      `/lots/${lotId}`,
      dto,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function closeLot(lotId: string): Promise<Lot> {
  try {
    const response = await apiClient.patch<ApiResponse<Lot>>(
      `/lots/${lotId}/close`,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function remove(lotId: string): Promise<MessageData> {
  try {
    const response = await apiClient.delete<ApiResponse<MessageData>>(
      `/lots/${lotId}`,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const lotsApi = {
  create,
  list,
  getById,
  update,
  close: closeLot,
  closeLot,
  remove,
};
