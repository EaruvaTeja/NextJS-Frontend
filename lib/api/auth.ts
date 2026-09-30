// lib/api/auth.ts
//
// Auth API wrapper functions.
//
// Each function calls one backend endpoint and returns typed data.
// The actual HTTP transport (base URL, JWT attachment) is handled
// by apiClient — we only describe WHAT to send and WHERE.
//
// Backend endpoints (from swiggy/urls.py):
//   POST /api/auth/register/   -> create new user
//   POST /api/auth/login/      -> returns { access, refresh }
//   POST /api/auth/refresh/    -> returns new { access }
//   POST /api/auth/logout/     -> blacklists the refresh token
//   GET  /api/users/profile/   -> returns User

import apiClient from "./client";
import type {
  LoginInput,
  RegisterInput,
  TokenPair,
  User,
} from "@/types/auth";

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
// POST /api/auth/login/
// Body: { username, password }
// Returns: { access, refresh }
export async function login(credentials: LoginInput): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>(
    "/auth/login/",
    credentials
  );
  return data;
}

// ---------------------------------------------------------------------------
// REGISTER
// ---------------------------------------------------------------------------
// POST /api/auth/register/
// Body: { username, email, password, first_name?, last_name? }
// Returns: the created User object (no tokens)
//
// After this, the caller usually calls login() to auto-sign the user in.
export async function register(payload: RegisterInput): Promise<User> {
  const { data } = await apiClient.post<User>(
    "/auth/register/",
    payload
  );
  return data;
}

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
// POST /api/auth/logout/
// Body: { refresh }
// Blacklists the refresh token server-side.
//
// Note: even after this, the access token remains technically valid
// until it expires (30 min). This is a known JWT limitation.
export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout/", { refresh: refreshToken });
}

// ---------------------------------------------------------------------------
// REFRESH ACCESS TOKEN
// ---------------------------------------------------------------------------
// POST /api/auth/refresh/
// Body: { refresh }
// Returns: { access } (and possibly a new refresh, depending on SimpleJWT config)
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access: string }> {
  const { data } = await apiClient.post<{ access: string }>(
    "/auth/refresh/",
    { refresh: refreshToken }
  );
  return data;
}

// ---------------------------------------------------------------------------
// FETCH PROFILE
// ---------------------------------------------------------------------------
// GET /api/users/profile/
// Uses the JWT token automatically attached by apiClient's interceptor.
// Returns: User object
export async function fetchProfile(): Promise<User> {
  const { data } = await apiClient.get<User>("/users/profile/");
  return data;
}

// ---------------------------------------------------------------------------
// VERIFY TOKEN
// ---------------------------------------------------------------------------
// POST /api/auth/verify/
// Body: { token }
// Returns 200 OK if the token is valid, 401 if expired/invalid.
//
// Use case: quick "is my token still valid?" check without fetching
// the full user. For most flows, fetchProfile() is more useful because
// it validates AND returns user data in one request.
export async function verifyToken(access: string): Promise<boolean> {
  try {
    await apiClient.post("/auth/verify/", { token: access });
    return true;
  } catch {
    return false;
  }
}

