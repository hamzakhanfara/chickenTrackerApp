import { action, makeObservable, observable } from "mobx";
import { lotExpensesApi } from "../services/lotExpenses.api";
import {
  ApiServiceError,
  LotExpense,
  UpsertLotExpenseDto,
} from "../services/types";

export class LotExpenseStore {
  expenseByLotId: Record<string, LotExpense | null> = {};
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  constructor() {
    makeObservable(this, {
      expenseByLotId: observable,
      isLoading: observable,
      isSubmitting: observable,
      error: observable,
      setLoading: action,
      setSubmitting: action,
      setError: action,
      resetError: action,
      fetchLotExpenses: action,
      saveLotExpenses: action,
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

  async fetchLotExpenses(lotId: string) {
    this.setLoading(true);
    this.resetError();
    try {
      const expense = await lotExpensesApi.getLotExpenses(lotId);
      this.expenseByLotId[lotId] = expense;
      return expense;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async saveLotExpenses(lotId: string, dto: UpsertLotExpenseDto) {
    this.setSubmitting(true);
    this.resetError();
    try {
      const expense = await lotExpensesApi.upsertLotExpenses(lotId, dto);
      this.expenseByLotId[lotId] = expense;
      return expense;
    } catch (error) {
      this.setError(this.getErrorMessage(error));
      return null;
    } finally {
      this.setSubmitting(false);
    }
  }
}
