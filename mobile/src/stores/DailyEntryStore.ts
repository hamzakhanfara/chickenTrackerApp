import { action, makeObservable, observable } from "mobx";
import { dailyEntriesApi } from "../services/dailyEntries.api";
import {
  ApiServiceError,
  CreateDailyEntryDto,
  DailyEntry,
} from "../services/types";

export class DailyEntryStore {
  entriesByLot: Record<string, DailyEntry[]> = {};
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  constructor() {
    makeObservable(this, {
      entriesByLot: observable,
      isLoading: observable,
      isSubmitting: observable,
      error: observable,
      setLoading: action,
      setSubmitting: action,
      setError: action,
      resetError: action,
      createEntry: action,
      fetchEntriesByLot: action,
      fetchEntryByDate: action,
    });
  }

  setLoading(value: boolean) {
    this.isLoading = value;
  }

  setSubmitting(value: boolean) {
    this.isSubmitting = value;
  }

  setError(message: string | null) {
    this.error = message;
  }

  resetError() {
    this.error = null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof ApiServiceError) {
      return error.message;
    }
    return "Unexpected error";
  }

  async createEntry(lotId: string, payload: CreateDailyEntryDto) {
    this.setSubmitting(true);
    this.resetError();
    try {
      const entry = await dailyEntriesApi.createDailyEntry(lotId, payload);
      const list = this.entriesByLot[lotId] ?? [];
      this.entriesByLot[lotId] = [entry, ...list].sort((a, b) =>
        a.entryDate < b.entryDate ? 1 : -1,
      );
      return entry;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setSubmitting(false);
    }
  }

  async fetchEntriesByLot(lotId: string) {
    this.setLoading(true);
    this.resetError();
    try {
      const result = await dailyEntriesApi.getDailyEntriesByLot(lotId);
      this.entriesByLot[lotId] = result.entries;
      return result.entries;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return [];
    } finally {
      this.setLoading(false);
    }
  }

  async fetchEntryByDate(lotId: string, entryDate: string) {
    this.setLoading(true);
    this.resetError();
    try {
      const entry = await dailyEntriesApi.getDailyEntryByDate(lotId, entryDate);
      const list = this.entriesByLot[lotId] ?? [];
      const index = list.findIndex((item) => item.id === entry.id);
      if (index >= 0) {
        list[index] = entry;
        this.entriesByLot[lotId] = [...list];
      } else {
        this.entriesByLot[lotId] = [entry, ...list].sort((a, b) =>
          a.entryDate < b.entryDate ? 1 : -1,
        );
      }
      return entry;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setLoading(false);
    }
  }
}
