/**
 * API Client
 * Axios instance with JWT token management, refresh, and interceptors
 */

import { APP_CONFIG } from "@/constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: "@brigada:access_token",
  REFRESH_TOKEN: "@brigada:refresh_token",
  TOKEN_EXPIRY: "@brigada:token_expiry",
};

// Token state (in-memory)
let accessToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Create axios instance with base configuration
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.api.baseUrl,
  timeout: APP_CONFIG.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Subscribe to token refresh — queued requests wait for the new token.
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Notify all queued requests with the fresh token.
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * Reject all queued requests (refresh failed).
 */
function onTokenRefreshFailed() {
  refreshSubscribers = [];
}

/**
 * Get stored access token
 */
export async function getAccessToken(): Promise<string | null> {
  if (accessToken) return accessToken;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    accessToken = stored;
    return stored;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

/**
 * Get stored refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  if (refreshToken) return refreshToken;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    refreshToken = stored;
    return stored;
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
}

/**
 * Set access token in memory and storage
 */
export async function setAccessToken(token: string | null): Promise<void> {
  accessToken = token;

  try {
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
  } catch (error) {
    console.error("Error setting access token:", error);
  }
}

/**
 * Set refresh token in memory and storage
 */
export async function setRefreshToken(token: string | null): Promise<void> {
  refreshToken = token;

  try {
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  } catch (error) {
    console.error("Error setting refresh token:", error);
  }
}

/**
 * Decode JWT token (without verification - for client-side only)
 */
export function decodeToken(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    // Add 60 second buffer before actual expiration
    const expirationTime = decoded.exp * 1000;
    const now = Date.now();
    return now >= expirationTime - 60000;
  } catch (error) {
    return true;
  }
}

/**
 * Clear all tokens
 */
export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;

  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
    ]);
  } catch (error) {
    console.error("Error clearing tokens:", error);
  }
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access token or null if refresh fails.
 */
async function attemptTokenRefresh(): Promise<string | null> {
  try {
    const currentRefresh = await getRefreshToken();
    if (!currentRefresh) return null;

    // Call backend refresh endpoint directly (bypass interceptors)
    const response = await axios.post(
      `${APP_CONFIG.api.baseUrl}/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${currentRefresh}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    const { access_token, refresh_token: new_refresh } = response.data;
    if (!access_token) return null;

    await setAccessToken(access_token);
    if (new_refresh) {
      await setRefreshToken(new_refresh);
    }

    return access_token;
  } catch (error) {
    console.log("Token refresh failed, clearing session");
    await clearTokens();
    return null;
  }
}

/**
 * Request Interceptor - Add JWT token to requests
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token for login/public endpoints
    if (
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/refresh")
    ) {
      return config;
    }

    let token = await getAccessToken();

    if (token && isTokenExpired(token)) {
      // Token is about to expire — try a proactive refresh
      const newToken = await attemptTokenRefresh();
      token = newToken;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor - Handle errors and token refresh on 401
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized — attempt refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Another refresh is in progress — queue this request
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          });
          // If refresh fails, this promise is never resolved — add timeout
          setTimeout(() => reject(error), 10000);
        });
      }

      isRefreshing = true;

      try {
        const newToken = await attemptTokenRefresh();
        if (newToken) {
          onTokenRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (_) {
        // refresh failed
      } finally {
        isRefreshing = false;
      }

      // Refresh failed — clear and reject
      onTokenRefreshFailed();
      await clearTokens();
      return Promise.reject(error);
    }

    // Handle 403 Forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      console.log("403 Forbidden - Insufficient permissions");

      return Promise.reject({
        ...error,
        message: "No tienes permisos para realizar esta acción",
      });
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        ...error,
        message: "Error de conexión. Verifica tu internet.",
      });
    }

    return Promise.reject(error);
  },
);

/**
 * Helper to make authenticated requests
 */
export const api = {
  get: <T>(url: string, config = {}) => apiClient.get<T>(url, config),
  post: <T>(url: string, data?: any, config = {}) =>
    apiClient.post<T>(url, data, config),
  put: <T>(url: string, data?: any, config = {}) =>
    apiClient.put<T>(url, data, config),
  patch: <T>(url: string, data?: any, config = {}) =>
    apiClient.patch<T>(url, data, config),
  delete: <T>(url: string, config = {}) => apiClient.delete<T>(url, config),
};
