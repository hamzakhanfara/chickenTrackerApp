import { useState } from "react";
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
import { useForm, Controller } from "react-hook-form";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/AppNavigator";
import { rootStore } from "../stores/RootStore";
import { LotBreed } from "../services/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AppStackParamList, "CreateLot">;

interface CreateLotFormValues {
  code: string;
  breed: LotBreed | "";
  startDate: string;
  initialChickCount: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: "#f7fbf1",
  primary: "#1B5E20",
  action: "#FF6F00",
  card: "#FFFFFF",
  surface: "#f2f5ec",
  text: "#191d17",
  muted: "#41493e",
  caption: "#717a6d",
  border: "#717a6d",
  borderLight: "#E0E0E0",
  error: "#ba1a1a",
  disabled: "#9CA3AF",
  infoBg: "#f2f5ec",
  infoBorder: "#9e4200",
};

const BREEDS: { label: string; value: LotBreed }[] = [
  { label: "Cobb 500", value: "COBB_500" },
  { label: "Ross 308", value: "ROSS_308" },
  { label: "Hubbard", value: "HUBBARD" },
  { label: "Autre / Other", value: "OTHER" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export const CreateLotScreen = ({ route, navigation }: Props) => {
  const { coopId, coopName } = route.params;
  const { lotStore } = rootStore;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateLotFormValues>({
    mode: "onTouched",
    defaultValues: {
      code: "",
      breed: "",
      startDate: new Date().toISOString().split("T")[0],
      initialChickCount: "",
      notes: "",
    },
  });

  const selectedBreed = watch("breed");

  const onSubmit = async (values: CreateLotFormValues) => {
    setSubmitError(null);
    if (!values.breed) {
      setSubmitError("Veuillez sélectionner une souche.");
      return;
    }
    const payload = {
      code: values.code.trim(),
      breed: values.breed as LotBreed,
      startDate: values.startDate,
      initialChickCount: parseInt(values.initialChickCount, 10),
    };
    const lot = await lotStore.createLot(coopId, payload);
    if (!lot) {
      setSubmitError(
        lotStore.error ?? "Une erreur est survenue. Veuillez réessayer.",
      );
      return;
    }
    setSuccess(true);
    await lotStore.fetchLotsByCoop(coopId);
    setTimeout(() => navigation.goBack(), 700);
  };

  const canSubmit = isValid && !isSubmitting && !success;

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.avatar} onPress={() => navigation.goBack()}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={s.headerTitleBlock}>
          <Text style={s.appName}>PoultryTrack / بولتري تراك</Text>
          {coopName ? <Text style={s.headerSub}>{coopName}</Text> : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back breadcrumb */}
        <TouchableOpacity
          style={s.breadcrumb}
          onPress={() => navigation.goBack()}
        >
          <Text style={s.breadcrumbText}>
            ← Back to Dashboard / العودة إلى لوحة القيادة
          </Text>
        </TouchableOpacity>

        {/* Page title */}
        <View style={s.pageTitleBlock}>
          <Text style={s.pageTitle}>Nouveau Lot / دورة جديدة</Text>
          <Text style={s.pageSubtitle}>
            Configuration de la nouvelle période de production / إعداد فترة
            الإنتاج الجديدة
          </Text>
        </View>

        {/* Form card */}
        <View style={s.formCard}>
          {/* Lot Code */}
          <View style={s.fieldGroup}>
            <View style={s.labelRow}>
              <Text style={s.label}>Code du Lot / رمز الدفعة</Text>
              <Text style={s.required}>*</Text>
            </View>
            <Controller
              control={control}
              name="code"
              rules={{
                required: "Champ obligatoire",
                minLength: { value: 2, message: "Minimum 2 caractères" },
                maxLength: { value: 50, message: "Maximum 50 caractères" },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[s.input, errors.code && s.inputError]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="e.g. LOT-2024-001"
                  placeholderTextColor={C.caption}
                  autoCapitalize="characters"
                  returnKeyType="next"
                />
              )}
            />
            {errors.code && (
              <Text style={s.errorText}>{errors.code.message}</Text>
            )}
          </View>

          {/* Breed */}
          <View style={s.fieldGroup}>
            <View style={s.labelRow}>
              <Text style={s.label}>Breed (Souche) / السلالة</Text>
              <Text style={s.required}>*</Text>
            </View>
            <View style={s.breedGrid}>
              {BREEDS.map((b) => (
                <TouchableOpacity
                  key={b.value}
                  style={[
                    s.breedChip,
                    selectedBreed === b.value && s.breedChipActive,
                  ]}
                  onPress={() =>
                    setValue("breed", b.value, { shouldValidate: true })
                  }
                >
                  <Text
                    style={[
                      s.breedChipText,
                      selectedBreed === b.value && s.breedChipTextActive,
                    ]}
                  >
                    {b.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Hidden controller for validation */}
            <Controller
              control={control}
              name="breed"
              rules={{ required: "Veuillez sélectionner une souche" }}
              render={() => <View />}
            />
            {errors.breed && (
              <Text style={s.errorText}>{errors.breed.message}</Text>
            )}
          </View>

          {/* Start date + Initial count row */}
          <View style={s.twoColRow}>
            {/* Start date */}
            <View style={[s.fieldGroup, s.colHalf]}>
              <View style={s.labelRow}>
                <Text style={s.label}>Start Date / تاريخ البدء</Text>
                <Text style={s.required}>*</Text>
              </View>
              <Controller
                control={control}
                name="startDate"
                rules={{ required: "Champ obligatoire" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.startDate && s.inputError]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={C.caption}
                    keyboardType="numbers-and-punctuation"
                    returnKeyType="next"
                  />
                )}
              />
              {errors.startDate && (
                <Text style={s.errorText}>{errors.startDate.message}</Text>
              )}
            </View>

            {/* Initial count */}
            <View style={[s.fieldGroup, s.colHalf]}>
              <View style={s.labelRow}>
                <Text style={s.label}>
                  Initial Bird Count / عدد الطيور الأولي
                </Text>
                <Text style={s.required}>*</Text>
              </View>
              <Controller
                control={control}
                name="initialChickCount"
                rules={{
                  required: "Champ obligatoire",
                  validate: (v) =>
                    parseInt(v, 10) > 0 || "Doit être supérieur à 0",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.initialChickCount && s.inputError]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="0"
                    placeholderTextColor={C.caption}
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                )}
              />
              {errors.initialChickCount && (
                <Text style={s.errorText}>
                  {errors.initialChickCount.message}
                </Text>
              )}
            </View>
          </View>

          {/* Notes */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Optional Notes / ملاحظات اختيارية</Text>
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
                  placeholder="Additional details... / تفاصيل إضافية..."
                  placeholderTextColor={C.caption}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            />
            {errors.notes && (
              <Text style={s.errorText}>{errors.notes.message}</Text>
            )}
          </View>

          {/* Info note */}
          <View style={s.infoBanner}>
            <Text style={s.infoIcon}>ℹ️</Text>
            <View style={s.infoBody}>
              <Text style={s.infoTitle}>Note / ملاحظة</Text>
              <Text style={s.infoText}>
                Verify all data before launching. Once production starts, the
                initial count is locked. / تحقق من جميع البيانات قبل البدء.
                بمجرد بدء الإنتاج، يتم قفل العدد الأولي.
              </Text>
            </View>
          </View>

          {/* Submit error */}
          {submitError && (
            <View style={s.errorBox}>
              <Text style={s.errorBoxText}>{submitError}</Text>
            </View>
          )}

          {/* Success */}
          {success && (
            <View style={s.successBox}>
              <Text style={s.successText}>
                Lot créé avec succès / تم إنشاء الدفعة بنجاح ✓
              </Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            <Text style={s.submitBtnText}>
              {isSubmitting
                ? "Lancement en cours..."
                : "🚀  Lancer la production / بدء الإنتاج"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 40 },

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

  breadcrumb: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  breadcrumbText: { fontSize: 13, color: C.muted },

  pageTitleBlock: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: C.primary,
    marginBottom: 6,
  },
  pageSubtitle: { fontSize: 14, color: C.muted, lineHeight: 22 },

  formCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c0c9bb50",
    padding: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  fieldGroup: { marginBottom: 20 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: "500", color: C.muted },
  required: { color: C.primary, fontWeight: "700", fontSize: 14 },

  input: {
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.card,
  },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: "top" },
  inputError: { borderColor: C.error },
  errorText: { color: C.error, fontSize: 11, marginTop: 4 },

  // Breed picker chips
  breedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  breedChip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    minHeight: 48,
    justifyContent: "center",
  },
  breedChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  breedChipText: { fontSize: 13, color: C.muted, fontWeight: "500" },
  breedChipTextActive: { color: "#fff", fontWeight: "700" },

  twoColRow: { flexDirection: "row", gap: 12 },
  colHalf: { flex: 1 },

  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.infoBg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: C.infoBorder,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoBody: { flex: 1 },
  infoTitle: { fontSize: 12, fontWeight: "600", color: "#562100" },
  infoText: { fontSize: 11, color: C.muted, lineHeight: 17, marginTop: 2 },

  errorBox: {
    backgroundColor: "#FDECEA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorBoxText: { color: C.error, fontSize: 13 },

  successBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: { color: C.primary, fontSize: 13, fontWeight: "600" },

  submitBtn: {
    height: 56,
    backgroundColor: C.action,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.action,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: C.disabled, shadowOpacity: 0 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
