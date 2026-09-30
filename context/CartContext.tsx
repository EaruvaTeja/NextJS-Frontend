// context/CartContext.tsx
//
// Global cart state, synced with the backend.
//
// Design:
//   - Every mutation calls the API and replaces local state with the
//     server's response.
//   - Mutations run through a serial queue so responses can never apply
//     out of order.
//   - Global `error` is reserved for the bootstrap fetch ONLY. Mutation
//     errors are re-thrown and handled by the caller (toast / dialog).
//   - Bootstraps on mount and re-fetches whenever the auth user changes.

"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";
import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "@/lib/api/cart";
import { clearCartNotes } from "@/lib/cart-notes";
import { useAuth } from "@/hooks/useAuth";
import type {
  Cart,
  AddToCartInput,
  UpdateCartItemInput,
} from "@/types/cart";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  itemCount: number;

  addItem: (input: AddToCartInput) => Promise<void>;
  updateItem: (cartItemId: number, input: UpdateCartItemInput) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(
  undefined
);

// ---------------------------------------------------------------------------
// Error extraction (exported — components use it for toast messages)
// ---------------------------------------------------------------------------
export function extractCartError(err: unknown, fallback: string): string {
  const e = err as
    | {
        response?: {
          status?: number;
          data?: {
            detail?: string | string[];
            message?: string;
          };
        };
        request?: unknown;
        code?: string;
      }
    | null
    | undefined;

  const data = e?.response?.data;

  const detail = data?.detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && detail.length > 0) return String(detail[0]);
  if (typeof data?.message === "string" && data.message) return data.message;

  // No response at all: offline, DNS, CORS, timeout
  if (!e?.response && (e?.request || e?.code === "ERR_NETWORK")) {
    return "Network error. Check your connection and try again.";
  }

  const status = e?.response?.status;
  if (status === 401) return "Your session expired. Please log in again.";
  if (status && status >= 500) return "Server error. Please try again.";
  return fallback;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [cart, setCart] = useState<Cart | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Serial mutation queue + bookkeeping (refs: never trigger renders)
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const pendingRef = useRef(0); // mutations queued or running
  const epochRef = useRef(0); // bumps whenever a mutation starts/finishes
  const sessionRef = useRef(0); // bumps on login / logout / account switch
  const hasLoadedRef = useRef(false); // has ANY cart loaded for this session

  // -------------------------------------------------------------------------
  // Bootstrap — fetch cart when user is known; clear on logout.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function sync() {
      sessionRef.current += 1;
      hasLoadedRef.current = false;

      if (userId === null) {
        setCart(null);
        setError(null);
        setIsFetching(false);
        clearCartNotes(); // notes must not leak to the next account
        return;
      }

      setCart(null); // never show the previous account's cart
      setIsFetching(true);
      setError(null);
      try {
        const data = await fetchCart();
        if (!cancelled) {
          hasLoadedRef.current = true;
          setCart(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(extractCartError(err, "Failed to load cart."));
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  // Empty cart => notes are meaningless (order placed, cart cleared, etc.)
  useEffect(() => {
    if (cart && cart.items.length === 0) clearCartNotes();
  }, [cart]);

  // -------------------------------------------------------------------------
  // Shared mutation runner — serial queue
  // -------------------------------------------------------------------------
  // Errors are re-thrown (not stored in `error`) so the caller decides how to
  // react. A failed mutation does NOT break the queue for the ones behind it.
  const runMutation = useCallback((fn: () => Promise<Cart>): Promise<void> => {
    const session = sessionRef.current;
    epochRef.current += 1;
    pendingRef.current += 1;
    setIsMutating(true);

    const task = queueRef.current.then(async () => {
      const updated = await fn();
      if (session !== sessionRef.current) return; // logged out meanwhile
      epochRef.current += 1;
      hasLoadedRef.current = true;
      setCart(updated);
    });

    queueRef.current = task.catch(() => undefined);

    return task.finally(() => {
      pendingRef.current -= 1;
      if (pendingRef.current === 0) setIsMutating(false);
    });
  }, []);

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------
  const addItem = useCallback(
    async (input: AddToCartInput) => {
      await runMutation(() => addToCart(input));
    },
    [runMutation]
  );

  const updateItem = useCallback(
    async (cartItemId: number, input: UpdateCartItemInput) => {
      await runMutation(() => updateCartItem(cartItemId, input));
    },
    [runMutation]
  );

  const removeItem = useCallback(
    async (cartItemId: number) => {
      await runMutation(() => removeCartItem(cartItemId));
    },
    [runMutation]
  );

  const clear = useCallback(async () => {
    await runMutation(() => clearCart());
  }, [runMutation]);

  // -------------------------------------------------------------------------
  // Refresh (also used as "Try again" after a failed bootstrap)
  // -------------------------------------------------------------------------
  const refresh = useCallback(async () => {
    if (userId === null) return;

    const session = sessionRef.current;
    const startedAt = epochRef.current;
    if (!hasLoadedRef.current) setError(null); // retry after failed bootstrap

    try {
      const data = await fetchCart();
      if (session !== sessionRef.current) return;
      // A mutation started or finished while we were fetching: our data is
      // older than local state. Drop it.
      if (epochRef.current !== startedAt || pendingRef.current > 0) return;
      hasLoadedRef.current = true;
      setCart(data);
      setError(null);
    } catch (err) {
      if (session !== sessionRef.current) return;
      // Keep showing the cart we already have. Only surface an error if
      // nothing has ever loaded.
      if (!hasLoadedRef.current) {
        setError(extractCartError(err, "Failed to load cart."));
      }
    }
  }, [userId]);

  // Silently refresh the cart when the user returns to the tab.
  useVisibilityRefetch(() => {
    void refresh();
  });

  const clearError = useCallback(() => setError(null), []);

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------
  const itemCount = cart?.item_count ?? 0;

  // `cart === null` for a logged-in user with no error means "first fetch has
  // not landed yet" — treat as loading so the page never flashes "empty".
  const isLoading =
    authLoading ||
    isFetching ||
    (userId !== null && cart === null && error === null);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading,
      isMutating,
      error,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      clear,
      refresh,
      clearError,
    }),
    [
      cart,
      isLoading,
      isMutating,
      error,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      clear,
      refresh,
      clearError,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}