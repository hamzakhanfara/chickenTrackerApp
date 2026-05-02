import { useCallback } from "react";
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

// ─── Types & Constants ────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AppStackParamList, "CoopsList">;

const C = {
  bg: "#f7fbf1",
  primary: "#1B5E20",
  action: "#FF6F00",
  card: "#FFFFFF",
  surface: "#f2f5ec",
  text: "#191d17",
  muted: "#41493e",
  caption: "#717a6d",
  border: "#E0E0E0",
  activeBg: "#f0fdf0",
  activeText: "#1B5E20",
  activeBorder: "#bbf7c6",
  inactiveBg: "#F5F5F5",
  inactiveText: "#757575",
  accentBorder: "#FB6D00",
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export const CoopsListScreen = observer(({ route, navigation }: Props) => {
  const { farmId, farmName } = route.params;
  const { coopStore, lotStore } = rootStore;

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await coopStore.fetchCoopsByFarm(farmId);
        if (coopStore.items.length > 0) {
          await lotStore.fetchLotsForCoops(coopStore.items.map((c) => c.id));
        }
      };

      void loadData();
    }, [farmId, coopStore, lotStore]),
  );

  const isEmpty = !coopStore.isLoading && coopStore.items.length === 0;

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.avatar} onPress={() => navigation.goBack()}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={s.headerTitleBlock}>
          <Text style={s.appName}>PoultryTrack / بولتري تراك</Text>
          {farmName ? <Text style={s.headerSub}>{farmName}</Text> : null}
        </View>
        <View style={s.bellBtn}>
          <Text style={s.bellIcon}>🔔</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section title */}
        <View style={s.sectionHeader}>
          {farmName ? <Text style={s.farmLabel}>{farmName}</Text> : null}
          <Text style={s.sectionTitle}>Poulaillers / العنابر</Text>
          <View style={s.titleUnderline} />
        </View>

        {/* Loading skeleton */}
        {(coopStore.isLoading || lotStore.isLoading) && (
          <View>
            <View style={s.skeleton} />
            <View style={s.skeleton} />
          </View>
        )}

        {/* Error */}
        {(coopStore.error || lotStore.error) &&
          !coopStore.isLoading &&
          !lotStore.isLoading && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>
                {coopStore.error || lotStore.error}
              </Text>
              <TouchableOpacity
                style={s.retryBtn}
                onPress={() => {
                  void (async () => {
                    await coopStore.fetchCoopsByFarm(farmId);
                    await lotStore.fetchLotsForCoops(
                      coopStore.items.map((c) => c.id),
                    );
                  })();
                }}
              >
                <Text style={s.retryBtnText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}

        {/* Empty state */}
        {isEmpty && !coopStore.error && !lotStore.error && (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>🏚️</Text>
            <Text style={s.emptyTitle}>
              Aucun poulailler pour cette ferme / لا توجد عنابر لهذه المزرعة
            </Text>
            <Text style={s.emptyDesc}>
              Commencez par ajouter votre premier poulailler pour suivre la
              production et la santé de votre élevage.
            </Text>
            <TouchableOpacity
              style={s.emptyCtaBtn}
              onPress={() =>
                navigation.navigate("CreateCoop", { farmId, farmName })
              }
              activeOpacity={0.85}
            >
              <Text style={s.emptyCtaText}>
                ＋ Créer un poulailler / إنشاء عنبر
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty — info cards */}
        {isEmpty && !coopStore.error && !lotStore.error && (
          <View style={s.infoRow}>
            <View style={s.infoCard}>
              <View style={s.infoIconBox}>
                <Text>ℹ️</Text>
              </View>
              <View style={s.infoBody}>
                <Text style={s.infoTitle}>Guide de démarrage / دليل البدء</Text>
                <Text style={s.infoCaption}>
                  Apprenez à configurer vos lots et capteurs pour une gestion
                  optimale.
                </Text>
              </View>
            </View>
            <View style={s.infoCard}>
              <View style={s.infoIconBox}>
                <Text>🛟</Text>
              </View>
              <View style={s.infoBody}>
                <Text style={s.infoTitle}>Support Technique / الدعم الفني</Text>
                <Text style={s.infoCaption}>
                  Besoin d'aide ? Notre équipe est disponible pour vous
                  accompagner.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Populated list */}
        {!coopStore.isLoading &&
          !lotStore.isLoading &&
          coopStore.items.length > 0 && (
            <>
              {coopStore.items.map((coop) => {
                const activeLot = lotStore.getActiveLotForCoop(coop.id);
                const activeLotsCount = lotStore.getActiveLotsCountForCoop(
                  coop.id,
                );
                const isActive = !!activeLot;
                return (
                  <TouchableOpacity
                    key={coop.id}
                    style={s.coopCard}
                    onPress={() =>
                      navigation.navigate("CoopLotsList", {
                        farmId,
                        farmName,
                        coopId: coop.id,
                        coopName: coop.name,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    {/* Card header */}
                    <View style={s.coopCardHeader}>
                      <View>
                        <Text style={s.coopName}>{coop.name}</Text>
                        <Text style={s.coopId}>
                          ID: {coop.id.substring(0, 8).toUpperCase()}
                        </Text>
                      </View>
                      <View
                        style={[
                          s.statusBadge,
                          isActive ? s.statusActive : s.statusInactive,
                        ]}
                      >
                        <Text
                          style={[
                            s.statusText,
                            isActive
                              ? s.statusTextActive
                              : s.statusTextInactive,
                          ]}
                        >
                          {isActive ? "Actif / نشط" : "Inactif / غير نشط"}
                        </Text>
                      </View>
                    </View>

                    {/* Metrics grid */}
                    <View style={s.metricsRow}>
                      <View style={s.metricBox}>
                        <Text style={s.metricIcon}>👥</Text>
                        <Text style={s.metricLabel}>Capacity / السعة</Text>
                        <Text style={s.metricValue}>
                          {coop.capacity
                            ? `${coop.capacity.toLocaleString()} birds / طائر`
                            : "—"}
                        </Text>
                      </View>
                      <View style={[s.metricBox, s.metricBoxAccent]}>
                        <Text style={s.metricIcon}>📋</Text>
                        <Text style={s.metricLabel}>Active Lots / دورات</Text>
                        <Text
                          style={s.metricValue}
                        >{`${activeLotsCount} Lot / دورة`}</Text>
                      </View>
                    </View>

                    {/* Footer link */}
                    <View style={s.coopCardFooter}>
                      <Text style={s.footerIcon}>📊</Text>
                      <Text style={s.footerLink}>
                        View lots history / عرض سجل الدورات
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB — create coop */}
      {!isEmpty && (
        <TouchableOpacity
          style={s.fab}
          onPress={() =>
            navigation.navigate("CreateCoop", { farmId, farmName })
          }
          activeOpacity={0.85}
        >
          <Text style={s.fabText}>＋ Créer un poulailler / إنشاء عنبر</Text>
        </TouchableOpacity>
      )}

      {/* Bottom nav */}
      <View style={s.nav}>
        {(
          [
            { icon: "🏠", label: "Home / الرئيسية", active: false },
            { icon: "📋", label: "Lots / المجموعات", active: true },
            { icon: "📈", label: "Stats / إحصائيات", active: false },
            { icon: "👤", label: "Profile / الحساب", active: false },
          ] as const
        ).map((tab) => (
          <TouchableOpacity
            key={tab.label}
            style={s.navTab}
            onPress={
              tab.label.startsWith("Home")
                ? () => navigation.navigate("Home")
                : undefined
            }
          >
            <Text style={s.navIcon}>{tab.icon}</Text>
            <Text style={[s.navLabel, tab.active && s.navLabelActive]}>
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
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { fontSize: 20, color: "#fff", fontWeight: "700" },
  headerTitleBlock: { flex: 1, marginLeft: 10 },
  appName: { fontSize: 15, fontWeight: "800", color: C.primary },
  headerSub: { fontSize: 11, color: C.caption, marginTop: 1 },
  bellBtn: { padding: 6 },
  bellIcon: { fontSize: 22 },

  sectionHeader: { marginTop: 24, marginBottom: 20 },
  farmLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: C.primary,
    letterSpacing: 0.02 * 13,
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 24, fontWeight: "600", color: C.primary },
  titleUnderline: {
    width: 48,
    height: 4,
    backgroundColor: C.action,
    borderRadius: 2,
    marginTop: 6,
  },

  skeleton: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },

  errorBox: { alignItems: "center", paddingVertical: 24 },
  errorText: { color: "#D32F2F", marginBottom: 12 },
  retryBtn: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  retryBtnText: { color: "#fff", fontWeight: "700" },

  // Empty state
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyEmoji: { fontSize: 72, marginBottom: 20 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: C.text,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 26,
  },
  emptyDesc: {
    fontSize: 14,
    color: C.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyCtaBtn: {
    minHeight: 56,
    paddingHorizontal: 28,
    backgroundColor: C.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  emptyCtaText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  // Info cards (empty state footer)
  infoRow: { marginTop: 20, gap: 12 },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c0c9bb50",
    padding: 16,
    gap: 12,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  infoBody: { flex: 1 },
  infoTitle: { fontSize: 13, fontWeight: "600", color: C.text },
  infoCaption: { fontSize: 11, color: C.caption, marginTop: 3, lineHeight: 16 },

  // Coop card
  coopCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  coopCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  coopName: { fontSize: 18, fontWeight: "600", color: C.text },
  coopId: { fontSize: 11, color: C.caption, marginTop: 2 },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusActive: { backgroundColor: C.activeBg, borderColor: C.activeBorder },
  statusInactive: { backgroundColor: C.inactiveBg, borderColor: "#e0e0e0" },
  statusText: { fontSize: 11, fontWeight: "500" },
  statusTextActive: { color: C.activeText },
  statusTextInactive: { color: C.inactiveText },

  metricsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  metricBox: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 10,
  },
  metricBoxAccent: { borderLeftWidth: 4, borderLeftColor: C.action },
  metricIcon: { fontSize: 14, marginBottom: 4 },
  metricLabel: { fontSize: 10, color: C.caption, lineHeight: 14 },
  metricValue: { fontSize: 12, fontWeight: "600", color: C.text, marginTop: 2 },

  coopCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
    gap: 6,
  },
  footerIcon: { fontSize: 12 },
  footerLink: { fontSize: 11, color: C.primary, fontWeight: "500" },

  // FAB
  fab: {
    position: "absolute",
    bottom: 90,
    right: 16,
    backgroundColor: C.action,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: C.action,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Bottom nav
  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    paddingBottom: 16,
  },
  navTab: { flex: 1, alignItems: "center" },
  navIcon: { fontSize: 20 },
  navLabel: {
    fontSize: 10,
    color: C.caption,
    marginTop: 2,
    textAlign: "center",
  },
  navLabelActive: { color: C.primary, fontWeight: "700" },
});
