import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "authToken";
let inMemoryToken: string | null = null;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = globalThis.atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch (err) {
    console.error("[TokenStorage] Failed to decode JWT payload:", err);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;

  if (typeof exp !== "number") {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowInSeconds;
}

export const tokenStorage = {
  async set(token: string): Promise<boolean> {
    try {
      console.log("[TokenStorage] Attempting to store token via SecureStore");
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      console.log("[TokenStorage] Token stored in SecureStore successfully");
      inMemoryToken = token; // Backup in memory
      return true;
    } catch (err) {
      console.error("[TokenStorage] SecureStore.setItemAsync failed:", err);
      console.log(
        "[TokenStorage] Falling back to in-memory storage (development only)",
      );
      inMemoryToken = token;
      return false;
    }
  },

  async get(): Promise<string | null> {
    // Try SecureStore first
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        if (isTokenExpired(token)) {
          console.warn("[TokenStorage] Stored token is expired, clearing it");
          await this.remove();
          return null;
        }

        console.log("[TokenStorage] Token retrieved from SecureStore");
        inMemoryToken = token;
        return token;
      }
    } catch (err) {
      console.error("[TokenStorage] SecureStore.getItemAsync failed:", err);
    }

    // Fall back to in-memory
    if (inMemoryToken) {
      if (isTokenExpired(inMemoryToken)) {
        console.warn("[TokenStorage] In-memory token is expired, clearing it");
        await this.remove();
        return null;
      }

      console.log("[TokenStorage] Token retrieved from in-memory storage");
      return inMemoryToken;
    }

    console.log("[TokenStorage] No token found in any storage");
    return null;
  },

  async remove(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      console.log("[TokenStorage] Token deleted from SecureStore");
    } catch (err) {
      console.error("[TokenStorage] Failed to delete token:", err);
    }
    inMemoryToken = null;
  },
};
