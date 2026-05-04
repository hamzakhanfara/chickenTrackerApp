import { action, makeObservable, observable } from "mobx";
import { alertsApi, GetAlertsParams } from "../services/alerts.api";
import { ApiServiceError, OperationalAlert } from "../services/types";

export class AlertStore {
  alerts: OperationalAlert[] = [];
  unreadCount = 0;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeObservable(this, {
      alerts: observable,
      unreadCount: observable,
      isLoading: observable,
      error: observable,
      setLoading: action,
      setError: action,
      resetError: action,
      fetchAlerts: action,
      markRead: action,
      markAllRead: action,
      refreshUnreadCount: action,
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

  private toMessage(error: unknown): string {
    if (error instanceof ApiServiceError) return error.message;
    return "Unexpected error";
  }

  async fetchAlerts(params?: GetAlertsParams) {
    this.setLoading(true);
    this.resetError();
    try {
      const data = await alertsApi.getAlerts(params);
      this.alerts = data;
      this.unreadCount = data.filter((item) => !item.isRead).length;
      return data;
    } catch (error) {
      this.setError(this.toMessage(error));
      return [];
    } finally {
      this.setLoading(false);
    }
  }

  async markRead(id: string) {
    this.resetError();
    try {
      const updated = await alertsApi.markAlertRead(id);
      const index = this.alerts.findIndex((item) => item.id === id);
      if (index >= 0) {
        this.alerts[index] = updated;
      }
      this.unreadCount = this.alerts.filter((item) => !item.isRead).length;
      return updated;
    } catch (error) {
      this.setError(this.toMessage(error));
      return null;
    }
  }

  async markAllRead(params?: { farmId?: string; lotId?: string }) {
    this.resetError();
    try {
      await alertsApi.markAllAlertsRead(params);
      this.alerts = this.alerts.map((item) => ({ ...item, isRead: true }));
      this.unreadCount = 0;
      return true;
    } catch (error) {
      this.setError(this.toMessage(error));
      return false;
    }
  }

  async refreshUnreadCount() {
    this.resetError();
    try {
      const unread = await alertsApi.getAlerts({
        unreadOnly: true,
        limit: 100,
      });
      this.unreadCount = unread.length;
      return this.unreadCount;
    } catch (error) {
      this.setError(this.toMessage(error));
      return 0;
    }
  }
}
