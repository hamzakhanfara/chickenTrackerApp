import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/AppNavigator";
import { coopsApi } from "../services/coops.api";
import { lotsApi } from "../services/lots.api";
import { Lot } from "../services/types";

type Props = NativeStackScreenProps<
  AppStackParamList,
  "SelectLotForDailyEntry"
>;

const C = {
  bg: "#f7fbf1",
  card: "#FFFFFF",
  primary: "#1B5E20",
  action: "#FF6F00",
  text: "#191d17",
  muted: "#717a6d",
  border: "#E5E7EB",
};

export const SelectLotForDailyEntryScreen = ({ route, navigation }: Props) => {
  const { farmId, farmName } = route.params;
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const coops = await coopsApi.list(farmId, { page: 1, limit: 100 });
        const pages = await Promise.all(
          coops.coops.map((coop) =>
            lotsApi.list(coop.id, { page: 1, limit: 100 }),
          ),
        );
        const activeLots = pages
          .flatMap((p) => p.lots)
          .filter((l) => l.status === "active");
        setLots(activeLots);
      } catch {
        setError("Impossible de charger les lots.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [farmId]);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.headerBody}>
          <Text style={s.appName}>PoultryTrack / بولتري تراك</Text>
          {farmName ? <Text style={s.sub}>{farmName}</Text> : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Choisir un lot / اختر دفعة</Text>
        <Text style={s.desc}>
          Sélectionnez un lot actif pour ajouter une entrée quotidienne.
        </Text>

        {loading && <View style={s.skeleton} />}

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && lots.length === 0 && (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>Aucun lot actif</Text>
            <Text style={s.emptyDesc}>
              Créez ou activez un lot, puis revenez ici.
            </Text>
          </View>
        )}

        {!loading &&
          !error &&
          lots.map((lot) => (
            <TouchableOpacity
              key={lot.id}
              style={s.card}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate("CreateDailyEntry", {
                  lotId: lot.id,
                  lotCode: lot.code,
                })
              }
            >
              <View>
                <Text style={s.lotCode}>Lot #{lot.code}</Text>
                <Text style={s.lotMeta}>
                  Entrée: {String(lot.entryDate).slice(0, 10)}
                </Text>
              </View>
              <View style={s.goBadge}>
                <Text style={s.goText}>Ajouter</Text>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
};

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
  backIcon: { fontSize: 20, color: "#fff", fontWeight: "700" },
  headerBody: { flex: 1, marginLeft: 10 },
  appName: { fontSize: 15, fontWeight: "800", color: C.primary },
  sub: { fontSize: 11, color: C.muted, marginTop: 1 },
  content: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 24, fontWeight: "700", color: C.primary },
  desc: { marginTop: 6, color: C.muted, marginBottom: 14 },
  skeleton: { height: 90, borderRadius: 12, backgroundColor: "#E5E7EB" },
  errorBox: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 10,
  },
  errorText: { color: "#991B1B" },
  emptyCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyIcon: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: C.text },
  emptyDesc: { marginTop: 6, color: C.muted, textAlign: "center" },
  card: {
    minHeight: 72,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lotCode: { fontSize: 16, fontWeight: "700", color: C.text },
  lotMeta: { marginTop: 3, fontSize: 12, color: C.muted },
  goBadge: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: C.action,
    alignItems: "center",
    justifyContent: "center",
  },
  goText: { color: "#fff", fontWeight: "700" },
});
