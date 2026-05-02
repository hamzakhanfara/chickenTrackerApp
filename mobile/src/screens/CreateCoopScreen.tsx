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
import { BuildingType } from "../services/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AppStackParamList, "CreateCoop">;

interface CreateCoopFormValues {
  name: string;
  capacity: string; // string from TextInput, converted to number on submit
  areaM2: string; // string from TextInput, converted to number on submit
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
  infoBorder: "#1b5e20",
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export const CreateCoopScreen = ({ route, navigation }: Props) => {
  const { farmId, farmName } = route.params;
  const { coopStore } = rootStore;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateCoopFormValues>({
    mode: "onTouched",
    defaultValues: { name: "", capacity: "", areaM2: "", notes: "" },
  });

  const onSubmit = async (values: CreateCoopFormValues) => {
    setSubmitError(null);
    const capacityNum = parseInt(values.capacity, 10);
    const areaM2Num = parseFloat(values.areaM2);
    const payload = {
      name: values.name.trim(),
      capacity: capacityNum,
      areaM2: areaM2Num,
      buildingType: "open" as BuildingType,
    };
    const coop = await coopStore.createCoop(farmId, payload);
    if (!coop) {
      setSubmitError(
        coopStore.error ?? "Une erreur est survenue. Veuillez réessayer.",
      );
      return;
    }
    setSuccess(true);
    await coopStore.fetchCoopsByFarm(farmId);
    setTimeout(() => {
      navigation.navigate("CoopsList", { farmId, farmName });
    }, 700);
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
          {farmName ? <Text style={s.headerSub}>{farmName}</Text> : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <View style={s.pageTitleBlock}>
          <Text style={s.pageTitle}>Nouveau Poulailler / عنبر جديد</Text>
          <Text style={s.pageSubtitle}>
            Veuillez remplir les informations pour enregistrer un nouveau
            bâtiment. / يرجى ملء المعلومات لتسجيل مبنى جديد.
          </Text>
        </View>

        {/* Form card */}
        <View style={s.formCard}>
          {/* Name */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>
              Nom ou Code du Poulailler / اسم أو رمز العنبر
            </Text>
            <Controller
              control={control}
              name="name"
              rules={{
                required: "Champ obligatoire",
                minLength: { value: 1, message: "Minimum 1 caractère" },
                maxLength: { value: 100, message: "Maximum 100 caractères" },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[s.input, errors.name && s.inputError]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="ex: B1"
                  placeholderTextColor={C.caption}
                  autoCapitalize="characters"
                  returnKeyType="next"
                />
              )}
            />
            {errors.name && (
              <Text style={s.errorText}>{errors.name.message}</Text>
            )}
          </View>

          {/* Capacity */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>
              Capacité (Nombre de sujets) / السعة (عدد الطيور)
            </Text>
            <View style={s.inputRow}>
              <Controller
                control={control}
                name="capacity"
                rules={{
                  required: "Champ obligatoire",
                  validate: (v) =>
                    parseInt(v, 10) > 0 || "Doit être supérieur à 0",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      s.input,
                      s.inputFlex,
                      errors.capacity && s.inputError,
                    ]}
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
              <View style={s.inputSuffix}>
                <Text style={s.suffixText}>#</Text>
              </View>
            </View>
            {errors.capacity && (
              <Text style={s.errorText}>{errors.capacity.message}</Text>
            )}
          </View>

          {/* Area */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Superficie (m²) / المساحة (م²)</Text>
            <View style={s.inputRow}>
              <Controller
                control={control}
                name="areaM2"
                rules={{
                  required: "Champ obligatoire",
                  validate: (v) =>
                    parseFloat(v) > 0 || "Doit être supérieur à 0",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      s.input,
                      s.inputFlex,
                      errors.areaM2 && s.inputError,
                    ]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="0"
                    placeholderTextColor={C.caption}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                  />
                )}
              />
              <View style={s.inputSuffix}>
                <Text style={s.suffixText}>m²</Text>
              </View>
            </View>
            {errors.areaM2 && (
              <Text style={s.errorText}>{errors.areaM2.message}</Text>
            )}
          </View>

          {/* Notes */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Notes Optionnelles / ملاحظات اختيارية</Text>
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
                  placeholder="Détails supplémentaires... / تفاصيل إضافية..."
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

          {/* Info banner */}
          <View style={s.infoBanner}>
            <Text style={s.infoIcon}>ℹ️</Text>
            <Text style={s.infoText}>
              Ces informations serviront à calculer les ratios de performance et
              de mortalité automatiquement. / سيتم استخدام هذه المعلومات لحساب
              نسب الأداء والنفوق تلقائيًا.
            </Text>
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
                Poulailler créé avec succès / تم إنشاء العنبر بنجاح ✓
              </Text>
            </View>
          )}

          {/* Actions */}
          <TouchableOpacity
            style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            <Text style={s.submitBtnText}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer / حفظ  ✓"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.cancelBtn}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Text style={s.cancelBtnText}>Annuler / إلغاء</Text>
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

  pageTitleBlock: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: C.primary,
    marginBottom: 8,
  },
  pageSubtitle: { fontSize: 14, color: C.muted, lineHeight: 22 },

  formCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "500", color: C.text, marginBottom: 8 },
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
  inputFlex: { flex: 1 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  inputSuffix: {
    width: 40,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 0,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    backgroundColor: C.surface,
  },
  suffixText: { color: C.caption, fontSize: 16 },
  textArea: {
    height: 96,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  inputError: { borderColor: C.error },
  errorText: { color: C.error, fontSize: 11, marginTop: 4 },

  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.infoBg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoText: { flex: 1, fontSize: 11, color: C.muted, lineHeight: 17 },

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
    backgroundColor: C.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  submitBtnDisabled: { backgroundColor: C.disabled, shadowOpacity: 0 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  cancelBtn: {
    height: 56,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { color: C.muted, fontSize: 15 },
});
