import { useState } from "react";
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
import { useForm, Controller } from "react-hook-form";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { AppStackParamList } from "../navigation/AppNavigator";
import { rootStore } from "../stores/RootStore";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AppStackParamList, "FarmForm">;

interface FarmFormValues {
  name: string;
  city: string;
  region: string;
  address?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = {
  bg: "#f7fbf1",
  primary: "#1B5E20",
  action: "#FF6F00",
  card: "#FFFFFF",
  border: "#D1D5DB",
  error: "#D32F2F",
  text: "#1F2937",
  muted: "#6B7280",
  disabled: "#9CA3AF",
};

// ─── Component ───────────────────────────────────────────────────────────────

export const FarmFormScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const { farmStore } = rootStore;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FarmFormValues>({
    mode: "onTouched",
    defaultValues: {
      name: "",
      city: "",
      region: "Maroc",
      address: "",
    },
  });

  const onSubmit = async (values: FarmFormValues) => {
    setSubmitError(null);
    try {
      const payload = {
        name: values.name.trim(),
        city: values.city.trim(),
        region: values.region.trim(),
        ...(values.address?.trim() ? { address: values.address.trim() } : {}),
      };
      const farm = await farmStore.createFarm(payload);
      if (!farm) {
        setSubmitError(
          farmStore.error ??
            t("farmForm.errorGeneric", {
              defaultValue: "Une erreur est survenue. Veuillez réessayer.",
            }),
        );
        return;
      }
      setSuccess(true);
      await farmStore.fetchFarms();
      // selectedItem already set by createFarm in the store
      setTimeout(() => {
        navigation.navigate("Home");
      }, 800);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue.";
      const status = (err as { status?: number }).status;
      if (status === 400) {
        setSubmitError(
          t("farmForm.error400", {
            defaultValue: "Données invalides. Vérifiez le formulaire.",
          }),
        );
      } else if (status === 401) {
        setSubmitError(
          t("farmForm.error401", {
            defaultValue: "Session expirée. Veuillez vous reconnecter.",
          }),
        );
      } else if (status === 409) {
        setSubmitError(
          t("farmForm.error409", {
            defaultValue: "Une ferme avec ce nom existe déjà.",
          }),
        );
      } else {
        setSubmitError(message);
      }
    }
  };

  const canSubmit = isValid && !isSubmitting && !success;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.title}>
          {t("farmForm.title", {
            defaultValue: "Créer une ferme / إنشاء مزرعة",
          })}
        </Text>
        <Text style={styles.subtitle}>
          {t("farmForm.subtitle", {
            defaultValue:
              "Renseignez les informations de votre ferme / أدخل معلومات مزرعتك",
          })}
        </Text>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t("farmForm.name", {
              defaultValue: "Nom de la ferme / اسم المزرعة",
            })}
            {" *"}
          </Text>
          <Controller
            control={control}
            name="name"
            rules={{
              required: t("farmForm.required", {
                defaultValue: "Champ obligatoire",
              }),
              minLength: {
                value: 2,
                message: t("farmForm.minLength", {
                  defaultValue: "Minimum 2 caractères",
                }),
              },
              maxLength: {
                value: 100,
                message: t("farmForm.maxLength100", {
                  defaultValue: "Maximum 100 caractères",
                }),
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Ex: Ferme Al Baraka"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="words"
                returnKeyType="next"
              />
            )}
          />
          {errors.name && (
            <Text style={styles.errorText}>{errors.name.message}</Text>
          )}
        </View>

        {/* City */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t("farmForm.city", { defaultValue: "Ville / المدينة" })}
            {" *"}
          </Text>
          <Controller
            control={control}
            name="city"
            rules={{
              required: t("farmForm.required", {
                defaultValue: "Champ obligatoire",
              }),
              minLength: {
                value: 2,
                message: t("farmForm.minLength", {
                  defaultValue: "Minimum 2 caractères",
                }),
              },
              maxLength: {
                value: 80,
                message: t("farmForm.maxLength80", {
                  defaultValue: "Maximum 80 caractères",
                }),
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Ex: Casablanca"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="words"
                returnKeyType="next"
              />
            )}
          />
          {errors.city && (
            <Text style={styles.errorText}>{errors.city.message}</Text>
          )}
        </View>

        {/* Region / Pays */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t("farmForm.region", { defaultValue: "Pays / Région / البلد" })}
            {" *"}
          </Text>
          <Controller
            control={control}
            name="region"
            rules={{
              required: t("farmForm.required", {
                defaultValue: "Champ obligatoire",
              }),
              minLength: {
                value: 2,
                message: t("farmForm.minLength", {
                  defaultValue: "Minimum 2 caractères",
                }),
              },
              maxLength: {
                value: 80,
                message: t("farmForm.maxLength80", {
                  defaultValue: "Maximum 80 caractères",
                }),
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.region && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Maroc"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="words"
                returnKeyType="next"
              />
            )}
          />
          {errors.region && (
            <Text style={styles.errorText}>{errors.region.message}</Text>
          )}
        </View>

        {/* Address (optional) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t("farmForm.address", {
              defaultValue: "Adresse (optionnel) / العنوان (اختياري)",
            })}
          </Text>
          <Controller
            control={control}
            name="address"
            rules={{
              maxLength: {
                value: 200,
                message: t("farmForm.maxLength200", {
                  defaultValue: "Maximum 200 caractères",
                }),
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Ex: Route de Bouskoura, km 5"
                placeholderTextColor={COLORS.muted}
                returnKeyType="next"
              />
            )}
          />
          {errors.address && (
            <Text style={styles.errorText}>{errors.address.message}</Text>
          )}
        </View>

        {/* Submit error */}
        {submitError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{submitError}</Text>
          </View>
        )}

        {/* Success */}
        {success && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              {t("farmForm.success", {
                defaultValue:
                  "Ferme créée avec succès / تم إنشاء المزرعة بنجاح",
              })}
            </Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={!canSubmit}
          accessibilityRole="button"
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting
              ? t("farmForm.submitting", { defaultValue: "Création en cours…" })
              : t("farmForm.submit", {
                  defaultValue: "Créer la ferme / إنشاء المزرعة",
                })}
          </Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelBtnText}>
            {t("farmForm.cancel", { defaultValue: "Annuler / إلغاء" })}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: COLORS.bg,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 6,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 48,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: "#FDECEA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorBoxText: {
    color: COLORS.error,
    fontSize: 14,
  },
  successBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.disabled,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 48,
    marginTop: 8,
  },
  cancelBtnText: {
    color: COLORS.muted,
    fontSize: 15,
  },
});
