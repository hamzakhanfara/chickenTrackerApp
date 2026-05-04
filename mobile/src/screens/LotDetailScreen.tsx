import { useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { observer } from "mobx-react-lite";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/AppNavigator";
import { rootStore } from "../stores/RootStore";
import type { OperationalAlert } from "../services/types";

type Props = NativeStackScreenProps<AppStackParamList, "LotDetail">;

const C = {
  bg: "#f7fbf1",
  card: "#FFFFFF",
  primary: "#1B5E20",
  action: "#FF6F00",
  text: "#191d17",
  muted: "#717a6d",
  border: "#E0E0E0",
  successBg: "#E8F5E9",
  successText: "#1B5E20",
  danger: "#ba1a1a",
  dangerBg: "#ffdad6",
};

const CYCLE_TARGET_DAYS = 42;

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const daysSince = (isoDate: string): number => {
  const start = new Date(isoDate);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const dateLabel = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const moneyLabel = (value: number): string =>
  `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} DH`;

export const LotDetailScreen = observer(({ route, navigation }: Props) => {
  const { lotId, lotCode, coopId } = route.params;
  const { lotStore, dailyEntryStore, lotExpenseStore, alertStore } = rootStore;

  useEffect(() => {
    void lotStore.fetchLotById(lotId);
    void dailyEntryStore.fetchEntriesByLot(lotId);
    // Use cache immediately if available, then refresh in background.
    void lotExpenseStore.fetchLotExpenses(lotId);
    void alertStore.fetchAlerts({ lotId, limit: 5 });
  }, [alertStore, dailyEntryStore, lotExpenseStore, lotId, lotStore]);

  const retryAll = () => {
    void lotStore.fetchLotById(lotId);
    void dailyEntryStore.fetchEntriesByLot(lotId);
    void lotExpenseStore.fetchLotExpenses(lotId);
    void alertStore.fetchAlerts({ lotId, limit: 5 });
  };

  const severityColor = (severity: OperationalAlert["severity"]) => {
    if (severity === "CRITICAL") return "#D32F2F";
    if (severity === "WARNING") return "#FF6F00";
    return C.primary;
  };

  const alertsForLot = alertStore.alerts.filter((item) => item.lotId === lotId);

  const expense = lotExpenseStore.expenseByLotId[lotId];
  const fixedExpenseRows = [
    {
      key: "chickPrice",
      label: "Prix poussin / سعر الكتكوت",
      value: toNumber(expense?.chickPrice),
    },
    {
      key: "vaccinationExpense",
      label: "Vaccination / التطعيم",
      value: toNumber(expense?.vaccinationExpense),
    },
    {
      key: "coopExpense",
      label: "Poulailler / القن",
      value: toNumber(expense?.coopExpense),
    },
    {
      key: "farmerExpense",
      label: "Main d'œuvre / العمالة",
      value: toNumber(expense?.farmerExpense),
    },
    {
      key: "gasExpense",
      label: "Gaz / الغاز",
      value: toNumber(expense?.gasExpense),
    },
    {
      key: "waterExpense",
      label: "Eau / الماء",
      value: toNumber(expense?.waterExpense),
    },
    {
      key: "feedExpense",
      label: "Aliment / العلف",
      value: toNumber(expense?.feedExpense),
    },
  ].filter((row) => row.value !== null);

  const additionalExpenseRows = (expense?.additionalExpenses ?? [])
    .map((item) => ({
      id: item.id,
      label: item.label,
      value: toNumber(item.amount),
    }))
    .filter((item) => item.value !== null);

  const fixedTotal = fixedExpenseRows.reduce(
    (sum, row) => sum + (row.value ?? 0),
    0,
  );
  const additionalTotal = additionalExpenseRows.reduce(
    (sum, row) => sum + (row.value ?? 0),
    0,
  );
  const totalExpenses = fixedTotal + additionalTotal;

  const lot =
    lotStore.selectedItem?.id === lotId ? lotStore.selectedItem : null;
  const estimatedGlobalTotal =
    expense?.entryMode === "PER_CHICK" && lot && lot.initialCount > 0
      ? totalExpenses * lot.initialCount
      : null;
  const entries = dailyEntryStore.entriesByLot[lotId] ?? [];
  const latestEntry = entries[0] ?? null;

  const ageDays = lot ? daysSince(lot.entryDate) : 0;
  const progressPct = Math.max(
    0,
    Math.min(100, Math.round((ageDays / CYCLE_TARGET_DAYS) * 100)),
  );
  const daysLeft = Math.max(0, CYCLE_TARGET_DAYS - ageDays);

  const totalMortality = entries.reduce(
    (sum, item) => sum + item.mortalityCount,
    0,
  );
  const birdsAlive = lot
    ? Math.max(0, lot.initialCount - totalMortality)
    : null;
  const latestAvgWeight = toNumber(latestEntry?.avgWeightGrams);
  const totalFeedKg = entries.reduce(
    (sum, item) => sum + (toNumber(item.feedConsumedKg) ?? 0),
    0,
  );

  const avgIc =
    birdsAlive && birdsAlive > 0 && latestAvgWeight && latestAvgWeight > 0
      ? totalFeedKg / ((latestAvgWeight / 1000) * birdsAlive)
      : null;
  const isClosed = lot?.status === "closed";
  const closedDate = lot?.closure?.closureDate;

  const closeLotNow = () => {
    if (!lot) return;
    Alert.alert(
      "Confirm close lot",
      "This action is irreversible. Daily entry will be blocked after closing this lot.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Close",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const closed = await lotStore.closeLot(lot.id);
              if (!closed) {
                Alert.alert(
                  "Erreur",
                  lotStore.error ?? "Impossible de clôturer ce lot.",
                );
                return;
              }
              await lotStore.fetchLotsByCoop(coopId, { page: 1, limit: 100 });
              Alert.alert("Succès", "Lot clôturé avec succès.");
            })();
          },
        },
      ],
    );
  };

  if (lotStore.isLoading && !lot) {
    return (
      <View style={s.center}>
        <View style={[s.skeleton, { height: 210, marginBottom: 12 }]} />
        <View style={[s.skeleton, { height: 120 }]} />
      </View>
    );
  }

  if (!lot || lotStore.error) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>{lotStore.error ?? "Lot indisponible"}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={retryAll}>
          <Text style={s.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.appName}>PoultryTrack / بولتري تراك</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.breadcrumbRow}>
          <Text style={s.breadcrumb}>Lot Details / تفاصيل الدفعة</Text>
        </View>

        <View style={s.mainCard}>
          <View style={s.cardHeader}>
            <View>
              <Text style={s.lotTitle}>
                Lot {lotCode ?? lot.code} / دفعة {lotCode ?? lot.code}
              </Text>
              <Text style={s.lotMeta}>
                Started: {dateLabel(lot.entryDate)} / بدأ في{" "}
                {dateLabel(lot.entryDate)}
              </Text>
              <Text style={s.lotMeta}>Breed: {lot.breed}</Text>
            </View>
            <View style={[s.activeBadge, isClosed && s.activeBadgeClosed]}>
              <View style={[s.activeDot, isClosed && s.activeDotClosed]} />
              <Text
                style={[s.activeBadgeText, isClosed && s.activeBadgeTextClosed]}
              >
                {isClosed ? "Closed / مغلق" : "Active / نشط"}
              </Text>
            </View>
          </View>
          {isClosed && (
            <Text style={s.closedDateText}>
              Closed at:{" "}
              {closedDate ? dateLabel(closedDate) : dateLabel(lot.updatedAt)}
            </Text>
          )}

          <View style={s.progressBlock}>
            <View style={s.progressTop}>
              <Text style={s.progressLabel}>Cycle Progress / تقدم الدورة</Text>
              <Text style={s.progressValue}>{progressPct}%</Text>
            </View>
            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  { width: `${progressPct}%` as `${number}%` },
                ]}
              />
            </View>
            <View style={s.progressBottom}>
              <Text style={s.progressCaption}>
                Day {ageDays} / يوم {ageDays}
              </Text>
              <Text style={s.progressCaption}>
                {daysLeft} Days Left / {daysLeft} أيام متبقية
              </Text>
            </View>
          </View>

          <View style={s.kpiGrid}>
            <View style={s.kpiCard}>
              <Text style={s.kpiIcon}>🐔</Text>
              <Text style={s.kpiLabel}>Alive / الأحياء</Text>
              <Text style={s.kpiValue}>
                {birdsAlive?.toLocaleString() ?? "--"}
              </Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiIcon}>☠️</Text>
              <Text style={s.kpiLabel}>Mortality / الوفيات</Text>
              <Text style={[s.kpiValue, { color: C.danger }]}>
                {totalMortality}
              </Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiIcon}>📊</Text>
              <Text style={s.kpiLabel}>Current IC / دليل الاستهلاك</Text>
              <Text style={s.kpiValue}>{avgIc ? avgIc.toFixed(2) : "--"}</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiIcon}>⚖️</Text>
              <Text style={s.kpiLabel}>Avg Weight / الوزن المتوسط</Text>
              <Text style={s.kpiValue}>
                {latestAvgWeight ? `${Math.round(latestAvgWeight)} g` : "--"}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.alertCard}>
          <Text style={s.alertTitle}>Lot Alerts / تنبيهات الدفعة</Text>
          {alertStore.isLoading ? (
            <Text style={s.alertDesc}>Chargement des alertes...</Text>
          ) : alertStore.error ? (
            <Text style={[s.alertDesc, { color: C.danger }]}>
              {alertStore.error}
            </Text>
          ) : alertsForLot.length === 0 ? (
            <Text style={s.alertDesc}>Aucune alerte pour ce lot.</Text>
          ) : (
            alertsForLot.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  s.historyItem,
                  {
                    marginTop: 10,
                    borderLeftWidth: 3,
                    borderLeftColor: severityColor(item.severity),
                  },
                ]}
                onPress={() => {
                  void alertStore.markRead(item.id);
                }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.historyText}>{item.title}</Text>
                  <Text style={s.historySub}>{item.message}</Text>
                </View>
                {!item.isRead && (
                  <Text
                    style={{
                      color: C.primary,
                      fontWeight: "700",
                      fontSize: 11,
                    }}
                  >
                    NEW
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={s.expensesCard}>
          <View style={s.expensesHeaderRow}>
            <Text style={s.expensesTitle}>Dépenses / المصاريف</Text>
            {expense && (
              <View style={s.modeChip}>
                <Text style={s.modeChipText}>
                  {expense.entryMode === "PER_CHICK" ? "Par poussin" : "Total"}
                </Text>
              </View>
            )}
          </View>

          {lotExpenseStore.isLoading && !expense ? (
            <View>
              <View style={[s.expenseSkeleton, { width: "65%" }]} />
              <View style={[s.expenseSkeleton, { width: "85%" }]} />
              <View style={[s.expenseSkeleton, { width: "55%" }]} />
            </View>
          ) : lotExpenseStore.error ? (
            <View style={s.expenseErrorBox}>
              <Text style={s.expenseErrorText}>{lotExpenseStore.error}</Text>
              <TouchableOpacity
                style={s.expenseRetryBtn}
                onPress={() => {
                  void lotExpenseStore.fetchLotExpenses(lotId);
                }}
              >
                <Text style={s.expenseRetryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : !expense ? (
            <View style={s.expenseEmptyBox}>
              <Text style={s.expenseEmptyText}>Aucune dépense enregistrée</Text>
              <TouchableOpacity
                style={s.expenseAddBtn}
                onPress={() =>
                  navigation.navigate("CreateDailyEntry", {
                    lotId: lot.id,
                    lotCode: lot.code,
                  })
                }
              >
                <Text style={s.expenseAddBtnText}>Ajouter des dépenses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {fixedExpenseRows.length > 0 && (
                <View style={s.expenseSection}>
                  {fixedExpenseRows.map((item) => (
                    <View style={s.expenseRow} key={item.key}>
                      <Text style={s.expenseLabel}>{item.label}</Text>
                      <Text style={s.expenseValue}>
                        {moneyLabel(item.value ?? 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {additionalExpenseRows.length > 0 && (
                <View style={[s.expenseSection, s.expenseSectionTopBorder]}>
                  <Text style={s.expenseSubTitle}>Supplémentaires</Text>
                  {additionalExpenseRows.map((item) => (
                    <View style={s.expenseRow} key={item.id}>
                      <Text style={s.expenseLabel}>{item.label}</Text>
                      <Text style={s.expenseValue}>
                        {moneyLabel(item.value ?? 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={[s.expenseSection, s.expenseSectionTopBorder]}>
                <View style={s.expenseRow}>
                  <Text style={s.totalLabel}>Total Expenses</Text>
                  <Text style={s.totalValue}>{moneyLabel(totalExpenses)}</Text>
                </View>
                {estimatedGlobalTotal !== null && (
                  <View style={s.expenseRow}>
                    <Text style={s.totalSubLabel}>
                      Estimé global ({lot.initialCount} oiseaux)
                    </Text>
                    <Text style={s.totalSubValue}>
                      {moneyLabel(estimatedGlobalTotal)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {!isClosed ? (
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() =>
              navigation.navigate("CreateDailyEntry", {
                lotId: lot.id,
                lotCode: lot.code,
              })
            }
          >
            <Text style={s.primaryBtnText}>
              ＋ Add Daily Log / إضافة سجل يومي
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={s.disabledDailyEntryBox}>
            <Text style={s.disabledDailyEntryText}>
              Daily Entry disabled for closed lots / الإدخال اليومي غير متاح
              للدورات المغلقة
            </Text>
          </View>
        )}

        {!isClosed && (
          <TouchableOpacity style={s.closeBtn} onPress={closeLotNow}>
            <Text style={s.closeBtnText}>
              Close Lot / Clôturer le lot / إنهاء الدورة
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            s.secondaryBtn,
            { backgroundColor: "#E8F5E9", borderColor: C.primary },
          ]}
          onPress={() =>
            navigation.navigate("AddTask", {
              farmId: route.params.farmId,
              lotId: lot.id,
              lotCode: lot.code,
            })
          }
        >
          <Text style={[s.secondaryBtnText, { color: C.primary }]}>
            📅 Tâches calendrier / مهام التقويم
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.secondaryBtn}
          onPress={() =>
            navigation.navigate("Reports", {
              farmId: route.params.farmId,
              lotId: lot.id,
              lotCode: lot.code,
            })
          }
        >
          <Text style={s.secondaryBtnText}>
            📄 Generate Report / إصدار تقرير
          </Text>
        </TouchableOpacity>

        <View style={s.historySection}>
          <Text style={s.historyTitle}>Recent Activity / النشاط الأخير</Text>
          {(entries.length > 0 ? entries.slice(0, 2) : [null]).map(
            (item, idx) => (
              <View
                key={item?.id ?? `placeholder-${idx}`}
                style={s.historyItem}
              >
                <Text style={s.historyIcon}>{item ? "🧾" : "ℹ️"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.historyText}>
                    {item
                      ? `Daily entry • Mortality ${item.mortalityCount}`
                      : "No daily entries yet"}
                  </Text>
                  <Text style={s.historySub}>
                    {item
                      ? String(item.entryDate).slice(0, 10)
                      : "Start by adding today entry"}
                  </Text>
                </View>
              </View>
            ),
          )}
        </View>
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
  appName: { fontSize: 16, fontWeight: "800", color: C.primary },
  content: { padding: 16, paddingBottom: 100 },
  breadcrumbRow: { marginBottom: 12 },
  breadcrumb: { color: C.primary, fontSize: 14, fontWeight: "600" },
  mainCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  lotTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
    color: C.primary,
  },
  lotMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: C.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeClosed: { backgroundColor: "#F5F5F5" },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
    marginRight: 6,
  },
  activeDotClosed: { backgroundColor: "#6B7280" },
  activeBadgeText: { fontSize: 11, fontWeight: "600", color: C.successText },
  activeBadgeTextClosed: { color: "#4B5563" },
  closedDateText: {
    marginTop: -4,
    marginHorizontal: 16,
    marginBottom: 10,
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
  },
  progressBlock: { backgroundColor: "#f2f5ec", padding: 16 },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: { fontSize: 14, fontWeight: "500", color: C.text },
  progressValue: { fontSize: 20, fontWeight: "700", color: C.primary },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: C.primary,
  },
  progressBottom: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressCaption: { fontSize: 12, color: C.muted },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  kpiCard: {
    width: "50%",
    alignItems: "center",
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  kpiIcon: { fontSize: 18, marginBottom: 2 },
  kpiLabel: { fontSize: 12, color: C.muted, textAlign: "center" },
  kpiValue: { fontSize: 20, fontWeight: "700", color: C.text, marginTop: 3 },
  alertCard: {
    marginTop: 12,
    backgroundColor: C.card,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.action,
    padding: 14,
  },
  alertTitle: { fontSize: 14, fontWeight: "700", color: C.text },
  alertDesc: { marginTop: 4, fontSize: 12, color: C.muted },
  expensesCard: {
    marginTop: 12,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    padding: 14,
  },
  expensesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  expensesTitle: { fontSize: 15, fontWeight: "700", color: C.primary },
  modeChip: {
    backgroundColor: "#E8F5E9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modeChipText: { color: C.primary, fontSize: 11, fontWeight: "700" },
  expenseSkeleton: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    marginTop: 10,
  },
  expenseErrorBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEE2E2",
    padding: 10,
  },
  expenseErrorText: { color: "#991B1B", fontSize: 12, marginBottom: 8 },
  expenseRetryBtn: {
    alignSelf: "flex-start",
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  expenseRetryText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  expenseEmptyBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#FAFAFA",
    padding: 10,
  },
  expenseEmptyText: { color: C.muted, fontSize: 12, marginBottom: 8 },
  expenseAddBtn: {
    alignSelf: "flex-start",
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: C.action,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  expenseAddBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  expenseSection: { marginTop: 4 },
  expenseSectionTopBorder: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  expenseSubTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
    marginBottom: 6,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 10,
  },
  expenseLabel: { flex: 1, color: C.text, fontSize: 12 },
  expenseValue: { color: C.text, fontSize: 12, fontWeight: "700" },
  totalLabel: { flex: 1, color: C.primary, fontSize: 13, fontWeight: "800" },
  totalValue: { color: C.primary, fontSize: 14, fontWeight: "800" },
  totalSubLabel: { flex: 1, color: C.muted, fontSize: 11, fontWeight: "600" },
  totalSubValue: { color: C.text, fontSize: 12, fontWeight: "700" },
  primaryBtn: {
    marginTop: 12,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  closeBtn: {
    marginTop: 10,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  closeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  disabledDailyEntryBox: {
    marginTop: 12,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  disabledDailyEntryText: {
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryBtn: {
    marginTop: 10,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: C.action,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  historySection: { marginTop: 20 },
  historyTitle: {
    color: C.primary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  historyItem: {
    backgroundColor: C.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  historyIcon: { fontSize: 16 },
  historyText: { fontSize: 12, color: C.text, fontWeight: "600" },
  historySub: { fontSize: 11, color: C.muted, marginTop: 2 },
  center: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  skeleton: { width: "100%", borderRadius: 12, backgroundColor: "#E5E7EB" },
  errorText: { color: C.danger, textAlign: "center", marginBottom: 12 },
  retryBtn: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  retryText: { color: "#fff", fontWeight: "700" },
});
