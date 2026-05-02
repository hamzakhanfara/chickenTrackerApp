import { action, makeObservable, observable } from "mobx";
import { coopsApi, ListCoopsParams } from "../services/coops.api";
import {
  ApiServiceError,
  Coop,
  CreateCoopDto,
  UpdateCoopDto,
} from "../services/types";

export class CoopStore {
  items: Coop[] = [];
  selectedItem: Coop | null = null;
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
      fetchCoopsByFarm: action,
      fetchCoopById: action,
      createCoop: action,
      updateCoop: action,
      deleteCoop: action,
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

  async fetchCoopsByFarm(farmId: string, params?: ListCoopsParams) {
    this.setLoading(true);
    this.clearError();
    try {
      const result = await coopsApi.list(farmId, params);
      this.items = result.coops;
      this.page = result.page;
      this.limit = result.limit;
      this.total = result.total;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
    } finally {
      this.setLoading(false);
    }
  }

  async fetchCoopById(coopId: string) {
    this.setLoading(true);
    this.clearError();
    try {
      const coop = await coopsApi.getById(coopId);
      this.selectedItem = coop;
      const index = this.items.findIndex((item) => item.id === coop.id);
      if (index >= 0) {
        this.items[index] = coop;
      } else {
        this.items.unshift(coop);
      }
    } catch (error) {
      this.setError(this.getErrorMessage(error));
    } finally {
      this.setLoading(false);
    }
  }

  async createCoop(farmId: string, payload: CreateCoopDto) {
    this.setLoading(true);
    this.clearError();
    try {
      const coop = await coopsApi.create(farmId, payload);
      this.items.unshift(coop);
      this.selectedItem = coop;
      this.total += 1;
      return coop;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async updateCoop(coopId: string, payload: UpdateCoopDto) {
    this.setLoading(true);
    this.clearError();
    try {
      const coop = await coopsApi.update(coopId, payload);
      const index = this.items.findIndex((item) => item.id === coop.id);
      if (index >= 0) {
        this.items[index] = coop;
      }
      if (this.selectedItem?.id === coop.id) {
        this.selectedItem = coop;
      }
      return coop;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async deleteCoop(coopId: string) {
    this.setLoading(true);
    this.clearError();
    try {
      await coopsApi.remove(coopId);
      this.items = this.items.filter((item) => item.id !== coopId);
      if (this.selectedItem?.id === coopId) {
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
