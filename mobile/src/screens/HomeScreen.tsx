import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { rootStore } from "../stores/RootStore";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { coopsApi } from "../services/coops.api";
import { lotsApi } from "../services/lots.api";
import { ApiServiceError, Lot } from "../services/types";

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  bg: "#f7fbf1",
  primary: "#1B5E20",
  action: "#FF6F00",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E5E7EB",
  liveBadge: "#E8F5E9",
  liveText: "#2E7D32",
  dangerBg: "#FDECEA",
  danger: "#D32F2F",
};

type HomeNavProp = NativeStackNavigationProp<AppStackParamList, "Home">;

// ─── Sub-components ───────────────────────────────────────────────────────────

const AppHeader = ({
  displayName,
  onLogout,
}: {
  displayName: string;
  onLogout: () => void;
}) => (
  <View style={s.header}>
    <TouchableOpacity style={s.avatar} onLongPress={onLogout}>
      <Text style={s.avatarEmoji}>🧑‍🌾</Text>
    </TouchableOpacity>
    <View style={s.headerTitleBlock}>
      <Text style={s.appName}>PoultryTrack / بولتري تراك</Text>
      <Text style={s.headerSub}>{displayName}</Text>
    </View>
    <TouchableOpacity style={s.bellBtn}>
      <Text style={s.bellIcon}>🔔</Text>
    </TouchableOpacity>
  </View>
);

const KpiRow = ({
  activeLots,
  liveBirds,
}: {
  activeLots: number;
  liveBirds: number;
}) => (
  <View style={s.kpiRow}>
    <View style={[s.kpiCard, { marginRight: 8 }]}>
      <View style={s.kpiCardTop}>
        <View style={s.kpiIconBox}>
          <Text>📋</Text>
        </View>
        <View style={s.liveBadge}>
          <Text style={s.liveText}>LIVE / مباشر</Text>
        </View>
      </View>
      <Text style={s.kpiLabel}>{"Active Lots / دفعات\nنشطة"}</Text>
      <Text style={s.kpiValue}>{String(activeLots).padStart(2, "0")}</Text>
    </View>
    <View style={[s.kpiCard, { marginLeft: 8 }]}>
      <View style={s.kpiCardTop}>
        <Text style={s.nestBrand}>NEST_</Text>
        <Text style={{ fontSize: 18 }}>🌿</Text>
      </View>
      <Text style={s.kpiLabel}>{"Live Birds / طيور\nحية"}</Text>
      <Text style={s.kpiValue}>
        {liveBirds > 0 ? liveBirds.toLocaleString() : "--"}
      </Text>
    </View>
  </View>
);

const MortalityCard = ({ count }: { count: number }) => (
  <View style={s.mortalityCard}>
    <View style={s.mortalityLeft}>
      <View style={s.mortalityIconBox}>
        <Text style={{ fontSize: 20 }}>📉</Text>
      </View>
      <View style={{ marginLeft: 12 }}>
        <Text style={s.mortalityTitle}>
          {"Mortality Today / معدل\nالوفيات"}
        </Text>
        <Text style={s.mortalityValue}>
          {"0.00%"} <Text style={s.mortalitySub}>{`(-${count} birds)`}</Text>
        </Text>
      </View>
    </View>
    <Text style={{ fontSize: 28 }}>📊</Text>
  </View>
);

