import { AxiosError } from "axios";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type UserRole = "farmer" | "admin";
export type BuildingType = "open" | "semi_closed" | "closed";
export type LotBreed = "ROSS_308" | "COBB_500" | "HUBBARD" | "OTHER";
export type LotStatus = "active" | "closed" | "cancelled";

export interface Farm {
  id: string;
  userId: string;
  name: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFarmDto {
  name: string;
  region: string;
  city: string;
  address?: string;
}

export type UpdateFarmDto = Partial<CreateFarmDto>;

export interface Coop {
  id: string;
  farmId: string;
  name: string;
  buildingType: BuildingType;
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
  farm?: Farm;
}

export interface CreateCoopDto {
  name: string;
  capacity: number;
  areaM2: number;
  buildingType: BuildingType;
}

export type UpdateCoopDto = Partial<CreateCoopDto>;

export interface Lot {
  id: string;
  coopId: string;
  code: string;
  breed: LotBreed;
  status: LotStatus;
  entryDate: string;
  initialCount: number;
  initialWeightKg: number | string | null;
  entryPricePerKg: number | string | null;
  closure?: {
    id: string;
    closureDate: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLotDto {
  code: string;
  breed: LotBreed;
  sourceSupplier?: string;
  startDate: string;
  targetEndDate?: string;
  initialChickCount: number;
  initialAvgWeightG?: number;
}

export interface UpdateLotDto {
  code?: string;
  breed?: LotBreed;
  sourceSupplier?: string;
  targetEndDate?: string;
}

export interface DailyEntry {
  id: string;
  lotId: string;
  entryDate: string;
  ageDay: number | null;
  mortalityCount: number;
  feedConsumedKg: number | string;
  avgWeightGrams: number | string | null;
  waterLiters: number | string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyEntryDto {
  entryDate: string;
  mortalityCount: number;
  feedKg: number;
  waterLiters?: number;
  avgWeightGrams?: number;
  notes?: string;
}

export interface PaginatedData<T, K extends string> {
  total: number;
  page: number;
  limit: number;
}

export type FarmListData = PaginatedData<Farm, "farms"> & { farms: Farm[] };
export type CoopListData = PaginatedData<Coop, "coops"> & { coops: Coop[] };
export type LotListData = PaginatedData<Lot, "lots"> & { lots: Lot[] };
export type DailyEntryListData = PaginatedData<DailyEntry, "entries"> & {
  entries: DailyEntry[];
};

export interface MessageData {
  message: string;
}

export type ExpenseEntryMode = "PER_CHICK" | "TOTAL";

export interface LotAdditionalExpense {
  id: string;
  lotExpenseId: string;
  label: string;
  amount: number | string;
  createdAt: string;
  updatedAt: string;
}

export interface LotExpense {
  id: string;
  lotId: string;
  entryMode: ExpenseEntryMode;
  chickPrice: number | string | null;
  vaccinationExpense: number | string | null;
  coopExpense: number | string | null;
  farmerExpense: number | string | null;
  gasExpense: number | string | null;
  waterExpense: number | string | null;
  feedExpense: number | string | null;
  additionalExpenses: LotAdditionalExpense[];
  createdAt: string;
  updatedAt: string;
}

export interface UpsertLotExpenseDto {
  entryMode: ExpenseEntryMode;
  chickPrice?: number;
  vaccinationExpense?: number;
  coopExpense?: number;
  farmerExpense?: number;
  gasExpense?: number;
  waterExpense?: number;
  feedExpense?: number;
  additionalExpenses?: { label: string; amount: number }[];
}

export type ApiErrorCode =
  | "validation"
  | "unauthorized"
  | "not_found"
  | "conflict"
  | "server_error"
  | "unknown";

export class ApiServiceError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(message: string, status: number, code: ApiErrorCode) {
    super(message);
    this.name = "ApiServiceError";
    this.status = status;
    this.code = code;
  }
}

function isApiFailure(data: unknown): data is ApiFailure {
  if (!data || typeof data !== "object") {
    return false;
  }
  const candidate = data as Partial<ApiFailure>;
  return candidate.success === false && typeof candidate.error === "string";
}

export function parseApiResponse<T>(payload: ApiResponse<T>): T {
  if (payload.success) {
    return payload.data;
  }

  throw new ApiServiceError(payload.error, 500, "server_error");
}

export function normalizeApiError(error: unknown): ApiServiceError {
  if (!(error instanceof AxiosError)) {
    return new ApiServiceError("Unexpected error", 500, "unknown");
  }

  const status = error.response?.status ?? 500;
  const payload = error.response?.data;
  const payloadMessage = isApiFailure(payload) ? payload.error : undefined;

  if (status === 400) {
    return new ApiServiceError(
      payloadMessage ?? "Validation error",
      400,
      "validation",
    );
  }

  if (status === 401) {
    return new ApiServiceError(
      payloadMessage ?? "Unauthorized",
      401,
      "unauthorized",
    );
  }

  if (status === 404) {
    return new ApiServiceError(payloadMessage ?? "Not found", 404, "not_found");
  }

  if (status === 409) {
    return new ApiServiceError(payloadMessage ?? "Conflict", 409, "conflict");
  }

  if (status >= 500) {
    return new ApiServiceError(
      payloadMessage ?? "Server error",
      status,
      "server_error",
    );
  }

  return new ApiServiceError(
    payloadMessage ?? "Unexpected error",
    status,
    "unknown",
  );
}
