import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { rootStore } from "../stores/RootStore";
import type { AppStackParamList } from "../navigation/AppNavigator";
import type { Lot, TaskPriority, TaskTemplate } from "../services/types";
import { coopsApi } from "../services/coops.api";
import { lotsApi } from "../services/lots.api";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#f7fbf1",
  primary: "#1B5E20",
  action: "#FF6F00",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E5E7EB",
  inputBg: "#F9FAFB",
};

type Nav = NativeStackNavigationProp<AppStackParamList, "AddTask">;
type Route = RouteProp<AppStackParamList, "AddTask">;

const PRIORITIES: Array<{ id: TaskPriority; label: string }> = [
  { id: "LOW", label: "Faible" },
  { id: "MEDIUM", label: "Moyen" },
  { id: "HIGH", label: "Haute" },
];

// ─── AddTaskScreen ─────────────────────────────────────────────────────────────
export const AddTaskScreen = observer(() => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { farmId, lotId: routeLotId } = route.params;

  const { taskStore, lotStore } = rootStore;

  const [useTemplate, setUseTemplate] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(
    null,
  );
  const [selectedLotId, setSelectedLotId] = useState(routeLotId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [activeLots, setActiveLots] = useState<Lot[]>(
    lotStore.items.filter((l) => l.status === "active"),
  );
  const [lotsLoading, setLotsLoading] = useState(false);

  useEffect(() => {
    if (taskStore.templates.length === 0) {
      taskStore.fetchTemplates();
    }
  }, []);

  // Load all active lots across all coops if not already in store
  useEffect(() => {
    const stored = lotStore.items.filter((l) => l.status === "active");
    if (stored.length > 0) {
      setActiveLots(stored);
      return;
    }
    const farmStore = rootStore.farmStore;
    const farms = farmStore.items;
    if (farms.length === 0) return;
    const load = async () => {
      setLotsLoading(true);
      try {
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
        setActiveLots(lots);
      } catch {
        // silently ignore — user sees empty lot list
      } finally {
        setLotsLoading(false);
      }
    };
    void load();
  }, []);

  function handleTemplateSelect(tpl: TaskTemplate) {
    setSelectedTemplate(tpl);
    if (!title) setTitle(tpl.name);
    if (!description && tpl.description) setDescription(tpl.description);
  }

  async function handleSubmit() {
    if (!selectedLotId) {
      Alert.alert("Erreur", "Veuillez sélectionner un lot.");
      return;
    }
    if (!useTemplate && !title.trim()) {
      Alert.alert("Erreur", "Le titre est requis.");
      return;
    }
    if (!scheduledDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Erreur", "Date invalide (format AAAA-MM-JJ).");
      return;
    }

    const dto = {
      ...(useTemplate && selectedTemplate
        ? { templateId: selectedTemplate.id }
        : {}),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      scheduledDate,
      priority,
    };

    const result = await taskStore.createTask(selectedLotId, dto);
    if (result) {
      navigation.goBack();
    } else if (taskStore.error) {
      Alert.alert("Erreur", taskStore.error);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nouvelle tâche</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Lot picker */}
        <Text style={s.sectionLabel}>Lot *</Text>
        {lotsLoading ? (
          <Text style={s.mutedText}>Chargement des lots…</Text>
        ) : activeLots.length === 0 ? (
          <Text style={s.mutedText}>Aucun lot actif trouvé</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipRow}
          >
            {activeLots.map((lot) => (
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
                  {lot.code ?? lot.id.substring(0, 6)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Source toggle */}
        <Text style={s.sectionLabel}>Source de la tâche</Text>
        <View style={s.toggleRow}>
          <TouchableOpacity
            style={[s.toggleBtn, useTemplate && s.toggleBtnActive]}
            onPress={() => setUseTemplate(true)}
          >
            <Text
              style={[s.toggleBtnText, useTemplate && s.toggleBtnTextActive]}
            >
              Prédéfinie
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toggleBtn, !useTemplate && s.toggleBtnActive]}
            onPress={() => setUseTemplate(false)}
          >
            <Text
              style={[s.toggleBtnText, !useTemplate && s.toggleBtnTextActive]}
            >
              Personnalisée
            </Text>
          </TouchableOpacity>
        </View>

        {/* Template picker */}
        {useTemplate && (
          <>
            <Text style={s.sectionLabel}>Modèle</Text>
            {taskStore.isLoading ? (
              <Text style={s.mutedText}>Chargement…</Text>
            ) : (
              taskStore.templates.map((tpl) => (
                <TouchableOpacity
                  key={tpl.id}
                  style={[
                    s.templateCard,
                    selectedTemplate?.id === tpl.id && s.templateCardActive,
                  ]}
                  onPress={() => handleTemplateSelect(tpl)}
                  activeOpacity={0.8}
                >
                  <Text style={s.templateName}>{tpl.name}</Text>
                  {!!tpl.description && (
                    <Text style={s.templateDesc}>{tpl.description}</Text>
                  )}
                  {tpl.defaultOffsetDays != null && (
                    <Text style={s.templateMeta}>
                      J+{tpl.defaultOffsetDays}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* Title */}
        <Text style={s.sectionLabel}>Titre {!useTemplate && "*"}</Text>
        <TextInput
          style={s.input}
          placeholder="Ex. Vaccination J7"
          placeholderTextColor={C.muted}
          value={title}
          onChangeText={setTitle}
          returnKeyType="next"
        />

        {/* Description */}
        <Text style={s.sectionLabel}>Description</Text>
        <TextInput
          style={[s.input, { minHeight: 80, textAlignVertical: "top" }]}
          placeholder="Détails de la tâche…"
          placeholderTextColor={C.muted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Date */}
        <Text style={s.sectionLabel}>Date planifiée * (AAAA-MM-JJ)</Text>
        <TextInput
          style={s.input}
          placeholder="2025-06-01"
          placeholderTextColor={C.muted}
          value={scheduledDate}
          onChangeText={setScheduledDate}
          keyboardType="numeric"
          maxLength={10}
        />

        {/* Priority */}
        <Text style={s.sectionLabel}>Priorité</Text>
        <View style={s.priorityRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                s.priorityChip,
                priority === p.id && s.priorityChipActive,
              ]}
              onPress={() => setPriority(p.id)}
            >
              <Text
                style={[
                  s.priorityChipText,
                  priority === p.id && s.priorityChipTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, taskStore.isSubmitting && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={taskStore.isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={s.submitBtnText}>
            {taskStore.isSubmitting
              ? "Enregistrement…"
              : "Enregistrer la tâche"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
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
  scroll: { padding: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: C.muted,
    marginBottom: 6,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
    backgroundColor: C.card,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.muted },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    backgroundColor: C.card,
  },
  toggleBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  toggleBtnText: { fontSize: 14, color: C.muted, fontWeight: "600" },
  toggleBtnTextActive: { color: "#fff" },
  templateCard: {
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  templateCardActive: {
    borderColor: C.primary,
    backgroundColor: "#E8F5E9",
  },
  templateName: { fontSize: 14, fontWeight: "700", color: C.text },
  templateDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  templateMeta: {
    fontSize: 11,
    color: C.primary,
    marginTop: 4,
    fontWeight: "600",
  },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: C.text,
  },
  mutedText: { color: C.muted, fontSize: 13, marginTop: 4 },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    backgroundColor: C.card,
  },
  priorityChipActive: { backgroundColor: C.action, borderColor: C.action },
  priorityChipText: { fontSize: 13, color: C.muted, fontWeight: "600" },
  priorityChipTextActive: { color: "#fff" },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24,
    elevation: 2,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
