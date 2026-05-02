import { action, makeObservable, observable } from "mobx";
import { farmsApi, ListFarmsParams } from "../services/farms.api";
import {
  ApiServiceError,
  CreateFarmDto,
  Farm,
  UpdateFarmDto,
} from "../services/types";

export class FarmStore {
  items: Farm[] = [];
  selectedItem: Farm | null = null;
  isLoading = false;
  error: string | null = null;
  page = 1;
  limit = 20;
  total = 0;

  constructor() {
    makeObservable(this, {
      items: observable,
      selectedItem: observable,
      isLoading: observable,
      error: observable,
      page: observable,
      limit: observable,
      total: observable,
      setLoading: action,
      setError: action,
      clearError: action,
      fetchFarms: action,
      fetchFarmById: action,
      createFarm: action,
      updateFarm: action,
      deleteFarm: action,
    });
  }

  setLoading(value: boolean) {
    this.isLoading = value;
  }

  setError(message: string | null) {
    this.error = message;
  }

  clearError() {
    this.error = null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof ApiServiceError) {
      return error.message;
    }
    return "Unexpected error";
  }

  async fetchFarms(params?: ListFarmsParams) {
    this.setLoading(true);
    this.clearError();
    try {
      const result = await farmsApi.list(params);
      this.items = result.farms;
      this.page = result.page;
      this.limit = result.limit;
      this.total = result.total;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
    } finally {
      this.setLoading(false);
    }
  }

  async fetchFarmById(farmId: string) {
    this.setLoading(true);
    this.clearError();
    try {
      const farm = await farmsApi.getById(farmId);
      this.selectedItem = farm;
      const index = this.items.findIndex((item) => item.id === farm.id);
      if (index >= 0) {
        this.items[index] = farm;
      } else {
        this.items.unshift(farm);
      }
    } catch (error) {
      this.setError(this.getErrorMessage(error));
    } finally {
      this.setLoading(false);
    }
  }

  async createFarm(payload: CreateFarmDto) {
    this.setLoading(true);
    this.clearError();
    try {
      const farm = await farmsApi.create(payload);
      this.items.unshift(farm);
      this.selectedItem = farm;
      this.total += 1;
      return farm;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async updateFarm(farmId: string, payload: UpdateFarmDto) {
    this.setLoading(true);
    this.clearError();
    try {
      const farm = await farmsApi.update(farmId, payload);
      const index = this.items.findIndex((item) => item.id === farm.id);
      if (index >= 0) {
        this.items[index] = farm;
      }
      if (this.selectedItem?.id === farm.id) {
        this.selectedItem = farm;
      }
      return farm;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async deleteFarm(farmId: string) {
    this.setLoading(true);
    this.clearError();
    try {
      await farmsApi.remove(farmId);
      this.items = this.items.filter((item) => item.id !== farmId);
      if (this.selectedItem?.id === farmId) {
        this.selectedItem = null;
      }
      this.total = Math.max(0, this.total - 1);
      return true;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return false;
    } finally {
      this.setLoading(false);
    }
  }
}
