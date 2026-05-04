import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { rootStore } from "../stores/RootStore";
import type { AppStackParamList } from "../navigation/AppNavigator";
import type { CalendarTask, TaskStatus } from "../services/types";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#f7fbf1",
  primary: "#1B5E20",
  action: "#FF6F00",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E5E7EB",
};

type Nav = NativeStackNavigationProp<AppStackParamList, "Calendar">;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  PENDING: "#FF6F00",
  DONE: "#1B5E20",
  CANCELED: "#9E9E9E",
};
const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "En attente",
  DONE: "Terminé",
  CANCELED: "Annulé",
};
const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Faible",
  MEDIUM: "Moyen",
  HIGH: "Haute",
};
const FILTER_OPTIONS: Array<{ id: TaskStatus | "ALL"; label: string }> = [
  { id: "ALL", label: "Tout" },
  { id: "PENDING", label: "En attente" },
  { id: "DONE", label: "Terminé" },
];

// ─── CalendarGrid ──────────────────────────────────────────────────────────────
const CalendarGrid = ({
  year,
  month,
  tasksByDate,
  selectedDay,
  onSelectDay,
}: {
  year: number;
  month: number;
  tasksByDate: Record<string, CalendarTask[]>;
  selectedDay: string;
  onSelectDay: (d: string) => void;
}) => {
  const today = toISO(new Date());
  const totalDays = daysInMonth(year, month);
  const startOffset = firstWeekday(year, month);
  const cells: Array<number | null> = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  const DOW = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];

  return (
    <View style={s.gridCard}>
      <View style={s.dowRow}>
        {DOW.map((d) => (
          <Text key={d} style={s.dowText}>
            {d}
          </Text>
        ))}
      </View>
      <View style={s.cellsWrap}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={s.cell} />;
          const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
          const tasks = tasksByDate[iso] ?? [];
          const isSelected = iso === selectedDay;
          const isToday = iso === today;
          const hasTasks = tasks.length > 0;
          const hasPending = tasks.some((t) => t.status === "PENDING");
          const dotColor = hasPending ? C.action : C.primary;

          return (
            <TouchableOpacity
              key={iso}
              style={[
                s.cell,
                isSelected && s.cellSelected,
                isToday && !isSelected && s.cellToday,
              ]}
              onPress={() => onSelectDay(iso)}
              activeOpacity={0.7}
            >
              <Text style={[s.cellText, isSelected && { color: "#fff" }]}>
                {day}
              </Text>
              {hasTasks && (
                <View style={[s.dot, { backgroundColor: dotColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── TaskItem ──────────────────────────────────────────────────────────────────
const TaskItem = ({
  task,
  onToggle,
}: {
  task: CalendarTask;
  onToggle: (task: CalendarTask) => void;
}) => {
  const color = STATUS_COLORS[task.status];
  const next: TaskStatus = task.status === "PENDING" ? "DONE" : "PENDING";

  return (
    <View style={s.taskCard}>
      <View style={s.taskLeft}>
        <View style={[s.statusDot, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <Text
            style={[s.taskTitle, task.status === "DONE" && s.strikethrough]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          {!!task.description && (
            <Text style={s.taskDesc} numberOfLines={1}>
              {task.description}
            </Text>
          )}
          <View style={s.taskMeta}>
            <View style={[s.statusChip, { backgroundColor: color + "22" }]}>
              <Text style={[s.statusChipText, { color }]}>
                {STATUS_LABELS[task.status]}
              </Text>
            </View>
            {!!task.priority && (
              <Text style={s.priorityText}>
                {PRIORITY_LABELS[task.priority]}
              </Text>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[s.toggleBtn, { borderColor: color }]}
        onPress={() => onToggle(task)}
        activeOpacity={0.8}
      >
        <Text style={[s.toggleBtnText, { color }]}>
          {task.status === "DONE" ? "↩" : "✓"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── CalendarScreen ────────────────────────────────────────────────────────────
type Filter = TaskStatus | "ALL";

export const CalendarScreen = observer(() => {
  const navigation = useNavigation<Nav>();
  const { taskStore, farmStore, lotStore } = rootStore;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(toISO(now));
  const [filter, setFilter] = useState<Filter>("ALL");
  const [activeLots, setActiveLots] = useState<
    Array<{ id: string; code: string }>
  >([]);
  const [selectedLotId, setSelectedLotId] = useState<string | undefined>(
    undefined,
  );

  const farmId = farmStore.items[0]?.id;

  // Load all active lots for the selector
  useEffect(() => {
    const stored = lotStore.items.filter((l) => l.status === "active");
    if (stored.length > 0) {
      setActiveLots(stored.map((l) => ({ id: l.id, code: l.code })));
      return;
    }
    const farms = farmStore.items;
    if (farms.length === 0) return;
    const load = async () => {
      try {
        const { coopsApi } = await import("../services/coops.api");
        const { lotsApi } = await import("../services/lots.api");
        const coopPages = await Promise.all(
          farms.map((f) => coopsApi.list(f.id, { page: 1, limit: 100 })),
        );
        const coopIds = coopPages.flatMap((p) => p.coops.map((c) => c.id));
        const lotPages = await Promise.all(
          coopIds.map((id) => lotsApi.list(id, { page: 1, limit: 100 })),
        );
        const lots = lotPages
          .flatMap((p) => p.lots)
          .filter((l) => l.status === "active");
        setActiveLots(lots.map((l) => ({ id: l.id, code: l.code })));
      } catch {
        // silently ignore
      }
    };
    void load();
  }, [farmStore.items]);

  useEffect(() => {
    const from = `${year}-${pad(month + 1)}-01`;
    const last = daysInMonth(year, month);
    const to = `${year}-${pad(month + 1)}-${pad(last)}`;
    taskStore.fetchCalendarTasks({ from, to, farmId, lotId: selectedLotId });
  }, [year, month, farmId, selectedLotId]);

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  }

  const dayTasks = taskStore.tasksByDate[selectedDay] ?? [];
  const filtered =
    filter === "ALL" ? dayTasks : dayTasks.filter((t) => t.status === filter);

  const monthLabel = new Date(year, month, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  async function handleToggle(task: CalendarTask) {
    const next: TaskStatus = task.status === "PENDING" ? "DONE" : "PENDING";
    await taskStore.setTaskStatus(task.id, next);
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Calendrier des tâches</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() =>
            navigation.navigate("AddTask", {
              farmId: farmId ?? "",
              lotId: selectedLotId,
            })
          }
        >
          <Text style={s.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Lot selector */}
      {activeLots.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.lotSelectorRow}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <TouchableOpacity
            style={[s.lotChip, selectedLotId === undefined && s.lotChipActive]}
            onPress={() => setSelectedLotId(undefined)}
          >
            <Text
              style={[
                s.lotChipText,
                selectedLotId === undefined && s.lotChipTextActive,
              ]}
            >
              Tous les lots
            </Text>
          </TouchableOpacity>
          {activeLots.map((lot) => (
            <TouchableOpacity
              key={lot.id}
              style={[s.lotChip, selectedLotId === lot.id && s.lotChipActive]}
              onPress={() => setSelectedLotId(lot.id)}
            >
              <Text
                style={[
                  s.lotChipText,
                  selectedLotId === lot.id && s.lotChipTextActive,
                ]}
              >
                {lot.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Month nav */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.navArrow}>
            <Text style={s.navArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={s.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={nextMonth} style={s.navArrow}>
            <Text style={s.navArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar grid */}
        <CalendarGrid
          year={year}
          month={month}
          tasksByDate={taskStore.tasksByDate}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterRow}
        >
          {FILTER_OPTIONS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[s.filterChip, filter === f.id && s.filterChipActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text
                style={[
                  s.filterChipText,
                  filter === f.id && s.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected day label */}
        <Text style={s.dayLabel}>
          {new Date(selectedDay + "T00:00:00").toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>

        {/* Task list */}
        {taskStore.isLoading ? (
          <Text style={s.emptyText}>Chargement…</Text>
        ) : filtered.length === 0 ? (
          <Text style={s.emptyText}>Aucune tâche ce jour</Text>
        ) : (
          filtered.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={handleToggle} />
          ))
        )}

        {/* CTA */}
        <TouchableOpacity
          style={s.ctaBtn}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate("AddTask", {
              farmId: farmId ?? "",
              lotId: selectedLotId,
            })
          }
        >
          <Text style={s.ctaPlus}>＋</Text>
          <Text style={s.ctaText}>Ajouter une tâche</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
});

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.primary,
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 8, marginRight: 4 },
  backText: { color: "#fff", fontSize: 22 },
  headerTitle: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "700" },
  addBtn: {
    backgroundColor: C.action,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 20, lineHeight: 22 },
  scroll: { paddingBottom: 24 },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  navArrow: { padding: 8 },
  navArrowText: { fontSize: 26, color: C.primary },
  monthLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: C.primary,
    textTransform: "capitalize",
  },
  gridCard: {
    backgroundColor: C.card,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dowRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  dowText: {
    width: 36,
    textAlign: "center",
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
  },
  cellsWrap: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  cellSelected: { backgroundColor: C.primary },
  cellToday: { borderWidth: 1.5, borderColor: C.primary },
  cellText: { fontSize: 14, color: C.text },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
    backgroundColor: C.card,
  },
  filterChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  filterChipText: { fontSize: 13, color: C.muted },
  filterChipTextActive: { color: "#fff", fontWeight: "700" },
  dayLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: C.primary,
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: "capitalize",
  },
  emptyText: {
    textAlign: "center",
    color: C.muted,
    fontSize: 14,
    marginTop: 24,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  taskLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start" },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 10,
  },
  taskTitle: { fontSize: 15, fontWeight: "600", color: C.text },
  strikethrough: { textDecorationLine: "line-through", color: C.muted },
  taskDesc: { fontSize: 13, color: C.muted, marginTop: 2 },
  taskMeta: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  statusChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  statusChipText: { fontSize: 11, fontWeight: "700" },
  priorityText: { fontSize: 11, color: C.muted },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  toggleBtnText: { fontSize: 16, fontWeight: "700" },
  lotSelectorRow: {
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  lotChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
    backgroundColor: C.bg,
  },
  lotChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  lotChipText: { fontSize: 13, color: C.muted },
  lotChipTextActive: { color: "#fff", fontWeight: "700" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.action,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 14,
    elevation: 2,
  },
  ctaPlus: { color: "#fff", fontSize: 20, marginRight: 8 },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
