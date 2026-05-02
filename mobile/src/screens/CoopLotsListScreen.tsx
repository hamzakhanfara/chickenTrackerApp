import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/AppNavigator";
import { rootStore } from "../stores/RootStore";

type Props = NativeStackScreenProps<AppStackParamList, "CoopLotsList">;
type Filter = "all" | "active" | "closed";

const C = {
  bg: "#f7fbf1",
  card: "#FFFFFF",
  primary: "#1B5E20",
  text: "#191d17",
  muted: "#717a6d",
  border: "#E0E0E0",
  activeBg: "#E8F5E9",
  activeText: "#1B5E20",
  closedBg: "#F5F5F5",
  closedText: "#616161",
};

export const CoopLotsListScreen = observer(({ route, navigation }: Props) => {
  const { farmId, farmName, coopId, coopName } = route.params;
  const { lotStore } = rootStore;
  const [filter, setFilter] = useState<Filter>("all");

  useFocusEffect(
    useCallback(() => {
      void lotStore.fetchLotsByCoop(coopId, { page: 1, limit: 100 });
    }, [coopId, lotStore]),
  );

  const lots = lotStore.getLotsForCoop(coopId);
  const filteredLots = useMemo(() => {
    if (filter === "all") return lots;
    return lots.filter((lot) => lot.status === filter);
  }, [filter, lots]);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("fr-FR");
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.titleBlock}>
          <Text style={s.appName}>PoultryTrack / بولتري تراك</Text>
          <Text style={s.subtitle}>{coopName ?? "Coop"}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>Lots History / سجل الدورات</Text>
        <Text style={s.pageSub}>{farmName ?? "Farm"}</Text>

        <View style={s.filterRow}>
          {(
            [
              { key: "all", label: "All / الكل" },
              { key: "active", label: "Active / نشط" },
              { key: "closed", label: "Closed / مغلق" },
            ] as const
          ).map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[s.filterChip, filter === item.key && s.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text
                style={[
                  s.filterLabel,
                  filter === item.key && s.filterLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {lotStore.isLoading && (
          <View>
            <View style={s.skeleton} />
            <View style={s.skeleton} />
          </View>
        )}

        {lotStore.error && !lotStore.isLoading && (
          <View style={s.centerBox}>
            <Text style={s.errorText}>{lotStore.error}</Text>
            <TouchableOpacity
              style={s.retryBtn}
              onPress={() =>
                void lotStore.fetchLotsByCoop(coopId, { page: 1, limit: 100 })
              }
            >
              <Text style={s.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {!lotStore.isLoading &&
          !lotStore.error &&
          filteredLots.length === 0 && (
            <View style={s.centerBox}>
              <Text style={s.emptyTitle}>Aucun lot pour ce filtre</Text>
            </View>
          )}

        {!lotStore.isLoading &&
          !lotStore.error &&
          filteredLots.map((lot) => {
            const isActive = lot.status === "active";
            return (
              <TouchableOpacity
                key={lot.id}
                style={[s.lotCard, !isActive && s.lotCardClosed]}
                onPress={() =>
                  navigation.navigate("LotDetail", {
                    lotId: lot.id,
                    coopId,
                    farmId,
                    lotCode: lot.code,
                  })
                }
              >
                <View style={s.rowBetween}>
                  <View>
                    <Text style={s.lotCode}>Lot {lot.code}</Text>
                    <Text style={s.meta}>Breed: {lot.breed}</Text>
                  </View>
                  <View
                    style={[
                      s.statusChip,
                      isActive ? s.activeChip : s.closedChip,
                    ]}
                  >
                    <Text
                      style={[
                        s.statusText,
                        isActive ? s.activeChipText : s.closedChipText,
                      ]}
                    >
                      {isActive ? "Active / نشط" : "Closed / مغلق"}
                    </Text>
                  </View>
                </View>

                <View style={s.metaRow}>
                  <Text style={s.meta}>Start: {formatDate(lot.entryDate)}</Text>
                  <Text style={s.meta}>
                    Closed: {formatDate(lot.closure?.closureDate ?? null)}
                  </Text>
                  <Text style={s.meta}>
                    Birds: {lot.initialCount.toLocaleString()} • IC: -- •
                    Mortality: --
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  titleBlock: { flex: 1, marginLeft: 10 },
  appName: { fontSize: 15, fontWeight: "800", color: C.primary },
  subtitle: { fontSize: 12, color: C.muted },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: "700", color: C.primary },
  pageSub: { fontSize: 12, color: C.muted, marginTop: 4 },
  filterRow: { flexDirection: "row", marginTop: 12, marginBottom: 12, gap: 8 },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  filterChipActive: { backgroundColor: C.activeBg, borderColor: "#A5D6A7" },
  filterLabel: { fontSize: 12, color: C.muted, fontWeight: "600" },
  filterLabelActive: { color: C.primary },
  skeleton: {
    height: 90,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginBottom: 10,
  },
  centerBox: { paddingVertical: 24, alignItems: "center" },
  errorText: { color: "#D32F2F", marginBottom: 10 },
  retryBtn: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  retryText: { color: "#fff", fontWeight: "700" },
  emptyTitle: { color: C.muted, fontSize: 14 },
  lotCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  lotCardClosed: { opacity: 0.92 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lotCode: { fontSize: 16, fontWeight: "700", color: C.text },
  meta: { fontSize: 12, color: C.muted, marginTop: 2 },
  statusChip: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  activeChip: { backgroundColor: C.activeBg },
  closedChip: { backgroundColor: C.closedBg },
  statusText: { fontSize: 11, fontWeight: "600" },
  activeChipText: { color: C.activeText },
  closedChipText: { color: C.closedText },
  metaRow: { marginTop: 10, gap: 2 },
});
