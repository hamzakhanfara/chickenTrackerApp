import { apiClient } from "./api";
import {
  ApiResponse,
  Coop,
  CoopListData,
  CreateCoopDto,
  MessageData,
  UpdateCoopDto,
  normalizeApiError,
  parseApiResponse,
} from "./types";

export interface ListCoopsParams {
  page?: number;
  limit?: number;
}

async function create(farmId: string, dto: CreateCoopDto): Promise<Coop> {
  try {
    const response = await apiClient.post<ApiResponse<Coop>>(
      `/farms/${farmId}/coops`,
      dto,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function list(
  farmId: string,
  params?: ListCoopsParams,
): Promise<CoopListData> {
  try {
    const response = await apiClient.get<ApiResponse<CoopListData>>(
      `/farms/${farmId}/coops`,
      { params },
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function getById(coopId: string): Promise<Coop> {
  try {
    const response = await apiClient.get<ApiResponse<Coop>>(`/coops/${coopId}`);
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function update(coopId: string, dto: UpdateCoopDto): Promise<Coop> {
  try {
    const response = await apiClient.patch<ApiResponse<Coop>>(
      `/coops/${coopId}`,
      dto,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function remove(coopId: string): Promise<MessageData> {
  try {
    const response = await apiClient.delete<ApiResponse<MessageData>>(
      `/coops/${coopId}`,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const coopsApi = {
  create,
  list,
  getById,
  update,
  remove,
};
