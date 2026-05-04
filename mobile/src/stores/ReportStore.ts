import { action, makeObservable, observable } from "mobx";
import { reportsApi, ReportEstimatorParams } from "../services/reports.api";
import { ApiServiceError, LotReportSummary } from "../services/types";

export class ReportStore {
  lotReports: Record<string, LotReportSummary> = {};
  estimatorInputsByLot: Record<string, ReportEstimatorParams> = {};
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeObservable(this, {
      lotReports: observable,
      estimatorInputsByLot: observable,
      isLoading: observable,
      error: observable,
      setLoading: action,
      setError: action,
      resetError: action,
      setEstimatorInputs: action,
      fetchLotReport: action,
    });
  }

  setLoading(value: boolean) {
    this.isLoading = value;
  }

  setError(value: string | null) {
    this.error = value;
  }

  resetError() {
    this.error = null;
  }

  setEstimatorInputs(lotId: string, inputs: ReportEstimatorParams) {
    this.estimatorInputsByLot[lotId] = {
      ...(this.estimatorInputsByLot[lotId] ?? {}),
      ...inputs,
    };
  }

  private toMessage(error: unknown): string {
    if (error instanceof ApiServiceError) return error.message;
    return "Unexpected error";
  }

  async fetchLotReport(lotId: string, params?: ReportEstimatorParams) {
    this.setLoading(true);
    this.resetError();

    const mergedParams = {
      ...(this.estimatorInputsByLot[lotId] ?? {}),
      ...(params ?? {}),
    };

    try {
      const report = await reportsApi.getLotReportSummary(lotId, mergedParams);
      this.lotReports[lotId] = report;
      this.estimatorInputsByLot[lotId] = {
        ...mergedParams,
      };
      return report;
    } catch (error) {
      this.setError(this.toMessage(error));
      return null;
    } finally {
      this.setLoading(false);
    }
  }
}
