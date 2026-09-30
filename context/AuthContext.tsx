// context/AuthContext.tsx
//
// Global authentication state.
//
// Provides:
//   - user: current logged-in user (or null)
//   - isLoading: true during the initial boot check
//   - isAuthenticated: shortcut boolean
//   - login(), register(), logout(), refreshUser()
//
// Any component can call useAuth() to access this state.

"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  fetchProfile,
} from "@/lib/api/auth";
import {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/token";
import type { LoginInput, RegisterInput, User } from "@/types/auth";

// ---------------------------------------------------------------------------
// Shape of the context value
// ---------------------------------------------------------------------------
interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (payload: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Create the context (default value is undefined until Provider mounts)
// ---------------------------------------------------------------------------
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

// ---------------------------------------------------------------------------
// Provider component — wraps the entire app
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------------------------------------------------------------
  // BOOT EFFECT: runs once on mount. Determines if we're already logged in.
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function bootstrap() {
      const token = getAccessToken();

      if (!token) {
        // No token stored — user is anonymous.
        setIsLoading(false);
        return;
      }

      try {
        // Ask the backend "who am I?" using the stored token.
        const profile = await fetchProfile();
        setUser(profile);
      } catch {
        // Token invalid/expired — clean up.
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  // -------------------------------------------------------------------------
  // LOGIN: save tokens, fetch profile
  // -------------------------------------------------------------------------
  const login = useCallback(async (credentials: LoginInput) => {
    const tokens = await loginApi(credentials);
    setTokens(tokens.access, tokens.refresh);

    // Immediately fetch profile to populate user state
    const profile = await fetchProfile();
    setUser(profile);
  }, []);

  // -------------------------------------------------------------------------
  // REGISTER: create account, then auto-login
  // -------------------------------------------------------------------------
  const register = useCallback(async (payload: RegisterInput) => {
    // Step 1: create the account
    await registerApi(payload);

    // Step 2: auto-login with the same credentials
    const tokens = await loginApi({
      username: payload.username,
      password: payload.password,
    });
    setTokens(tokens.access, tokens.refresh);

    // Step 3: fetch profile
    const profile = await fetchProfile();
    setUser(profile);
  }, []);

  // -------------------------------------------------------------------------
  // LOGOUT: tell backend to blacklist refresh token, then clear local state
  // -------------------------------------------------------------------------
  const logout = useCallback(async () => {
    const refresh = getRefreshToken();

    if (refresh) {
      try {
        await logoutApi(refresh);
      } catch {
        // Even if the backend call fails, we still clear local tokens.
        // The user's local session must end regardless.
      }
    }

    clearTokens();
    setUser(null);
  }, []);

  // -------------------------------------------------------------------------
  // REFRESH USER: re-fetch profile (e.g., after editing)
  // -------------------------------------------------------------------------
  const refreshUser = useCallback(async () => {
    try {
      const profile = await fetchProfile();
      setUser(profile);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
