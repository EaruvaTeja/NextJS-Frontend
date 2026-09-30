// types/auth.ts
//
// TypeScript types for the auth domain.
//
// These mirror what the Django backend actually returns.
// If the backend shape changes, we update ONE file and TypeScript
// tells us every place in the frontend that needs fixing.

// ---------------------------------------------------------------------------
// API RESPONSE TYPES (what the backend returns)
// ---------------------------------------------------------------------------

/**
 * JWT token pair returned by /api/auth/login/ and /api/auth/register/.
 *
 * `access`  — short-lived (30 min), used for API requests.
 * `refresh` — long-lived (1 day), used to get a new access token.
 */
export interface TokenPair {
  access: string;
  refresh: string;
}

/**
 * User profile returned by /api/users/profile/.
 * Also partially returned by register/login endpoints.
 */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

// ---------------------------------------------------------------------------
// API INPUT TYPES (what we send to the backend)
// ---------------------------------------------------------------------------

/**
 * Body for POST /api/auth/login/
 */
export interface LoginInput {
  username: string;
  password: string;
}

/**
 * Body for POST /api/auth/register/
 */
export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  first_name?: string;   // ? means optional
  last_name?: string;
}

// ---------------------------------------------------------------------------
// FRONTEND-ONLY TYPES
// ---------------------------------------------------------------------------

/**
 * The auth state held inside AuthContext.
 *
 * `user` is null when not logged in.
 * `isLoading` is true during the initial "am I still logged in?" check.
 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

