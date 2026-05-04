import { Lot, LotStatus, PrismaClient } from "@prisma/client";
import { ReportEstimatorQueryDto } from "../validators/reports.validator";

const prisma = new PrismaClient();

const DEFAULT_SELL_PRICE_PER_KG = 17;
const FALLBACK_PROJECTED_WEIGHT_KG = 2.2;

type Zone = "good" | "watch" | "critical" | "unavailable";
type Trend = "improving" | "stable" | "worsening" | "unavailable";

type Metric = {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  zone: Zone;
  trend: Trend;
  formula: string;
  available: boolean;
  context?: string;
};

type Tip = {
  id: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  description: string;
  recommendedActions: string[];
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const safeDiv = (a: number, b: number): number | null => {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
};

const round2 = (value: number | null): number | null => {
  if (value === null) return null;
  return Math.round(value * 100) / 100;
};

const slope = (values: number[]): number | null => {
  if (values.length < 3) return null;
  const n = values.length;
  const xs = Array.from({ length: n }, (_, i) => i + 1);
  const sumX = xs.reduce((s, x) => s + x, 0);
  const sumY = values.reduce((s, y) => s + y, 0);
  const sumXY = values.reduce((s, y, i) => s + y * xs[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  return (n * sumXY - sumX * sumY) / denom;
};

const trendFromSlope = (
  computedSlope: number | null,
  betterWhenLower = false,
): Trend => {
  if (computedSlope === null) return "unavailable";
  if (Math.abs(computedSlope) < 0.01) return "stable";
  if (betterWhenLower) {
    return computedSlope < 0 ? "improving" : "worsening";
  }
  return computedSlope > 0 ? "improving" : "worsening";
};

const zoneMortality = (ratePct: number | null): Zone => {
  if (ratePct === null) return "unavailable";
  if (ratePct <= 3) return "good";
  if (ratePct <= 5) return "watch";
  return "critical";
};

const zoneAdg = (adg: number | null): Zone => {
  if (adg === null) return "unavailable";
  if (adg >= 55) return "good";
  if (adg >= 45) return "watch";
  return "critical";
};

const zoneFcr = (fcr: number | null): Zone => {
  if (fcr === null) return "unavailable";
  if (fcr <= 1.8) return "good";
  if (fcr <= 2.0) return "watch";
  return "critical";
};

const zoneUniformity = (uniformity: number | null): Zone => {
  if (uniformity === null) return "unavailable";
  if (uniformity >= 85) return "good";
  if (uniformity >= 75) return "watch";
  return "critical";
};

const zoneWaterFeedRatio = (ratio: number | null): Zone => {
  if (ratio === null) return "unavailable";
  if (ratio >= 1.6 && ratio <= 2.2) return "good";
  if (ratio >= 1.4 && ratio <= 2.5) return "watch";
  return "critical";
};

const startOfDayUtc = (date: Date): Date => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (from: Date, to: Date): number => {
  const ms = startOfDayUtc(to).getTime() - startOfDayUtc(from).getTime();
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

async function getOwnedLot(userId: string, lotId: string) {
  return prisma.lot.findFirst({
    where: { id: lotId, coop: { farm: { userId } } },
    include: {
      coop: { include: { farm: true } },
      dailyEntries: { orderBy: { entryDate: "asc" } },
      lotExpense: { include: { additionalExpenses: true } },
    },
  });
}

function computeLotSummary(
  lot: Lot & {
    coop: { id: string; farm: { id: string; name: string } };
    dailyEntries: Array<{
      id: string;
      entryDate: Date;
      mortalityCount: number;
      feedConsumedKg: unknown;
      avgWeightGrams: unknown;
      waterLiters: unknown;
    }>;
    lotExpense: {
      entryMode: "PER_CHICK" | "TOTAL";
      chickPrice: unknown;
      vaccinationExpense: unknown;
      coopExpense: unknown;
      farmerExpense: unknown;
      gasExpense: unknown;
      waterExpense: unknown;
      feedExpense: unknown;
      additionalExpenses: Array<{ amount: unknown; label: string }>;
    } | null;
  },
  estimatorInputs?: ReportEstimatorQueryDto,
) {
  const entries = lot.dailyEntries;
  const latest = entries[entries.length - 1] ?? null;

  const totalMortality = entries.reduce(
    (sum, item) => sum + item.mortalityCount,
    0,
  );
  const survivingBirds = Math.max(0, lot.initialCount - totalMortality);

  const expense = lot.lotExpense;
  const fixedCosts = {
    chickPrice: toNumber(expense?.chickPrice) ?? 0,
    vaccinationExpense: toNumber(expense?.vaccinationExpense) ?? 0,
    coopExpense: toNumber(expense?.coopExpense) ?? 0,
    farmerExpense: toNumber(expense?.farmerExpense) ?? 0,
    gasExpense: toNumber(expense?.gasExpense) ?? 0,
    waterExpense: toNumber(expense?.waterExpense) ?? 0,
    feedExpense: toNumber(expense?.feedExpense) ?? 0,
  };

  const additionalExpenseTotal = (expense?.additionalExpenses ?? []).reduce(
    (sum, item) => sum + (toNumber(item.amount) ?? 0),
    0,
  );

  const totalExpense =
    fixedCosts.chickPrice +
    fixedCosts.vaccinationExpense +
    fixedCosts.coopExpense +
    fixedCosts.farmerExpense +
    fixedCosts.gasExpense +
    fixedCosts.waterExpense +
    fixedCosts.feedExpense +
    additionalExpenseTotal;

  const feedCostShare = round2(
    safeDiv(fixedCosts.feedExpense, totalExpense) !== null
      ? (safeDiv(fixedCosts.feedExpense, totalExpense) as number) * 100
      : null,
  );

  const costPerChick = round2(safeDiv(totalExpense, lot.initialCount));
  const costPerSurvivingChick = round2(safeDiv(totalExpense, survivingBirds));

  const latestAvgWeightGr = toNumber(latest?.avgWeightGrams);
  const latestAvgWeightKg =
    latestAvgWeightGr !== null ? latestAvgWeightGr / 1000 : null;
  const totalLiveWeightKg =
    latestAvgWeightKg !== null ? latestAvgWeightKg * survivingBirds : null;
  const costPerKgLiveWeight = round2(
    totalLiveWeightKg !== null
      ? safeDiv(totalExpense, totalLiveWeightKg)
      : null,
  );

  const projectedSurvivingBirds =
    estimatorInputs?.projectedSurvivingBirds ?? survivingBirds;
  const projectedAvgWeightKg =
    estimatorInputs?.projectedAvgWeightKg ??
    latestAvgWeightKg ??
    FALLBACK_PROJECTED_WEIGHT_KG;
  const sellPricePerKg =
    estimatorInputs?.sellPricePerKg ??
    toNumber(lot.entryPricePerKg) ??
    DEFAULT_SELL_PRICE_PER_KG;

  const hasProjectedSurvivors = projectedSurvivingBirds > 0;
  const hasProjectedWeight = projectedAvgWeightKg > 0;
  const hasSellPrice = sellPricePerKg > 0;

  const projectedRevenue =
    hasProjectedSurvivors && hasProjectedWeight && hasSellPrice
      ? projectedSurvivingBirds * projectedAvgWeightKg * sellPricePerKg
      : null;

  const grossMargin =
    projectedRevenue !== null ? projectedRevenue - totalExpense : null;
  const marginRate =
    projectedRevenue && projectedRevenue > 0
      ? round2((grossMargin! / projectedRevenue) * 100)
      : null;
  const breakEvenPricePerKg =
    hasProjectedSurvivors && hasProjectedWeight
      ? round2(totalExpense / (projectedSurvivingBirds * projectedAvgWeightKg))
      : null;

  const missingInputs: string[] = [];
  if (!hasProjectedSurvivors) missingInputs.push("projectedSurvivingBirds");
  if (!hasProjectedWeight) missingInputs.push("projectedAvgWeightKg");
  if (!hasSellPrice) missingInputs.push("sellPricePerKg");

  const mortalityRatePct = round2(
    (safeDiv(totalMortality, lot.initialCount) ?? 0) * 100,
  );

  const totalFeedKg = entries.reduce(
    (sum, item) => sum + (toNumber(item.feedConsumedKg) ?? 0),
    0,
  );

  const totalWaterLiters = entries.reduce(
    (sum, item) => sum + (toNumber(item.waterLiters) ?? 0),
    0,
  );

  const initialWeightKg =
    toNumber(lot.initialWeightKg) ??
    (latestAvgWeightKg !== null ? Math.max(0, latestAvgWeightKg * 0.4) : 0);

  const totalWeightGainKg =
    latestAvgWeightKg !== null
      ? Math.max(
          0,
          latestAvgWeightKg * survivingBirds -
            initialWeightKg * lot.initialCount,
        )
      : 0;

  const fcr = round2(
    totalWeightGainKg > 0 ? totalFeedKg / totalWeightGainKg : null,
  );

  const adg = (() => {
    if (!latestAvgWeightGr) return null;
    const initialWeightGr = initialWeightKg * 1000;
    const gain = latestAvgWeightGr - initialWeightGr;
    if (gain <= 0) return null;
    const ageDays = daysBetween(lot.entryDate, latest?.entryDate ?? new Date());
    return round2(gain / ageDays);
  })();

  const waterFeedRatio = round2(
    totalFeedKg > 0 ? totalWaterLiters / totalFeedKg : null,
  );

  const weightSeries = entries
    .map((item) => toNumber(item.avgWeightGrams))
    .filter((value): value is number => value !== null);

  const uniformityProxy = (() => {
    if (weightSeries.length < 4) return null;
    const recent = weightSeries.slice(-7);
    const mean = recent.reduce((s, v) => s + v, 0) / recent.length;
    if (mean <= 0) return null;
    const variance =
      recent.reduce((s, v) => s + (v - mean) * (v - mean), 0) / recent.length;
    const std = Math.sqrt(variance);
    const cvPct = (std / mean) * 100;
    const score = Math.max(0, Math.min(100, 100 - cvPct));
    return round2(score);
  })();

  const mortalityTrendSeries = entries.map(
    (item) => (safeDiv(item.mortalityCount, lot.initialCount) ?? 0) * 100,
  );
  const adgTrendSeries = weightSeries
    .slice(1)
    .map((value, idx) => value - weightSeries[idx])
    .filter((v) => Number.isFinite(v));

  const healthMetrics: Metric[] = [
    {
      key: "mortalityRate",
      label: "Mortality rate",
      value: mortalityRatePct,
      unit: "%",
      zone: zoneMortality(mortalityRatePct),
      trend: trendFromSlope(slope(mortalityTrendSeries), true),
      formula: "totalMortality / initialBirdCount",
      available: true,
      context: "Taux cumulé depuis le démarrage du lot",
    },
    {
      key: "adg",
      label: "ADG / GMQ",
      value: adg,
      unit: "g/day",
      zone: zoneAdg(adg),
      trend: trendFromSlope(slope(adgTrendSeries)),
      formula: "(latestAvgWeight - initialAvgWeight) / ageDays",
      available: adg !== null,
    },
    {
      key: "fcr",
      label: "FCR / IC",
      value: fcr,
      unit: "ratio",
      zone: zoneFcr(fcr),
      trend: "unavailable",
      formula: "totalFeedKg / totalWeightGainKg",
      available: fcr !== null,
    },
    {
      key: "uniformityProxy",
      label: "Uniformity proxy",
      value: uniformityProxy,
      unit: "%",
      zone: zoneUniformity(uniformityProxy),
      trend: trendFromSlope(slope(weightSeries)),
      formula: "100 - CV% (sur les dernières pesées)",
      available: uniformityProxy !== null,
    },
    {
      key: "waterFeedRatio",
      label: "Water / Feed ratio",
      value: waterFeedRatio,
      unit: "L/kg",
      zone: zoneWaterFeedRatio(waterFeedRatio),
      trend: trendFromSlope(
        slope(entries.map((item) => toNumber(item.waterLiters) ?? 0)),
      ),
      formula: "totalWaterLiters / totalFeedKg",
      available: waterFeedRatio !== null,
    },
  ];

  const optimizationTips: Tip[] = [];

  const metricByKey = Object.fromEntries(
    healthMetrics.map((m) => [m.key, m]),
  ) as Record<string, Metric>;

  if (
    metricByKey.fcr?.zone === "critical" ||
    metricByKey.fcr?.zone === "watch"
  ) {
    optimizationTips.push({
      id: `tip-fcr-${lot.id}`,
      severity: metricByKey.fcr.zone === "critical" ? "CRITICAL" : "WARNING",
      title: "Feed efficiency needs correction",
      description: "FCR is above target. Feed is likely underperforming.",
      recommendedActions: [
        "Contrôler la qualité de l'aliment (granulométrie/protéine)",
        "Vérifier la distribution (horaires, gaspillage, accès)",
        "Revoir densité et ventilation pour limiter le stress",
      ],
    });
  }

  if (
    metricByKey.mortalityRate?.zone === "critical" ||
    metricByKey.mortalityRate?.trend === "worsening"
  ) {
    optimizationTips.push({
      id: `tip-mortality-${lot.id}`,
      severity: "CRITICAL",
      title: "Mortality alert",
      description:
        "Mortality is high or rising. Immediate flock health verification is required.",
      recommendedActions: [
        "Isoler et examiner les sujets faibles",
        "Renforcer biosécurité et hygiène des accès",
        "Consulter rapidement un vétérinaire si tendance continue",
      ],
    });
  }

  if (
    metricByKey.adg?.zone === "critical" ||
    metricByKey.adg?.zone === "watch"
  ) {
    optimizationTips.push({
      id: `tip-adg-${lot.id}`,
      severity: metricByKey.adg.zone === "critical" ? "WARNING" : "INFO",
      title: "Growth below potential",
      description: "Average daily gain is below expected trajectory.",
      recommendedActions: [
        "Vérifier température et humidité du poulailler",
        "Revoir densité et accès aux mangeoires",
        "Ajuster ration/protéine selon âge du lot",
      ],
    });
  }

  if (
    metricByKey.waterFeedRatio?.zone === "critical" ||
    metricByKey.waterFeedRatio?.zone === "watch"
  ) {
    optimizationTips.push({
      id: `tip-water-feed-${lot.id}`,
      severity: "WARNING",
      title: "Abnormal water/feed ratio",
      description: "Water/feed ratio is outside normal range.",
      recommendedActions: [
        "Inspecter les lignes d'eau pour fuites",
        "Vérifier pression et qualité de l'eau",
        "Contrôler chaleur ambiante et stress thermique",
      ],
    });
  }

  if (feedCostShare !== null && feedCostShare < 45) {
    optimizationTips.push({
      id: `tip-cost-structure-${lot.id}`,
      severity: "INFO",
      title: "Cost structure review",
      description:
        "Feed share is low relative to total costs; fixed costs may be overweight.",
      recommendedActions: [
        "Renégocier coûts fixes (énergie, main d'œuvre)",
        "Optimiser utilisation du bâtiment",
        "Comparer performance inter-lots pour identifier écarts",
      ],
    });
  }

  const report = {
    scope: "lot" as const,
    lot: {
      id: lot.id,
      code: lot.code,
      status: lot.status,
      farmId: lot.coop.farm.id,
      coopId: lot.coop.id,
      initialBirdCount: lot.initialCount,
      survivingBirds,
      totalMortality,
    },
    financialSummary: {
      totalExpenses: round2(totalExpense) ?? 0,
      feedCostSharePct: feedCostShare,
      costPerChick,
      costPerSurvivingChick,
      costPerKgLiveWeight,
      formulas: {
        survivingBirds: "initialBirdCount - totalMortality",
        costPerChick: "totalExpense / initialBirdCount",
        costPerSurvivingChick: "totalExpense / survivingBirds",
      },
      components: {
        ...fixedCosts,
        additionalExpenseTotal: round2(additionalExpenseTotal) ?? 0,
      },
    },
    revenueEstimator: {
      inputs: {
        sellPricePerKg,
        projectedAvgWeightKg,
        projectedSurvivingBirds,
      },
      outputs: {
        projectedRevenue: round2(projectedRevenue),
        grossMargin: round2(grossMargin),
        marginRatePct: marginRate,
        breakEvenPricePerKg,
      },
      missingInputs,
      formulas: {
        projectedRevenue:
          "projectedSurvivingBirds * projectedAvgWeightKg * sellPricePerKg",
        grossMargin: "projectedRevenue - totalExpense",
        marginRate: "grossMargin / projectedRevenue",
        breakEvenPricePerKg:
          "totalExpense / (projectedSurvivingBirds * projectedAvgWeightKg)",
      },
    },
    healthMetrics,
    optimizationTips,
  };

  return report;
}

export async function getLotSummary(
  userId: string,
  lotId: string,
  estimatorInputs?: ReportEstimatorQueryDto,
) {
  const lot = await getOwnedLot(userId, lotId);
  if (!lot) return { status: "not_found" as const };
  return {
    status: "ok" as const,
    report: computeLotSummary(lot, estimatorInputs),
  };
}

export async function getCoopSummary(
  userId: string,
  coopId: string,
  estimatorInputs?: ReportEstimatorQueryDto,
) {
  const coop = await prisma.coop.findFirst({
    where: { id: coopId, farm: { userId } },
    include: {
      lots: {
        include: {
          coop: { include: { farm: true } },
          dailyEntries: { orderBy: { entryDate: "asc" } },
          lotExpense: { include: { additionalExpenses: true } },
        },
      },
    },
  });

  if (!coop) return { status: "not_found" as const };

  const lotReports = coop.lots.map((lot) =>
    computeLotSummary(lot, estimatorInputs),
  );

  const aggregate = aggregateReports("coop", lotReports);
  return {
    status: "ok" as const,
    report: {
      scope: "coop" as const,
      coop: { id: coop.id, name: coop.name, farmId: coop.farmId },
      lotsCount: coop.lots.length,
      lotReports,
      ...aggregate,
    },
  };
}

export async function getFarmSummary(
  userId: string,
  farmId: string,
  estimatorInputs?: ReportEstimatorQueryDto,
) {
  const farm = await prisma.farm.findFirst({
    where: { id: farmId, userId },
    include: {
      coops: {
        include: {
          lots: {
            include: {
              coop: { include: { farm: true } },
              dailyEntries: { orderBy: { entryDate: "asc" } },
              lotExpense: { include: { additionalExpenses: true } },
            },
          },
        },
      },
    },
  });

  if (!farm) return { status: "not_found" as const };

  const lots = farm.coops.flatMap((coop) => coop.lots);
  const lotReports = lots.map((lot) => computeLotSummary(lot, estimatorInputs));

  const aggregate = aggregateReports("farm", lotReports);
  return {
    status: "ok" as const,
    report: {
      scope: "farm" as const,
      farm: { id: farm.id, name: farm.name },
      coopsCount: farm.coops.length,
      lotsCount: lots.length,
      lotReports,
      ...aggregate,
    },
  };
}

function aggregateReports(
  _scope: "coop" | "farm",
  lotReports: Array<ReturnType<typeof computeLotSummary>>,
) {
  const totalExpenses = lotReports.reduce(
    (sum, item) => sum + item.financialSummary.totalExpenses,
    0,
  );

  const totalRevenue = lotReports.reduce(
    (sum, item) => sum + (item.revenueEstimator.outputs.projectedRevenue ?? 0),
    0,
  );

  const totalMargin = lotReports.reduce(
    (sum, item) => sum + (item.revenueEstimator.outputs.grossMargin ?? 0),
    0,
  );

  const marginRatePct =
    totalRevenue > 0 ? round2((totalMargin / totalRevenue) * 100) : null;

  const metricAvg = (key: string) => {
    const values = lotReports
      .map((report) => report.healthMetrics.find((m) => m.key === key)?.value)
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return round2(
      values.reduce((sum, value) => sum + value, 0) / values.length,
    );
  };

  return {
    financialSummary: {
      totalExpenses: round2(totalExpenses) ?? 0,
      feedCostSharePct: null,
      costPerChick: null,
      costPerSurvivingChick: null,
      costPerKgLiveWeight: null,
      formulas: {
        note: "Aggregated across lot reports",
      },
      components: {},
    },
    revenueEstimator: {
      inputs: null,
      outputs: {
        projectedRevenue: round2(totalRevenue),
        grossMargin: round2(totalMargin),
        marginRatePct,
        breakEvenPricePerKg: null,
      },
      missingInputs: [],
      formulas: {
        note: "Aggregated from lot-level estimator outputs",
      },
    },
    healthMetrics: [
      {
        key: "mortalityRate",
        label: "Mortality rate",
        value: metricAvg("mortalityRate"),
        unit: "%",
        zone: "unavailable" as Zone,
        trend: "unavailable" as Trend,
        formula: "avg(lot mortality rate)",
        available: metricAvg("mortalityRate") !== null,
      },
      {
        key: "adg",
        label: "ADG / GMQ",
        value: metricAvg("adg"),
        unit: "g/day",
        zone: "unavailable" as Zone,
        trend: "unavailable" as Trend,
        formula: "avg(lot ADG)",
        available: metricAvg("adg") !== null,
      },
      {
        key: "fcr",
        label: "FCR / IC",
        value: metricAvg("fcr"),
        unit: "ratio",
        zone: "unavailable" as Zone,
        trend: "unavailable" as Trend,
        formula: "avg(lot FCR)",
        available: metricAvg("fcr") !== null,
      },
    ],
    optimizationTips: lotReports
      .flatMap((report) => report.optimizationTips)
      .slice(0, 8),
  };
}
