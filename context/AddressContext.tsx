// context/AddressContext.tsx
//
// Global state for user addresses + the currently-selected delivery address.
//
// Two concepts:
//   - DEFAULT address   : DB-backed (is_default=true). One per user.
//                         Set from /profile → Addresses tab only.
//   - SELECTED address  : localStorage-backed (per device). The one the
//                         user picked from the home picker or cart page.
//
// Rules:
//   - On first load, selected = default (or oldest address if no default)
//   - User picking a different one updates selected only (local)
//   - If the selected address is deleted, fall back to default
//   - CRUD operations refetch the list so everything stays in sync

"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/lib/api/addresses";
import { useAuth } from "@/hooks/useAuth";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";
import type { Address, AddressInput } from "@/types/address";

// ---------------------------------------------------------------------------
// Selection persistence (localStorage, per device)
// ---------------------------------------------------------------------------
const SELECTED_KEY = "swiggy_selected_address_id";
const SELECTED_CHANGE_EVENT = "swiggy-selected-address-changed";

function subscribeSelected(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  window.addEventListener(SELECTED_CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(SELECTED_CHANGE_EVENT, cb);
  };
}

function getSelectedSnapshot(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SELECTED_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function getSelectedServerSnapshot(): number | null {
  return null;
}

function persistSelected(id: number | null): void {
  if (typeof window === "undefined") return;
  if (id === null) localStorage.removeItem(SELECTED_KEY);
  else localStorage.setItem(SELECTED_KEY, String(id));
  window.dispatchEvent(new Event(SELECTED_CHANGE_EVENT));
}

// ---------------------------------------------------------------------------
// Error extraction (same pattern used elsewhere)
// ---------------------------------------------------------------------------
function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as {
    response?: {
      status?: number;
      data?: Record<string, string[] | string>;
    };
  };
  const data = axiosErr.response?.data;
  if (data && typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length > 0) {
      const first = data[keys[0]];
      if (Array.isArray(first) && first.length > 0) return String(first[0]);
      if (typeof first === "string") return first;
    }
  }
  const status = axiosErr.response?.status;
  if (status && status >= 500) return "Server error. Please try again.";
  return fallback;
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface AddressContextValue {
  addresses: Address[] | null;
  isLoading: boolean;
  error: string | null;
  /** The address currently chosen for delivery (local preference). */
  selectedAddress: Address | null;
  /** Convenience — the DB-level default address. */
  defaultAddress: Address | null;

  refetch: () => Promise<void>;

  create: (input: AddressInput) => Promise<Address>;
  update: (id: number, input: Partial<AddressInput>) => Promise<Address>;
  remove: (id: number) => Promise<void>;
  setDefault: (id: number) => Promise<Address>;
  select: (id: number | null) => void;
}

export const AddressContext = createContext<AddressContextValue | undefined>(
  undefined
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AddressProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  // The persisted selection (from localStorage)
  const storedSelectedId = useSyncExternalStore(
    subscribeSelected,
    getSelectedSnapshot,
    getSelectedServerSnapshot
  );

  // -------------------------------------------------------------------------
  // Fetch list whenever the user changes or a manual refetch is triggered
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function load() {
      if (!user) {
        setAddresses(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAddresses();
        if (!cancelled) setAddresses(data);
      } catch (err) {
        if (!cancelled) {
          setError(extractErrorMessage(err, "Failed to load addresses."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, user?.id, refetchKey]);

  // -------------------------------------------------------------------------
  // Derived: default + selected addresses
  // -------------------------------------------------------------------------
  const defaultAddress = useMemo<Address | null>(() => {
    if (!addresses) return null;
    return addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
  }, [addresses]);

  const selectedAddress = useMemo<Address | null>(() => {
    if (!addresses || addresses.length === 0) return null;

    // If the user picked one and it still exists, use it.
    if (storedSelectedId !== null) {
      const found = addresses.find((a) => a.id === storedSelectedId);
      if (found) return found;
    }

    // Otherwise fall back to the default (or oldest address).
    return defaultAddress;
  }, [addresses, storedSelectedId, defaultAddress]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  const refetch = useCallback(async () => {
    setRefetchKey((k) => k + 1);
  }, []);

// Silently refresh the address list when the user returns to the tab.
  // Useful when admin or another tab modifies addresses.
  useVisibilityRefetch(() => {
    if (user) void refetch();
  });

  const create = useCallback(
    async (input: AddressInput) => {
      const created = await createAddress(input);
      // Refresh the list so ordering / default flag stay in sync
      setRefetchKey((k) => k + 1);
      return created;
    },
    []
  );

  const update = useCallback(
    async (id: number, input: Partial<AddressInput>) => {
      const updated = await updateAddress(id, input);
      // Optimistic local update
      setAddresses((prev) =>
        prev ? prev.map((a) => (a.id === id ? updated : a)) : prev
      );
      return updated;
    },
    []
  );

  const remove = useCallback(async (id: number) => {
    await deleteAddress(id);
    // If we just removed the selected one, clear the local selection
    const currentSelected = getSelectedSnapshot();
    if (currentSelected === id) {
      persistSelected(null);
    }
    // Refresh from backend — the model may have promoted a new default
    setRefetchKey((k) => k + 1);
  }, []);

  const setDefault = useCallback(async (id: number) => {
    const updated = await setDefaultAddress(id);
    // Refresh list so the previous default's is_default=false gets reflected
    setRefetchKey((k) => k + 1);
    return updated;
  }, []);

  const select = useCallback((id: number | null) => {
    persistSelected(id);
  }, []);

  // -------------------------------------------------------------------------
  // Value
  // -------------------------------------------------------------------------
  const value: AddressContextValue = {
    addresses,
    isLoading,
    error,
    selectedAddress,
    defaultAddress,
    refetch,
    create,
    update,
    remove,
    setDefault,
    select,
  };

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
}