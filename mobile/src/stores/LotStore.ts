import { action, makeObservable, observable } from "mobx";
import { lotsApi, ListLotsParams } from "../services/lots.api";
import {
  ApiServiceError,
  CreateLotDto,
  Lot,
  UpdateLotDto,
} from "../services/types";

export class LotStore {
  items: Lot[] = [];
  lotsByCoop: Record<string, Lot[]> = {};
  selectedItem: Lot | null = null;
  isLoading = false;
  error: string | null = null;
  page = 1;
  limit = 20;
  total = 0;

  constructor() {
    makeObservable(this, {
      items: observable,
      lotsByCoop: observable,
      selectedItem: observable,
      isLoading: observable,
      error: observable,
      page: observable,
      limit: observable,
      total: observable,
      setLoading: action,
      setError: action,
      clearError: action,
      setLotsForCoop: action,
      fetchLotsByCoop: action,
      fetchLotsForCoops: action,
      fetchLotById: action,
      createLot: action,
      updateLot: action,
      closeLot: action,
      deleteLot: action,
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

  setLotsForCoop(coopId: string, lots: Lot[]) {
    this.lotsByCoop[coopId] = lots;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof ApiServiceError) {
      return error.message;
    }
    return "Unexpected error";
  }

  async fetchLotsByCoop(coopId: string, params?: ListLotsParams) {
    this.setLoading(true);
    this.clearError();
    try {
      const result = await lotsApi.list(coopId, params);
      this.items = result.lots;
      this.setLotsForCoop(coopId, result.lots);
      this.page = result.page;
      this.limit = result.limit;
      this.total = result.total;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
    } finally {
      this.setLoading(false);
    }
  }

  async fetchLotsForCoops(coopIds: string[]) {
    this.setLoading(true);
    this.clearError();
    try {
      await Promise.all(
        coopIds.map(async (coopId) => {
          const result = await lotsApi.list(coopId, { page: 1, limit: 100 });
          this.setLotsForCoop(coopId, result.lots);
        }),
      );
    } catch (error) {
      this.setError(this.getErrorMessage(error));
    } finally {
      this.setLoading(false);
    }
  }

  async fetchLotById(lotId: string) {
    this.setLoading(true);
    this.clearError();
    try {
      const lot = await lotsApi.getById(lotId);
      this.selectedItem = lot;
      if (lot.coopId) {
        const coopLots = this.lotsByCoop[lot.coopId] ?? [];
        const coopIndex = coopLots.findIndex((item) => item.id === lot.id);
        if (coopIndex >= 0) {
          coopLots[coopIndex] = lot;
          this.setLotsForCoop(lot.coopId, [...coopLots]);
        } else {
          this.setLotsForCoop(lot.coopId, [lot, ...coopLots]);
        }
      }
      const index = this.items.findIndex((item) => item.id === lot.id);
      if (index >= 0) {
        this.items[index] = lot;
      } else {
        this.items.unshift(lot);
      }
    } catch (error) {
      this.setError(this.getErrorMessage(error));
    } finally {
      this.setLoading(false);
    }
  }

  async createLot(coopId: string, payload: CreateLotDto) {
    this.setLoading(true);
    this.clearError();
    try {
      const lot = await lotsApi.create(coopId, payload);
      this.items.unshift(lot);
      this.setLotsForCoop(coopId, [lot, ...(this.lotsByCoop[coopId] ?? [])]);
      this.selectedItem = lot;
      this.total += 1;
      return lot;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async updateLot(lotId: string, payload: UpdateLotDto) {
    this.setLoading(true);
    this.clearError();
    try {
      const lot = await lotsApi.update(lotId, payload);
      const coopLots = this.lotsByCoop[lot.coopId] ?? [];
      const coopIndex = coopLots.findIndex((item) => item.id === lot.id);
      if (coopIndex >= 0) {
        coopLots[coopIndex] = lot;
        this.setLotsForCoop(lot.coopId, [...coopLots]);
      }
      const index = this.items.findIndex((item) => item.id === lot.id);
      if (index >= 0) {
        this.items[index] = lot;
      }
      if (this.selectedItem?.id === lot.id) {
        this.selectedItem = lot;
      }
      return lot;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async closeLot(lotId: string) {
    this.setLoading(true);
    this.clearError();
    try {
      const lot = await lotsApi.closeLot(lotId);
      const coopLots = this.lotsByCoop[lot.coopId] ?? [];
      const coopIndex = coopLots.findIndex((item) => item.id === lot.id);
      if (coopIndex >= 0) {
        coopLots[coopIndex] = lot;
        this.setLotsForCoop(lot.coopId, [...coopLots]);
      }
      const index = this.items.findIndex((item) => item.id === lot.id);
      if (index >= 0) {
        this.items[index] = lot;
      }
      if (this.selectedItem?.id === lot.id) {
        this.selectedItem = lot;
      }
      return lot;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async deleteLot(lotId: string) {
    this.setLoading(true);
    this.clearError();
    try {
      await lotsApi.remove(lotId);
      Object.keys(this.lotsByCoop).forEach((coopId) => {
        const filtered = (this.lotsByCoop[coopId] ?? []).filter(
          (item) => item.id !== lotId,
        );
        this.setLotsForCoop(coopId, filtered);
      });
      this.items = this.items.filter((item) => item.id !== lotId);
      if (this.selectedItem?.id === lotId) {
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

  getLotsForCoop(coopId: string): Lot[] {
    return this.lotsByCoop[coopId] ?? [];
  }

  getActiveLotForCoop(coopId: string): Lot | null {
    const lots = this.getLotsForCoop(coopId);
    return lots.find((lot) => lot.status === "active") ?? null;
  }

  getActiveLotsCountForCoop(coopId: string): number {
    return this.getLotsForCoop(coopId).filter((lot) => lot.status === "active")
      .length;
  }
}
