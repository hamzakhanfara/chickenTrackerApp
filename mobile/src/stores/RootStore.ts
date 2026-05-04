import { AuthStore } from "./AuthStore";
import { CoopStore } from "./CoopStore";
import { DailyEntryStore } from "./DailyEntryStore";
import { FarmStore } from "./FarmStore";
import { LotExpenseStore } from "./LotExpenseStore";
import { LotStore } from "./LotStore";
import { TaskStore } from "./TaskStore";
import { AlertStore } from "./AlertStore";
import { ReportStore } from "./ReportStore";

export class RootStore {
  authStore: AuthStore;
  farmStore: FarmStore;
  coopStore: CoopStore;
  lotStore: LotStore;
  dailyEntryStore: DailyEntryStore;
  lotExpenseStore: LotExpenseStore;
  taskStore: TaskStore;
  alertStore: AlertStore;
  reportStore: ReportStore;

  constructor() {
    this.authStore = new AuthStore();
    this.farmStore = new FarmStore();
    this.coopStore = new CoopStore();
    this.lotStore = new LotStore();
    this.dailyEntryStore = new DailyEntryStore();
    this.lotExpenseStore = new LotExpenseStore();
    this.taskStore = new TaskStore();
    this.alertStore = new AlertStore();
    this.reportStore = new ReportStore();
  }
}

export const rootStore = new RootStore();