const IcCard = ({
  ic,
  lotCode,
}: {
  ic: number | null;
  lotCode: string | null;
}) => {
  const target = 1.45;
  const progress = ic ? Math.min(ic / 2.0, 1) : 0;
  return (
    <View style={s.icCard}>
      <View style={s.icCardHeader}>
        <View>
          <Text style={s.icTitle}>Consumption Index / معامل التحويل</Text>
          <Text style={s.icSub}>
            {lotCode ? `Lot #${lotCode} Performance` : "Farm Performance"}
          </Text>
        </View>
        <View style={s.icIconBox}>
          <Text>📊</Text>
        </View>
      </View>
      <View style={s.icValueRow}>
        <Text style={s.icValue}>{ic?.toFixed(2) ?? "--"}</Text>
        <View style={s.icTargetBadge}>
          <Text style={s.icTargetText}>Target: {target}</Text>
        </View>
      </View>
      <View style={s.progressBg}>
        <View
          style={[
            s.progressFill,
            { width: `${progress * 100}%` as `${number}%` },
          ]}
        />
      </View>
      <View style={s.icLabels}>
        <Text style={s.icLabelLeft}>EXCELLENT / ممتاز</Text>
        <Text style={s.icLabelRight}>AVERAGE / متوسط</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const HomeScreen = observer(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeNavProp>();
  const { authStore, farmStore } = rootStore;
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [lotsError, setLotsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "home" | "lots" | "calendar" | "reports"
  >("home");

  const activeLots = useMemo(
    () => lots.filter((l) => l.status === "active"),
    [lots],
  );
  const liveBirds = useMemo(
    () => activeLots.reduce((acc, l) => acc + (l.initialCount ?? 0), 0),
    [activeLots],
  );
  const topLotCode = activeLots[0]?.code ?? null;
  const displayName = (authStore.email || "Farmer").split("@")[0];

  const alertItems = useMemo(
    () => [
      {
        id: "a1",
        icon: "🌡️",
        title: "Temp Alert / تنبيه حرارة",
        desc: "House 03: Temperature exceeds 32°C. Chec...",
        time: "10:45 AM",
        color: "#D32F2F",
      },
      {
        id: "a2",
        icon: "💧",
        title: "Consumption / استهلاك المياه",
        desc: "Water intake stable across all active lots...",
        time: "08:00 AM",
        color: "#FF6F00",
      },
    ],
    [],
  );

  useEffect(() => {
    if (!authStore.accessToken) return;
    void farmStore.fetchFarms();
  }, [farmStore, authStore.accessToken]);

  useEffect(() => {
    if (!selectedFarmId && farmStore.items.length > 0)
      setSelectedFarmId(farmStore.items[0].id);
  }, [farmStore.items, selectedFarmId]);

  useEffect(() => {
    if (!selectedFarmId) return;
    const load = async () => {
      setLotsLoading(true);
      setLotsError(null);
      try {
        const coopResult = await coopsApi.list(selectedFarmId, {
          page: 1,
          limit: 100,
        });
        const pages = await Promise.all(
          coopResult.coops.map((c) =>
            lotsApi.list(c.id, { page: 1, limit: 100 }),
          ),
        );
        setLots(pages.flatMap((p) => p.lots));
      } catch (err) {
        setLotsError(
          err instanceof ApiServiceError ? err.message : "Erreur réseau",
        );
      } finally {
        setLotsLoading(false);
      }
    };
    void load();
  }, [selectedFarmId]);

  const showPlaceholder = () =>
    Alert.alert(
      "Bientôt disponible",
      "Cet écran sera ajouté dans une prochaine étape.",
    );
  const handleLogout = () => {
    void authStore.logout();
  };
  const onRetry = () => {
    void farmStore.fetchFarms();
  };
  const onAddDailyEntry = () => {
    if (!selectedFarmId) {
      Alert.alert(
        "Ferme non sélectionnée",
        "Veuillez sélectionner une ferme avant d'ajouter une entrée quotidienne.",
      );
      return;
    }
    const farm = farmStore.items.find((f) => f.id === selectedFarmId);
    navigation.navigate("SelectLotForDailyEntry", {
      farmId: selectedFarmId,
      farmName: farm?.name,
    });
  };

  // ── Loading ──
  if (farmStore.isLoading || lotsLoading) {
    return (
      <View style={s.center}>
        <View style={[s.skeleton, { marginBottom: 12 }]} />
        <View style={[s.skeleton, { height: 120, marginBottom: 12 }]} />
        <View style={s.skeleton} />
      </View>
    );
  }

  // ── Error ──
  if (farmStore.error || lotsError) {
    const msg = farmStore.error || lotsError;
    return (
      <View style={s.center}>
        <Text style={s.errorText}>{msg}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={onRetry}>
          <Text style={s.retryBtnText}>
            {t("home.retry", { defaultValue: "Réessayer" })}
          </Text>
        </TouchableOpacity>
        {!authStore.accessToken && (
          <TouchableOpacity
            style={[s.retryBtn, { backgroundColor: C.action, marginTop: 10 }]}
            onPress={handleLogout}
          >
            <Text style={s.retryBtnText}>Login Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── Empty state ──
  if (farmStore.items.length === 0) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 52, marginBottom: 12 }}>🐔</Text>
        <Text style={s.emptyTitle}>
          {t("home.welcome", { defaultValue: "Bienvenue sur PoultryTrack" })}
        </Text>
        <Text style={s.emptyDesc}>
          {t("home.noFarmDescription", {
            defaultValue: "Commencez par créer votre première ferme",
          })}
        </Text>
        <TouchableOpacity
          style={s.startBtn}
          onPress={() => navigation.navigate("FarmForm")}
        >
          <Text style={s.startBtnText}>
            {t("home.getStarted", { defaultValue: "Commencer / ابدأ الآن" })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Dashboard ──
  return (
    <View style={s.root}>
      <AppHeader displayName={displayName} onLogout={handleLogout} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={s.greeting}>
          <Text style={s.greetLine}>Welcome back / أهلاً بك</Text>
          <Text style={s.greetSub}>Farm Overview / نظرة عامة</Text>
        </View>

        {/* Farm chips (multi-farm) */}
        {farmStore.items.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipScroll}
          >
            {farmStore.items.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[s.chip, selectedFarmId === f.id && s.chipActive]}
                onPress={() => setSelectedFarmId(f.id)}
              >
                <Text
                  style={[
                    s.chipText,
                    selectedFarmId === f.id && s.chipTextActive,
                  ]}
                >
                  {f.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Add daily entry CTA */}
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={onAddDailyEntry}
          activeOpacity={0.85}
        >
          <Text style={s.ctaPlus}>＋</Text>
          <Text style={s.ctaText}>Add daily entry / إضافة إدخال يومي</Text>
        </TouchableOpacity>

        {/* KPI cards */}
        <KpiRow activeLots={activeLots.length} liveBirds={liveBirds} />

        {/* Mortality */}
        <MortalityCard count={0} />

        {/* Consumption Index */}
        <IcCard ic={null} lotCode={topLotCode} />

        {/* Alerts & Status */}
        <View style={s.alertsHeader}>
          <Text style={s.alertsTitle}>Alerts & Status / تنبيهات</Text>
          <TouchableOpacity onPress={showPlaceholder}>
            <Text style={s.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        {alertItems.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={s.alertCard}
            onPress={showPlaceholder}
            activeOpacity={0.8}
          >
            <View style={[s.alertIconBox, { backgroundColor: a.color + "18" }]}>
              <Text style={{ fontSize: 20 }}>{a.icon}</Text>
            </View>
            <View style={s.alertBody}>
              <Text style={s.alertTitle} numberOfLines={1}>
                {a.title}
              </Text>
              <Text style={s.alertDesc} numberOfLines={1}>
                {a.desc}
              </Text>
            </View>
            <Text style={s.alertTime}>{a.time}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.nav}>
        {(
          [
            { id: "home", label: "Home / الرئيسية", icon: "🏠" },
            { id: "lots", label: "Lots / دفعات", icon: "📋" },
            { id: "calendar", label: "Calendar / التقويم", icon: "📅" },
            { id: "reports", label: "Reports / التقارير", icon: "📊" },
          ] as const
        ).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={s.navTab}
            onPress={() => {
              if (tab.id === "home") {
                setActiveTab("home");
              } else if (tab.id === "lots" && selectedFarmId) {
                const farm = farmStore.items.find(
                  (f) => f.id === selectedFarmId,
                );
                navigation.navigate("CoopsList", {
                  farmId: selectedFarmId,
                  farmName: farm?.name,
                });
              } else {
                showPlaceholder();
              }
            }}
          >
            <Text style={s.navIcon}>{tab.icon}</Text>
            <Text
              style={[s.navLabel, activeTab === tab.id && s.navLabelActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

  // Header
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 22 },
  headerTitleBlock: { flex: 1, marginLeft: 10 },
  appName: { fontSize: 15, fontWeight: "800", color: C.primary },
  headerSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  bellBtn: { padding: 6 },
  bellIcon: { fontSize: 22 },

  // Greeting
  greeting: { marginTop: 20, marginBottom: 2 },
  greetLine: { fontSize: 17, fontWeight: "700", color: C.text },
  greetSub: { fontSize: 13, color: C.muted, marginTop: 2 },

  // Farm chips
  chipScroll: { marginTop: 12, marginBottom: 4 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: C.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: C.text, fontSize: 13 },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  // CTA
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.action,
    borderRadius: 14,
    minHeight: 54,
    marginTop: 18,
    shadowColor: C.action,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaPlus: { fontSize: 22, color: "#fff", marginRight: 6, fontWeight: "300" },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // KPI
  kpiRow: { flexDirection: "row", marginTop: 16 },
  kpiCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kpiCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#EEF4E8",
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadge: {
    backgroundColor: C.liveBadge,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  liveText: { fontSize: 10, fontWeight: "700", color: C.liveText },
  nestBrand: {
    fontSize: 14,
    fontWeight: "900",
    color: C.primary,
    letterSpacing: -0.5,
  },
  kpiLabel: { fontSize: 12, color: C.muted, lineHeight: 17 },
  kpiValue: { fontSize: 26, fontWeight: "800", color: C.text, marginTop: 4 },

  // Mortality
  mortalityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mortalityLeft: { flexDirection: "row", alignItems: "center" },
  mortalityIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: C.dangerBg,
    alignItems: "center",
    justifyContent: "center",
  },
  mortalityTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    lineHeight: 18,
  },
  mortalityValue: {
    fontSize: 17,
    fontWeight: "800",
    color: C.danger,
    marginTop: 2,
  },
  mortalitySub: { fontSize: 12, fontWeight: "400", color: C.muted },

  // IC Card
  icCard: {
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
  },
  icCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  icTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
  icSub: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  icIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  icValueRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  icValue: { fontSize: 42, fontWeight: "900", color: "#fff", marginRight: 12 },
  icTargetBadge: {
    backgroundColor: C.action,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  icTargetText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  progressBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: C.action, borderRadius: 3 },
  icLabels: { flexDirection: "row", justifyContent: "space-between" },
  icLabelLeft: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  icLabelRight: { fontSize: 11, color: "rgba(255,255,255,0.5)" },

  // Alerts
  alertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  alertsTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  viewAll: {
    fontSize: 14,
    color: C.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  alertIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: "700", color: C.text },
  alertDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  alertTime: { fontSize: 11, color: C.muted, marginLeft: 6 },

  // Bottom nav
  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    paddingBottom: 16,
  },
  navTab: { flex: 1, alignItems: "center" },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, color: C.muted, marginTop: 2, textAlign: "center" },
  navLabelActive: { color: C.primary, fontWeight: "700" },

  // States
  center: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  skeleton: {
    width: "100%",
    height: 76,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  errorText: {
    color: C.danger,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
    alignItems: "center",
  },
  retryBtnText: { color: "#fff", fontWeight: "700" },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyDesc: { color: C.muted, textAlign: "center", marginBottom: 24 },
  startBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minHeight: 52,
    alignItems: "center",
  },
  startBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
