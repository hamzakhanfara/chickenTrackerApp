import Constants from "expo-constants";
import axios from "axios";
import { Platform } from "react-native";
import { tokenStorage } from "./tokenStorage";

const extraApiUrl = Constants.expoConfig?.extra?.API_URL as string | undefined;
const hostUri = Constants.expoConfig?.hostUri;
const hostIp = hostUri?.split(":")[0];

const androidEmulatorUrl = "http://10.0.2.2:3000";
const fallbackApiUrl =
  Platform.OS === "android"
    ? androidEmulatorUrl
    : hostIp
      ? `http://${hostIp}:3000`
      : "http://localhost:3000";

const normalizeApiUrl = (value: string): string => {
  const trimmed = value.trim();
  const fixedProtocol = trimmed.replace(/^http\/(?!\/)/i, "http://");
  const fixedHttpsProtocol = fixedProtocol.replace(
    /^https\/(?!\/)/i,
    "https://",
  );

  if (
    Platform.OS === "android" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(fixedHttpsProtocol)
  ) {
    return fixedHttpsProtocol.replace(/^(https?:\/\/)localhost/i, "$110.0.2.2");
  }

  return fixedHttpsProtocol;
};

const rawBaseUrl =
  process.env.EXPO_PUBLIC_API_URL ?? extraApiUrl ?? fallbackApiUrl;

export const BASE_URL = normalizeApiUrl(rawBaseUrl);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

let currentAuthToken: string | null = null;
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export function registerUnauthorizedHandler(
  handler: (() => void | Promise<void>) | null,
) {
  unauthorizedHandler = handler;
}

export function setAuthToken(token: string | null) {
  currentAuthToken = token;

  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    console.log("[API] Default Authorization header updated");
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
  console.log("[API] Default Authorization header cleared");
}

const getTokenSafely = async (): Promise<string | null> => {
  try {
    if (currentAuthToken) {
      return currentAuthToken;
    }

    const token = await tokenStorage.get();
    if (token) {
      currentAuthToken = token;
      console.log(
        "[API Interceptor] Token found:",
        token.substring(0, 20) + "...",
      );
    } else {
      console.log("[API Interceptor] No token in storage");
    }
    return token;
  } catch (err) {
    console.error("[API Interceptor] Failed to read token:", err);
    return null;
  }
};

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getTokenSafely();
    config.headers = config.headers ?? {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[API Interceptor] Authorization header set");
    } else {
      console.log(
        "[API Interceptor] No token to attach - request will likely be unauthorized",
      );
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.error(
        "[API] 401 Unauthorized",
        error.response?.data?.error || error.message,
      );

      await tokenStorage.remove();
      setAuthToken(null);

      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  },
);
