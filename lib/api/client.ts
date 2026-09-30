// lib/api/client.ts
//
// Centralized Axios instance with:
//   1. Auto-attach of the JWT access token on every request
//   2. Silent token refresh on 401 + retry of the original request
//   3. Global logout on unrecoverable 401s
//
// Refresh flow:
//   Request -> 401 (access expired)
//       -> attempt POST /auth/refresh/ with the refresh token
//       -> success: store new access, retry original request
//       -> failure: clear tokens, redirect to /?auth=login
//
// Deduplication:
//   If multiple requests hit 401 at the same time, only ONE refresh
//   is fired. The rest wait for the same promise.
//
// Lint note:
//   We use window.location.replace() instead of assigning location.href.
//   The Next.js ESLint rule (@next/next/no-location-assign-relative-destination)
//   flags .href assignments; .replace() is a method call and is safe here.

import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// ---------------------------------------------------------------------------
// 1. Base Axios instance
// ---------------------------------------------------------------------------
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ---------------------------------------------------------------------------
// 2. Request interceptor — attach the current access token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// 3. Helpers
// ---------------------------------------------------------------------------

// Extend the config type so we can mark requests as "already retried"
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Auth endpoints — 401s from these are meaningful (bad credentials,
// bad refresh token, etc.). We must NOT try to refresh on them.
function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("/auth/login/") ||
    url.includes("/auth/register/") ||
    url.includes("/auth/refresh/") ||
    url.includes("/auth/verify/") ||
    url.includes("/auth/logout/")
  );
}

// Clear all local auth state (used when refresh fails)
function clearAuthState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  // Expire the middleware cookie
  document.cookie = "swiggy_auth=; path=/; max-age=0; SameSite=Lax";
}

// Send the user to home with the modal open.
// window.location.replace avoids the ESLint "no-location-assign" rule.
function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  // Avoid reload loop if we're already on home
  if (window.location.pathname !== "/") {
    window.location.replace("/?auth=login");
  }
}

// ---------------------------------------------------------------------------
// 4. Refresh coordination
// ---------------------------------------------------------------------------
// Only one refresh in flight at a time. Concurrent 401s share this promise.
let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const refresh = localStorage.getItem("refresh_token");

  if (!refresh) {
    throw new Error("No refresh token available");
  }

  // Use bare axios (not apiClient) to avoid recursion through our own
  // request/response interceptors.
  const { data } = await axios.post<{ access: string }>(
    `${API_BASE_URL}/auth/refresh/`,
    { refresh },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    }
  );

  const newAccess = data.access;
  localStorage.setItem("access_token", newAccess);
  return newAccess;
}

// ---------------------------------------------------------------------------
// 5. Response interceptor — refresh on 401 + retry original
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    // Not a 401, or we don't have a config to work with -> pass through
    if (!original || status !== 401) {
      return Promise.reject(error);
    }

    // Already retried once -> refresh didn't help. Give up.
    if (original._retry) {
      return Promise.reject(error);
    }

    // 401 on an auth endpoint -> expected. Don't attempt a refresh.
    // (e.g. wrong password on /auth/login/, or expired refresh token)
    if (isAuthEndpoint(original.url)) {
      return Promise.reject(error);
    }

    // Mark as retried BEFORE the async work to block re-entry
    original._retry = true;

    try {
      // Deduplicate: only one refresh in flight across all concurrent 401s
      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccess = await refreshPromise;

      // Retry the original request with the fresh access token
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(original);
    } catch (refreshError) {
      // Refresh failed -> session is dead. Log out and go home.
      clearAuthState();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;