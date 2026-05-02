import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import * as SecureStore from "expo-secure-store";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { rootStore } from "../../stores/RootStore";

type Props = NativeStackScreenProps<any, "PinSetup">;

export const PinSetupScreen = observer(({ navigation }: Props) => {
  const { t } = useTranslation();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePinChange = (
    value: string,
    index: number,
    isConfirm: boolean,
  ) => {
    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = value;
    if (isConfirm) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    if (value && index < 3) {
      // Auto-focus next input in web/native
      if (typeof document !== "undefined") {
        const inputs = Array.from(
          document.querySelectorAll(
            `[data-pin-${isConfirm ? "confirm" : "pin"}-index]`,
          ) as NodeListOf<HTMLInputElement>,
        );
        inputs[index + 1]?.focus();
      }
    }
  };

  const handleSetupPin = async () => {
    if (pin.every((digit) => digit) && !isConfirming) {
      setIsConfirming(true);
      setError(null);
      return;
    }

    if (isConfirming) {
      const pinString = pin.join("");
      const confirmPinString = confirmPin.join("");

      if (pinString !== confirmPinString) {
        setError(t("auth.pinMismatch"));
        setConfirmPin(["", "", "", ""]);
        return;
      }

      setIsLoading(true);
      try {
        await SecureStore.setItemAsync("pinCode", pinString);
        rootStore.authStore.isAuthenticated = true;
        navigation.navigate("Home");
      } catch (err) {
        setError("Failed to save PIN");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const currentPin = isConfirming ? confirmPin : pin;
  const allFilled = currentPin.every((digit) => digit);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isConfirming ? t("auth.confirmPin") : t("auth.setupPin")}
      </Text>

      <View style={styles.pinContainer}>
        {currentPin.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.pinInput}
            placeholder="•"
            placeholderTextColor="#ccc"
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry
            value={digit}
            onChangeText={(value) =>
              handlePinChange(value, index, isConfirming)
            }
            editable={!isLoading}
          />
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[
          styles.button,
          (!allFilled || isLoading) && styles.buttonDisabled,
        ]}
        onPress={handleSetupPin}
        disabled={!allFilled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isConfirming ? "Confirm" : "Next"}
          </Text>
        )}
      </TouchableOpacity>

      {isConfirming && (
        <TouchableOpacity
          onPress={() => {
            setIsConfirming(false);
            setConfirmPin(["", "", "", ""]);
            setError(null);
          }}
        >
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 30,
    textAlign: "center",
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  pinInput: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  backButton: {
    textAlign: "center",
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 16,
    marginTop: 15,
  },
});
