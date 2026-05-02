import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/AppNavigator";
import { rootStore } from "../stores/RootStore";
import { observer } from "mobx-react-lite";
import { ExpenseEntryMode } from "../services/types";

type Props = NativeStackScreenProps<AppStackParamList, "CreateDailyEntry">;

interface CreateDailyEntryFormValues {
  entryDate: string;
  mortalityCount: string;
  feedKg: string;
  waterLiters: string;
  avgWeightGrams: string;
  notes: string;
}

interface ExpenseFormValues {
  entryMode: ExpenseEntryMode;
  chickPrice: string;
  vaccinationExpense: string;
  coopExpense: string;
  farmerExpense: string;
  gasExpense: string;
  waterExpense: string;
  feedExpense: string;
  additionalExpenses: { label: string; amount: string }[];
}

const C = {
  bg: "#f7fbf1",
  primary: "#1B5E20",
  action: "#FF6F00",
  card: "#FFFFFF",
  text: "#191d17",
  caption: "#717a6d",
  border: "#E0E0E0",
  error: "#ba1a1a",
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const toOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return Number(trimmed);
};

export const CreateDailyEntryScreen = observer(
  ({ route, navigation }: Props) => {
    const { lotId, lotCode } = route.params;
    const { dailyEntryStore, lotStore, lotExpenseStore } = rootStore;
    const [success, setSuccess] = useState(false);
    const [expenseOpen, setExpenseOpen] = useState(false);
    const [expenseSaved, setExpenseSaved] = useState(false);

    useEffect(() => {
      void lotStore.fetchLotById(lotId);
      void lotExpenseStore.fetchLotExpenses(lotId);
    }, [lotId, lotStore, lotExpenseStore]);

    const lot =
      lotStore.selectedItem?.id === lotId ? lotStore.selectedItem : null;
    const isClosed = lot?.status === "closed";

    const {
      control,
      handleSubmit,
      formState: { errors, isValid },
    } = useForm<CreateDailyEntryFormValues>({
      mode: "onTouched",
      defaultValues: {
        entryDate: todayIso(),
        mortalityCount: "",
        feedKg: "",
        waterLiters: "",
        avgWeightGrams: "",
        notes: "",
      },
    });

    const onSubmit = async (values: CreateDailyEntryFormValues) => {
      if (isClosed) {
        dailyEntryStore.setError(
          "Daily entry is not allowed for closed lots / الإدخال اليومي غير مسموح للدورات المغلقة",
        );
        return;
      }
      dailyEntryStore.resetError();
      const created = await dailyEntryStore.createEntry(lotId, {
        entryDate: values.entryDate,
        mortalityCount: parseInt(values.mortalityCount, 10),
        feedKg: parseFloat(values.feedKg),
        waterLiters: toOptionalNumber(values.waterLiters),
        avgWeightGrams: toOptionalNumber(values.avgWeightGrams),
        notes: values.notes.trim() ? values.notes.trim() : undefined,
      });

      if (!created) {
        return;
      }

      setSuccess(true);
      await dailyEntryStore.fetchEntriesByLot(lotId);
      setTimeout(() => navigation.goBack(), 700);
    };

    const canSubmit =
      isValid && !dailyEntryStore.isSubmitting && !success && !isClosed;

    // ─── Expense form ────────────────────────────────────────────────────────
    const existingExpense = lotExpenseStore.expenseByLotId[lotId];

    const expenseForm = useForm<ExpenseFormValues>({
      mode: "onTouched",
      defaultValues: {
        entryMode: "TOTAL",
        chickPrice: "",
        vaccinationExpense: "",
        coopExpense: "",
        farmerExpense: "",
        gasExpense: "",
        waterExpense: "",
        feedExpense: "",
        additionalExpenses: [],
      },
    });

    const {
      fields: addlFields,
      append: addlAppend,
      remove: addlRemove,
    } = useFieldArray({
      control: expenseForm.control,
      name: "additionalExpenses",
    });

    // Preload existing expense values whenever they are fetched
    useEffect(() => {
      if (!existingExpense) return;
      const toStr = (v: unknown) =>
        v === null || v === undefined ? "" : String(v);
      expenseForm.reset({
        entryMode: existingExpense.entryMode,
        chickPrice: toStr(existingExpense.chickPrice),
        vaccinationExpense: toStr(existingExpense.vaccinationExpense),
        coopExpense: toStr(existingExpense.coopExpense),
        farmerExpense: toStr(existingExpense.farmerExpense),
        gasExpense: toStr(existingExpense.gasExpense),
        waterExpense: toStr(existingExpense.waterExpense),
        feedExpense: toStr(existingExpense.feedExpense),
        additionalExpenses: existingExpense.additionalExpenses.map((l) => ({
          label: l.label,
          amount: String(l.amount),
        })),
      });
    }, [existingExpense]);

    const onSaveExpenses = async (values: ExpenseFormValues) => {
      lotExpenseStore.resetError();
      setExpenseSaved(false);
      const toOptNum = (v: string) => {
        const trimmed = v.trim();
        if (!trimmed) return undefined;
        const n = Number(trimmed);
        return isNaN(n) ? undefined : n;
      };
      const saved = await lotExpenseStore.saveLotExpenses(lotId, {
        entryMode: values.entryMode,
        chickPrice: toOptNum(values.chickPrice),
        vaccinationExpense: toOptNum(values.vaccinationExpense),
        coopExpense: toOptNum(values.coopExpense),
        farmerExpense: toOptNum(values.farmerExpense),
        gasExpense: toOptNum(values.gasExpense),
        waterExpense: toOptNum(values.waterExpense),
        feedExpense: toOptNum(values.feedExpense),
        additionalExpenses: values.additionalExpenses
          .filter((l) => l.label.trim())
          .map((l) => ({
            label: l.label.trim(),
            amount: Number(l.amount) || 0,
          })),
      });
      if (saved) setExpenseSaved(true);
    };

    const entryModeValue = expenseForm.watch("entryMode");

    return (
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={s.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={s.headerTitleBlock}>
            <Text style={s.appName}>PoultryTrack / بولتري تراك</Text>
            {lotCode ? <Text style={s.headerSub}>Lot #{lotCode}</Text> : null}
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.pageTitleBlock}>
            <Text style={s.pageTitle}>Entrée quotidienne / إدخال يومي</Text>
            <Text style={s.pageSubtitle}>
              Suivez mortalité, aliment, eau et poids chaque jour. / تتبع النفوق
              والعلف والماء والوزن يوميًا.
            </Text>
          </View>

          <View style={s.formCard}>
            {isClosed && (
              <View style={s.closedBanner}>
                <Text style={s.closedBannerText}>
                  Lot fermé le{" "}
                  {lot?.closure?.closureDate?.slice(0, 10) ??
                    lot?.updatedAt.slice(0, 10)}
                  . Les saisies quotidiennes sont désactivées.
                </Text>
              </View>
            )}

            <View style={s.fieldGroup}>
              <Text style={s.label}>Date (YYYY-MM-DD) / التاريخ</Text>
              <Controller
                control={control}
                name="entryDate"
                rules={{
                  required: "Champ obligatoire",
                  pattern: {
                    value: /^\d{4}-\d{2}-\d{2}$/,
                    message: "Format YYYY-MM-DD",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.entryDate && s.inputError]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="2026-05-02"
                    placeholderTextColor={C.caption}
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                )}
              />
              {errors.entryDate && (
                <Text style={s.errorText}>{errors.entryDate.message}</Text>
              )}
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Mortalité (nb) / النفوق (عدد)</Text>
              <Controller
                control={control}
                name="mortalityCount"
                rules={{
                  required: "Champ obligatoire",
                  validate: (v) => {
                    const n = Number(v);
                    return Number.isInteger(n) && n >= 0
                      ? true
                      : "Entier ≥ 0 requis";
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.mortalityCount && s.inputError]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={C.caption}
                    returnKeyType="next"
                  />
                )}
              />
              {errors.mortalityCount && (
                <Text style={s.errorText}>{errors.mortalityCount.message}</Text>
              )}
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Aliment (kg) / العلف (كغ)</Text>
              <Controller
                control={control}
                name="feedKg"
                rules={{
                  required: "Champ obligatoire",
                  validate: (v) => Number(v) >= 0 || "Doit être ≥ 0",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.feedKg && s.inputError]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={C.caption}
                    returnKeyType="next"
                  />
                )}
              />
              {errors.feedKg && (
                <Text style={s.errorText}>{errors.feedKg.message}</Text>
              )}
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>
                Eau (L) optionnel / الماء (لتر) اختياري
              </Text>
              <Controller
                control={control}
                name="waterLiters"
                rules={{
                  validate: (v) =>
                    !v.trim() || Number(v) >= 0 || "Doit être ≥ 0",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.waterLiters && s.inputError]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={C.caption}
                    returnKeyType="next"
                  />
                )}
              />
              {errors.waterLiters && (
                <Text style={s.errorText}>{errors.waterLiters.message}</Text>
              )}
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>
                Poids moyen (g) optionnel / الوزن المتوسط (غ)
              </Text>
              <Controller
                control={control}
                name="avgWeightGrams"
                rules={{
                  validate: (v) =>
                    !v.trim() || Number(v) > 0 || "Doit être > 0",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.avgWeightGrams && s.inputError]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={C.caption}
                    returnKeyType="next"
                  />
                )}
              />
              {errors.avgWeightGrams && (
                <Text style={s.errorText}>{errors.avgWeightGrams.message}</Text>
              )}
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Notes (optionnel) / ملاحظات (اختياري)</Text>
              <Controller
                control={control}
                name="notes"
                rules={{
                  maxLength: { value: 500, message: "Maximum 500 caractères" },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, s.textArea, errors.notes && s.inputError]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Remarque..."
                    placeholderTextColor={C.caption}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                )}
              />
              {errors.notes && (
                <Text style={s.errorText}>{errors.notes.message}</Text>
              )}
            </View>

            {dailyEntryStore.error && (
              <View style={s.errorBox}>
                <Text style={s.errorBoxText}>{dailyEntryStore.error}</Text>
              </View>
            )}

            {success && (
              <View style={s.successBox}>
                <Text style={s.successText}>✅ Entrée ajoutée avec succès</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              <Text style={s.submitBtnText}>
                {dailyEntryStore.isSubmitting
                  ? "Enregistrement..."
                  : "Ajouter l'entrée / إضافة الإدخال"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Expenses accordion ────────────────────────────────────────── */}
          <TouchableOpacity
            style={s.expenseToggle}
            onPress={() => setExpenseOpen((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={s.expenseToggleText}>
              💰 {expenseOpen ? "▲" : "▼"} Expenses / Dépenses / المصاريف
            </Text>
            {existingExpense && (
              <View style={s.expenseSavedBadge}>
                <Text style={s.expenseSavedBadgeText}>Enregistré</Text>
              </View>
            )}
          </TouchableOpacity>

          {expenseOpen && (
            <View style={s.expenseCard}>
              {/* Entry mode selector */}
              <Text style={s.label}>Mode de saisie / وضع الإدخال</Text>
              <View style={s.modeRow}>
                {(["TOTAL", "PER_CHICK"] as ExpenseEntryMode[]).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      s.modeChip,
                      entryModeValue === mode && s.modeChipActive,
                    ]}
                    onPress={() =>
                      expenseForm.setValue("entryMode", mode, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <Text
                      style={[
                        s.modeChipText,
                        entryModeValue === mode && s.modeChipTextActive,
                      ]}
                    >
                      {mode === "TOTAL" ? "Total" : "Par poussin / للكتكوت"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Fixed expense categories */}
              {(
                [
                  ["chickPrice", "Prix poussin / سعر الكتكوت (DH)"],
                  ["vaccinationExpense", "Vaccins / تطعيمات (DH)"],
                  ["coopExpense", "Poulailler / تكاليف القفص (DH)"],
                  ["farmerExpense", "Main-d'œuvre / أجور العمال (DH)"],
                  ["gasExpense", "Gaz / الغاز (DH)"],
                  ["waterExpense", "Eau / الماء (DH)"],
                  ["feedExpense", "Aliment / العلف (DH)"],
                ] as [keyof ExpenseFormValues, string][]
              ).map(([fieldName, label]) => (
                <View key={fieldName} style={s.fieldGroup}>
                  <Text style={s.label}>{label}</Text>
                  <Controller
                    control={expenseForm.control}
                    name={fieldName}
                    rules={{
                      validate: (v) => {
                        const str = String(v ?? "").trim();
                        if (!str) return true;
                        return Number(str) >= 0 || "Doit être ≥ 0";
                      },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          s.input,
                          expenseForm.formState.errors[fieldName] &&
                            s.inputError,
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={String(value ?? "")}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={C.caption}
                        returnKeyType="next"
                      />
                    )}
                  />
                  {expenseForm.formState.errors[fieldName] && (
                    <Text style={s.errorText}>
                      {expenseForm.formState.errors[fieldName]?.message}
                    </Text>
                  )}
                </View>
              ))}

              {/* Additional expenses repeater */}
              <Text style={[s.label, { marginTop: 8 }]}>
                Dépenses supplémentaires / مصاريف إضافية
              </Text>
              {addlFields.map((field, index) => (
                <View key={field.id} style={s.addlRow}>
                  <Controller
                    control={expenseForm.control}
                    name={`additionalExpenses.${index}.label`}
                    rules={{ required: "Nom requis" }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[s.input, s.addlLabelInput]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Nom / الاسم"
                        placeholderTextColor={C.caption}
                        maxLength={80}
                        returnKeyType="next"
                      />
                    )}
                  />
                  <Controller
                    control={expenseForm.control}
                    name={`additionalExpenses.${index}.amount`}
                    rules={{
                      validate: (v) => Number(v) >= 0 || "≥ 0",
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[s.input, s.addlAmountInput]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={C.caption}
                        returnKeyType="done"
                      />
                    )}
                  />
                  <TouchableOpacity
                    style={s.addlRemoveBtn}
                    onPress={() => addlRemove(index)}
                  >
                    <Text style={s.addlRemoveBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={s.addlAddBtn}
                onPress={() => addlAppend({ label: "", amount: "" })}
              >
                <Text style={s.addlAddBtnText}>
                  + Ajouter une ligne / إضافة سطر
                </Text>
              </TouchableOpacity>

              {lotExpenseStore.error && (
                <View style={s.errorBox}>
                  <Text style={s.errorBoxText}>{lotExpenseStore.error}</Text>
                </View>
              )}

              {expenseSaved && (
                <View style={s.successBox}>
                  <Text style={s.successText}>
                    ✅ Dépenses enregistrées / تم حفظ المصاريف
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  s.submitBtn,
                  lotExpenseStore.isSubmitting && s.submitBtnDisabled,
                ]}
                onPress={expenseForm.handleSubmit(onSaveExpenses)}
                disabled={lotExpenseStore.isSubmitting}
                activeOpacity={0.85}
              >
                <Text style={s.submitBtnText}>
                  {lotExpenseStore.isSubmitting
                    ? "Enregistrement..."
                    : "Enregistrer les dépenses / حفظ المصاريف"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  },
);

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
    borderBottomColor: "#E5E7EB",
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
  headerTitleBlock: { flex: 1, marginLeft: 10 },
  appName: { fontSize: 15, fontWeight: "800", color: C.primary },
  headerSub: { fontSize: 11, color: C.caption, marginTop: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    paddingBottom: 40,
  },
  pageTitleBlock: { marginBottom: 18 },
  pageTitle: { fontSize: 24, fontWeight: "700", color: C.primary },
  pageSubtitle: {
    fontSize: 13,
    color: C.caption,
    marginTop: 6,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  closedBanner: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F3F4F6",
    padding: 10,
    marginBottom: 12,
  },
  closedBannerText: { color: "#374151", fontSize: 12, fontWeight: "600" },
  fieldGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: C.text,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  textArea: { minHeight: 96, paddingTop: 10 },
  inputError: { borderColor: C.error },
  errorText: { marginTop: 4, fontSize: 12, color: C.error },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorBoxText: { color: "#991B1B", fontSize: 13 },
  successBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  successText: { color: "#1B5E20", fontSize: 13, fontWeight: "600" },
  submitBtn: {
    minHeight: 48,
    backgroundColor: C.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 6,
  },
  submitBtnDisabled: { opacity: 0.55 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  // Expense accordion
  expenseToggle: {
    marginTop: 16,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expenseToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.primary,
  },
  expenseSavedBadge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  expenseSavedBadgeText: { fontSize: 11, color: C.primary, fontWeight: "600" },
  expenseCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 0,
  },
  modeRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  modeChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FBF7",
  },
  modeChipActive: {
    borderColor: C.primary,
    backgroundColor: "#E8F5E9",
  },
  modeChipText: { fontSize: 13, color: C.caption, fontWeight: "600" },
  modeChipTextActive: { color: C.primary },
  addlRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  addlLabelInput: { flex: 2, minHeight: 44 },
  addlAmountInput: { flex: 1, minHeight: 44 },
  addlRemoveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  addlRemoveBtnText: { color: C.error, fontWeight: "700", fontSize: 14 },
  addlAddBtn: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "#F0FAF0",
  },
  addlAddBtnText: { color: C.primary, fontSize: 13, fontWeight: "700" },
});
