// hooks/useOrders.ts
//
// Data-fetching hooks for the Order domain.
//
// Live updates:
//   - Optional polling (pollMs) refetches at a fixed interval
//   - Refetch on tab visibility (debounced by useVisibilityRefetch)
//   - Polling pauses when the tab is hidden
//   - Silent refetches skip if a fetch is already in flight

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchOrders, fetchOrder } from "@/lib/api/orders";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";
import type { Order, OrderStatus } from "@/types/order";

// ---------------------------------------------------------------------------
// Error extractor
// ---------------------------------------------------------------------------
function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as {
    response?: {
      status?: number;
      data?: { detail?: string | string[] };
    };
  };
  const detail = axiosErr.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) return String(detail[0]);
  const status = axiosErr.response?.status;
  if (status === 404) return `${fallback} (not found)`;
  if (status && status >= 500) return "Server error. Please try again.";
  return fallback;
}

// ---------------------------------------------------------------------------
// Status constants
// ---------------------------------------------------------------------------
const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
];

const RETRY_STATUSES: OrderStatus[] = ["awaiting_payment", "payment_failed"];
const RETRY_WINDOW_MS = 10 * 60 * 1000;

const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "cancelled"];
const TERMINAL_WINDOWS: Record<string, number> = {
  delivered: 60 * 60 * 1000,
  cancelled: 5 * 60 * 1000,
};

function pickDisplayOrder(orders: Order[], now: number): Order | null {
  const sorted = [...orders].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  for (const order of sorted) {
    if (RETRY_STATUSES.includes(order.status)) {
      const createdMs = new Date(order.created_at).getTime();
      if (now - createdMs < RETRY_WINDOW_MS) return order;
      continue;
    }
    if (ACTIVE_STATUSES.includes(order.status)) return order;
    if (TERMINAL_STATUSES.includes(order.status)) {
      const windowMs = TERMINAL_WINDOWS[order.status];
      const changedAt = new Date(
        order.updated_at || order.created_at
      ).getTime();
      if (windowMs && now - changedAt < windowMs) return order;
    }
  }
  return null;
}

// ===========================================================================
// useOrders — list all orders for the current user
// ===========================================================================
export function useOrders(options: { pollMs?: number } = {}) {
  const { pollMs } = options;
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  // Initial + manual refetch — shows loading state
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchOrders();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) {
          setError(extractErrorMessage(err, "Failed to load orders."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refetchKey]);

  // In-flight guard — prevents concurrent silent fetches
  const inFlightRef = useRef(false);

  const silentRefetch = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch {
      // Silent
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Polling — pauses when tab is hidden
  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void silentRefetch();
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs, silentRefetch]);

  useVisibilityRefetch(silentRefetch);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  return { orders, isLoading, error, refetch };
}

// ===========================================================================
// useOrder — single order by id
// ===========================================================================
export function useOrder(
  orderId: number | string | undefined,
  options: { pollMs?: number } = {}
) {
  const { pollMs } = options;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!orderId) {
        if (!cancelled) {
          setOrder(null);
          setIsLoading(false);
          setError(null);
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchOrder(orderId as number | string);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) {
          setError(extractErrorMessage(err, "Failed to load order."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId, refetchKey]);

  const inFlightRef = useRef(false);

  const silentRefetch = useCallback(async () => {
    if (!orderId) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const data = await fetchOrder(orderId as number | string);
      setOrder(data);
    } catch {
      // Silent
    } finally {
      inFlightRef.current = false;
    }
  }, [orderId]);

  useEffect(() => {
    if (!pollMs || !orderId) return;
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void silentRefetch();
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs, orderId, silentRefetch]);

  useVisibilityRefetch(silentRefetch);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  return { order, isLoading, error, refetch };
}

// ===========================================================================
// useActiveOrder — Hero status card
// ===========================================================================
//
// Polling only runs when an active order is on screen. If the user is in
// a guest / cart / empty state, there's nothing to poll for — skip.
//
export function useActiveOrder(
  enabled: boolean,
  options: { pollMs?: number } = {}
) {
  const { pollMs } = options;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchRef = useRef<() => void>(() => {});
  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setOrder(null);
      return;
    }
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const all = await fetchOrders();
      const picked = pickDisplayOrder(all, Date.now());
      setOrder(picked);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load active order."));
      setOrder(null);
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refetchRef.current = load;
  }, [load]);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Polling — only when there's an active order to keep fresh
  useEffect(() => {
    if (!pollMs || !enabled) return;
    if (!order) return; // nothing to poll for
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void refetchRef.current();
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs, enabled, order]);

  useVisibilityRefetch(() => {
    if (enabled) void load();
  });

  const refetch = useCallback(() => {
    void load();
  }, [load]);

  return { order, isLoading, error, refetch };
}