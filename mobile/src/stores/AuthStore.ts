import { makeObservable, observable, action } from "mobx";
import {
  apiClient,
  BASE_URL,
  registerUnauthorizedHandler,
  setAuthToken,
} from "../services/api";
import { tokenStorage } from "../services/tokenStorage";

export class AuthStore {
  email: string = "";
  accessToken: string | null = null;
  isAuthenticated: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeObservable(this, {
      email: observable,
      accessToken: observable,
      isAuthenticated: observable,
      isLoading: observable,
      error: observable,
      register: action,
      login: action,
      logout: action,
      setToken: action,
      setError: action,
      initializeFromSecureStore: action,
      handleUnauthorized: action,
    });

    registerUnauthorizedHandler(() => {
      this.handleUnauthorized();
    });
  }

  handleUnauthorized() {
    this.accessToken = null;
    this.isAuthenticated = false;
    this.error = "Session expired. Please login again.";
    setAuthToken(null);
  }

  async register(email: string, password: string) {
    this.isLoading = true;
    this.error = null;
    try {
      this.email = email;
      const response = await apiClient.post("/auth/register", {
        email,
        password,
      });
      if (response.data.success) {
        const token =
          response.data?.data?.accessToken ??
          response.data?.data?.access_token ??
          null;

        if (token) {
          await tokenStorage.set(token);
          this.setToken(token);
          this.error = null;
        } else {
          // Register may not return a session token depending on backend auth settings
          this.error = "Registration successful. Please login.";
        }
      } else {
        this.error = response.data.error || "Registration failed";
      }
    } catch (err: any) {
      this.error =
        err.response?.data?.error ||
        `Network error. Check backend URL: ${BASE_URL}`;
    } finally {
      this.isLoading = false;
    }
  }

  async login(email: string, password: string) {
    this.isLoading = true;
    this.error = null;
    try {
      this.email = email;
      console.log("[AuthStore] Attempting login for:", email);
      const response = await apiClient.post("/auth/login", { email, password });
      console.log("[AuthStore] Login response:", response.data);
      if (response.data.success) {
        const token =
          response.data?.data?.accessToken ??
          response.data?.data?.access_token ??
          null;

        console.log(
          "[AuthStore] Token extracted:",
          token ? token.substring(0, 20) + "..." : "null",
        );

        if (!token) {
          this.error = "Login failed: missing access token";
          console.error("[AuthStore] No token in response");
          return;
        }

        try {
          console.log("[AuthStore] Storing token via tokenStorage...");
          const stored = await tokenStorage.set(token);
          console.log("[AuthStore] Token storage result:", stored);
        } catch (storeErr) {
          console.error("[AuthStore] Failed to store token:", storeErr);
          this.error = "Failed to save login token. Try again.";
          return;
        }

        this.setToken(token);
        this.error = null;
        console.log(
          "[AuthStore] Login successful, isAuthenticated:",
          this.isAuthenticated,
        );
      } else {
        this.error = response.data.error || "Login failed";
      }
    } catch (err: any) {
      console.error("[AuthStore] Login error:", err);
      this.error =
        err.response?.data?.error ||
        `Network error. Check backend URL: ${BASE_URL}`;
    } finally {
      this.isLoading = false;
    }
  }

  async logout() {
    await tokenStorage.remove();
    this.handleUnauthorized();
    this.email = "";
    this.error = null;
    console.log("[AuthStore] Logged out");
  }

  setToken(token: string | null) {
    this.accessToken = token;
    setAuthToken(token);

    if (token) {
      this.isAuthenticated = true;
    } else {
      this.isAuthenticated = false;
    }
  }

  setError(error: string | null) {
    this.error = error;
  }

  async initializeFromSecureStore() {
    try {
      console.log("[AuthStore] Reading token from tokenStorage...");
      const token = await tokenStorage.get();
      console.log(
        "[AuthStore] Token read:",
        token ? token.substring(0, 20) + "..." : "null",
      );
      if (token) {
        this.setToken(token);
        console.log(
          "[AuthStore] Token restored, isAuthenticated:",
          this.isAuthenticated,
        );
      } else {
        setAuthToken(null);
        console.log("[AuthStore] No token in storage");
      }
    } catch (err) {
      console.error("[AuthStore] Failed to read token from storage", err);
      setAuthToken(null);
    }
  }
}
