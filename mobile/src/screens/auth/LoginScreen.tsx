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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { rootStore } from "../../stores/RootStore";

type Props = NativeStackScreenProps<any, "Login">;

export const LoginScreen = observer(({ navigation }: Props) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return;
    await rootStore.authStore.login(email, password);
    if (!rootStore.authStore.error) {
      navigation.navigate("Home");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth.login")}</Text>

      <TextInput
        style={styles.input}
        placeholder={t("auth.email")}
        placeholderTextColor="#999"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!rootStore.authStore.isLoading}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={t("auth.password")}
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!rootStore.authStore.isLoading}
      />

      {rootStore.authStore.error && (
        <Text style={styles.error}>{rootStore.authStore.error}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          rootStore.authStore.isLoading && styles.buttonDisabled,
        ]}
        onPress={handleLogin}
        disabled={rootStore.authStore.isLoading}
      >
        {rootStore.authStore.isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("auth.loginButton")}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.linkText}>{t("auth.noAccount")}</Text>
      </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
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
  error: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
    fontSize: 14,
  },
  linkText: {
    color: "#007AFF",
    textAlign: "center",
    marginTop: 15,
    fontWeight: "500",
  },
});
