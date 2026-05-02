import { apiClient } from "./api";
import {
  ApiResponse,
  CreateFarmDto,
  Farm,
  FarmListData,
  MessageData,
  UpdateFarmDto,
  normalizeApiError,
  parseApiResponse,
} from "./types";

export interface ListFarmsParams {
  page?: number;
  limit?: number;
}

async function create(dto: CreateFarmDto): Promise<Farm> {
  try {
    const response = await apiClient.post<ApiResponse<Farm>>("/farms", dto);
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function list(params?: ListFarmsParams): Promise<FarmListData> {
  try {
    const response = await apiClient.get<ApiResponse<FarmListData>>("/farms", {
      params,
    });
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function getById(farmId: string): Promise<Farm> {
  try {
    const response = await apiClient.get<ApiResponse<Farm>>(`/farms/${farmId}`);
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function update(farmId: string, dto: UpdateFarmDto): Promise<Farm> {
  try {
    const response = await apiClient.patch<ApiResponse<Farm>>(
      `/farms/${farmId}`,
      dto,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function remove(farmId: string): Promise<MessageData> {
  try {
    const response = await apiClient.delete<ApiResponse<MessageData>>(
      `/farms/${farmId}`,
    );
    return parseApiResponse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const farmsApi = {
  create,
  list,
  getById,
  update,
  remove,
};
