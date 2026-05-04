import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { observer } from "mobx-react-lite";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/AppNavigator";
import { rootStore } from "../stores/RootStore";
import { coopsApi } from "../services/coops.api";
import { lotsApi } from "../services/lots.api";
import type { LotReportSummary, ReportMetric } from "../services/types";

type Props = NativeStackScreenProps<AppStackParamList, "Reports">;

const C = {
  bg: "#f7fbf1",
  card: "#FFFFFF",
  primary: "#1B5E20",
  action: "#FF6F00",
  text: "#191d17",
  muted: "#717a6d",
  border: "#E0E0E0",
  good: "#2E7D32",
  watch: "#FF8F00",
  critical: "#D32F2F",
};

const money = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "--"
    : `${value.toLocaleString("fr-FR")} DH`;

const number = (value: number | null | undefined, unit = "") =>
  value === null || value === undefined
    ? "--"
    : `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}${unit}`;

const zoneColor = (zone: ReportMetric["zone"]) => {
  if (zone === "good") return C.good;
  if (zone === "watch") return C.watch;
  if (zone === "critical") return C.critical;
  return C.muted;
};

export const ReportsScreen = observer(({ route, navigation }: Props) => {
  const { farmStore, reportStore, lotStore } = rootStore;

  const [lots, setLots] = useState<Array<{ id: string; code: string }>>([]);
  const [selectedLotId, setSelectedLotId] = useState<string | undefined>(
    route.params?.lotId,
  );

  const [sellPricePerKg, setSellPricePerKg] = useState("17");
  const [projectedAvgWeightKg, setProjectedAvgWeightKg] = useState("2.2");
  const [projectedSurvivingBirds, setProjectedSurvivingBirds] = useState("");

  useEffect(() => {
    const loadLots = async () => {
      const farms = farmStore.items;
      if (farms.length === 0) {
        await farmStore.fetchFarms();
      }
      const currentFarms = rootStore.farmStore.items;
      if (currentFarms.length === 0) return;

      const coopPages = await Promise.all(
        currentFarms.map((f) => coopsApi.list(f.id, { page: 1, limit: 100 })),
      );
      const coopIds = coopPages.flatMap((p) => p.coops.map((c) => c.id));
      const lotPages = await Promise.all(
        coopIds.map((id) => lotsApi.list(id, { page: 1, limit: 100 })),
      );
      const activeLots = lotPages
        .flatMap((p) => p.lots)
        .filter((l) => l.status === "active")
        .map((l) => ({ id: l.id, code: l.code }));

      setLots(activeLots);
      if (!selectedLotId && activeLots.length > 0) {
        setSelectedLotId(activeLots[0].id);
      }
    };

    void loadLots();
  }, []);

  useEffect(() => {
    if (!selectedLotId) return;

    const survivorsInput = projectedSurvivingBirds
      ? parseInt(projectedSurvivingBirds, 10)
      : undefined;

    void reportStore.fetchLotReport(selectedLotId, {
      sellPricePerKg: Number(sellPricePerKg) || undefined,
      projectedAvgWeightKg: Number(projectedAvgWeightKg) || undefined,
      projectedSurvivingBirds:
        survivorsInput && Number.isFinite(survivorsInput)
          ? survivorsInput
          : undefined,
    });
  }, [selectedLotId]);

  const report: LotReportSummary | null = selectedLotId
    ? (reportStore.lotReports[selectedLotId] ?? null)
    : null;

  const applyEstimator = () => {
    if (!selectedLotId) return;
    const survivorsInput = projectedSurvivingBirds
      ? parseInt(projectedSurvivingBirds, 10)
      : undefined;

    reportStore.setEstimatorInputs(selectedLotId, {
      sellPricePerKg: Number(sellPricePerKg) || undefined,
      projectedAvgWeightKg: Number(projectedAvgWeightKg) || undefined,
      projectedSurvivingBirds:
        survivorsInput && Number.isFinite(survivorsInput)
          ? survivorsInput
          : undefined,
    });

    void reportStore.fetchLotReport(selectedLotId);
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Reports / التقارير</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionLabel}>Lot</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {lots.map((lot) => (
            <TouchableOpacity
              key={lot.id}
              style={[s.chip, selectedLotId === lot.id && s.chipActive]}
              onPress={() => setSelectedLotId(lot.id)}
            >
              <Text
                style={[
                  s.chipText,
                  selectedLotId === lot.id && s.chipTextActive,
                ]}
              >
                {lot.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {reportStore.isLoading ? (
          <Text style={s.muted}>Chargement du rapport…</Text>
        ) : reportStore.error ? (
          <Text style={[s.muted, { color: C.critical }]}>
            {reportStore.error}
          </Text>
        ) : !report ? (
          <Text style={s.muted}>Aucun lot sélectionné.</Text>
        ) : (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>Financial Summary</Text>
              <Text style={s.help}>
                Based on persisted lot expenses and entries.
              </Text>
              <View style={s.row}>
                <Text style={s.label}>Total expenses</Text>
                <Text style={s.value}>
                  {money(report.financialSummary.totalExpenses)}
                </Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Feed cost share</Text>
                <Text style={s.value}>
                  {number(report.financialSummary.feedCostSharePct, "%")}
                </Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Cost per chick</Text>
                <Text style={s.value}>
                  {money(report.financialSummary.costPerChick)}
                </Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Cost per surviving chick</Text>
                <Text style={s.value}>
                  {money(report.financialSummary.costPerSurvivingChick)}
                </Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Cost per kg live weight</Text>
                <Text style={s.value}>
                  {money(report.financialSummary.costPerKgLiveWeight)}
                </Text>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>Revenue Estimator</Text>
              <Text style={s.help}>
                Formula: birds × avg weight (kg) × market price.
              </Text>

              <Text style={s.inputLabel}>Sell price per kg (DH)</Text>
              <TextInput
                style={s.input}
                value={sellPricePerKg}
                onChangeText={setSellPricePerKg}
                keyboardType="numeric"
              />

              <Text style={s.inputLabel}>Projected avg weight (kg)</Text>
              <TextInput
                style={s.input}
                value={projectedAvgWeightKg}
                onChangeText={setProjectedAvgWeightKg}
                keyboardType="numeric"
              />

              <Text style={s.inputLabel}>Projected surviving birds</Text>
              <TextInput
                style={s.input}
                value={projectedSurvivingBirds}
                onChangeText={setProjectedSurvivingBirds}
                keyboardType="numeric"
                placeholder={String(report.lot.survivingBirds)}
              />

              <TouchableOpacity style={s.applyBtn} onPress={applyEstimator}>
                <Text style={s.applyText}>Recalculate</Text>
              </TouchableOpacity>

              <View style={s.row}>
                <Text style={s.label}>Projected revenue</Text>
                <Text style={s.value}>
                  {money(report.revenueEstimator.outputs.projectedRevenue)}
                </Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Gross margin</Text>
                <Text style={s.value}>
                  {money(report.revenueEstimator.outputs.grossMargin)}
                </Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Margin rate</Text>
                <Text style={s.value}>
                  {number(report.revenueEstimator.outputs.marginRatePct, "%")}
                </Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Break-even price per kg</Text>
                <Text style={s.value}>
                  {money(report.revenueEstimator.outputs.breakEvenPricePerKg)}
                </Text>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>Health Metrics</Text>
              <Text style={s.help}>Scientific KPIs with status zones.</Text>
              {report.healthMetrics.map((metric) => (
                <View
                  key={metric.key}
                  style={[
                    s.metricRow,
                    { borderLeftColor: zoneColor(metric.zone) },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.metricTitle}>{metric.label}</Text>
                    <Text style={s.metricHelp}>{metric.formula}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[s.metricValue, { color: zoneColor(metric.zone) }]}
                    >
                      {number(
                        metric.value,
                        metric.unit === "ratio" ? "" : ` ${metric.unit}`,
                      )}
                    </Text>
                    <Text style={s.metricTrend}>{metric.trend}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>Optimization Tips</Text>
              {report.optimizationTips.length === 0 ? (
                <Text style={s.muted}>No critical tips at the moment.</Text>
              ) : (
                report.optimizationTips.map((tip) => (
                  <View key={tip.id} style={s.tipItem}>
                    <Text style={s.tipTitle}>{tip.title}</Text>
                    <Text style={s.tipDesc}>{tip.description}</Text>
                    {tip.recommendedActions.map((item) => (
                      <Text key={item} style={s.tipAction}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { color: "#fff", fontSize: 20, fontWeight: "700" },
  title: { fontSize: 16, fontWeight: "800", color: C.primary },
  content: { padding: 16, paddingBottom: 60 },
  sectionLabel: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 8,
    fontWeight: "700",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    marginRight: 8,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: C.text, fontSize: 13 },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  muted: { color: C.muted, marginTop: 10 },
  card: {
    marginTop: 12,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    padding: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: C.primary },
  help: { fontSize: 12, color: C.muted, marginTop: 4, marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },
  label: { color: C.text, fontSize: 13, flex: 1 },
  value: { color: C.text, fontSize: 13, fontWeight: "700" },
  inputLabel: { color: C.muted, fontSize: 12, marginTop: 6 },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  applyBtn: {
    marginTop: 10,
    backgroundColor: C.action,
    borderRadius: 10,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: { color: "#fff", fontWeight: "700" },
  metricRow: {
    marginTop: 8,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F2F2F2",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  metricTitle: { color: C.text, fontWeight: "700", fontSize: 13 },
  metricHelp: { color: C.muted, fontSize: 11, marginTop: 2 },
  metricValue: { fontWeight: "800", fontSize: 13 },
  metricTrend: { color: C.muted, fontSize: 11, marginTop: 2 },
  tipItem: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#FCFCFC",
  },
  tipTitle: { fontWeight: "700", color: C.text, fontSize: 13 },
  tipDesc: { color: C.muted, fontSize: 12, marginTop: 3 },
  tipAction: { color: C.text, fontSize: 12, marginTop: 4 },
});
