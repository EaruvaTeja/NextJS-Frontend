// lib/auth/token.ts
//
// Thin wrapper around localStorage for JWT tokens.
// ALSO maintains a non-sensitive cookie flag that middleware.ts can read.
//
// Why the cookie flag?
//   Next.js middleware runs on the server/edge and CANNOT read localStorage.
//   It CAN read cookies though. So we store a "logged in?" flag in a cookie
//   in addition to the real tokens in localStorage.
//
// Security note:
//   The cookie only contains "1", not the token itself.
//   Real tokens stay in localStorage (readable only by same-origin JS).
//   In production, prefer httpOnly cookies for tokens + a proper refresh flow.

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const AUTH_COOKIE_NAME = "swiggy_auth";

// ---------------------------------------------------------------------------
// SSR safety helper
// ---------------------------------------------------------------------------
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ---------------------------------------------------------------------------
// Cookie helpers (used by middleware)
// ---------------------------------------------------------------------------
function setAuthCookie(): void {
  if (!isBrowser()) return;
  // 1-day expiry to match the refresh token lifetime.
  // SameSite=Lax allows top-level navigation to work while blocking CSRF.
  document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

function clearAuthCookie(): void {
  if (!isBrowser()) return;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// Save tokens (called after successful login/register)
// ---------------------------------------------------------------------------
export function setTokens(access: string, refresh: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  setAuthCookie(); // also set the middleware-visible flag
}

// ---------------------------------------------------------------------------
// Read tokens
// ---------------------------------------------------------------------------
export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Clear tokens (called on logout, or on 401 response)
// ---------------------------------------------------------------------------
export function clearTokens(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  clearAuthCookie();
}

// ---------------------------------------------------------------------------
// Quick check — do we have at least an access token stored?
// ---------------------------------------------------------------------------
export function hasTokens(): boolean {
  return getAccessToken() !== null;
}

