import { AuthStore } from "./AuthStore";
import { CoopStore } from "./CoopStore";
import { DailyEntryStore } from "./DailyEntryStore";
import { FarmStore } from "./FarmStore";
import { LotExpenseStore } from "./LotExpenseStore";
import { LotStore } from "./LotStore";

export class RootStore {
  authStore: AuthStore;
  farmStore: FarmStore;
  coopStore: CoopStore;
  lotStore: LotStore;
  dailyEntryStore: DailyEntryStore;
  lotExpenseStore: LotExpenseStore;

  constructor() {
    this.authStore = new AuthStore();
    this.farmStore = new FarmStore();
    this.coopStore = new CoopStore();
    this.lotStore = new LotStore();
    this.dailyEntryStore = new DailyEntryStore();
    this.lotExpenseStore = new LotExpenseStore();
  }
}

export const rootStore = new RootStore();
