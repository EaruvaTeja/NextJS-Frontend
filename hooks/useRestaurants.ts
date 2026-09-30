// hooks/useRestaurants.ts
//
// Data-fetching hooks for the Restaurant domain.
//
// Three hooks:
//   useRestaurants()        -> list all restaurants
//   useRestaurant(id)       -> fetch one restaurant
//   useRestaurantMenu(id)   -> fetch menu for one restaurant
//
// All three share the same shape: { data, isLoading, error, refetch }
// and refetch silently whenever the browser tab becomes visible.

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchRestaurants,
  fetchRestaurant,
  fetchRestaurantMenu,
} from "@/lib/api/restaurants";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";
import type { Restaurant, MenuItem } from "@/types/restaurant";
import { fetchAllMenuItems } from "@/lib/api/restaurants";
import type { MenuItemWithRestaurant } from "@/lib/api/restaurants";

// ---------------------------------------------------------------------------
// Shared error extractor
// ---------------------------------------------------------------------------
function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as {
    response?: {
      status?: number;
      data?: { detail?: string | string[] };
    };
  };
  const status = axiosErr.response?.status;
  const detail = axiosErr.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) return String(detail[0]);
  if (status === 404) return `${fallback} (not found)`;
  if (status && status >= 500) return "Server error. Please try again.";
  if (status) return fallback;
  return fallback;
}

// ===========================================================================
// useRestaurants — list (supports optional ?q= search)
// ===========================================================================
export function useRestaurants(q?: string) {
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  // Normalize the query so it's stable across renders
  const normalizedQ = (q ?? "").trim();

  // Initial + manual refetch
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchRestaurants(normalizedQ || undefined);
        if (!cancelled) setRestaurants(data);
      } catch (err) {
        if (!cancelled) {
          setError(extractErrorMessage(err, "Failed to load restaurants."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [normalizedQ, refetchKey]);

  // Silent refetch
  const silentRefetch = useCallback(async () => {
    try {
      const data = await fetchRestaurants(normalizedQ || undefined);
      setRestaurants(data);
    } catch {
      // Silent
    }
  }, [normalizedQ]);

  useVisibilityRefetch(silentRefetch);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  return { restaurants, isLoading, error, refetch };
}

// ===========================================================================
// useRestaurant — single
// ===========================================================================
export function useRestaurant(id: number) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchRestaurant(id);
        if (!cancelled) setRestaurant(data);
      } catch (err) {
        if (!cancelled) {
          setError(extractErrorMessage(err, "Failed to load restaurant."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, refetchKey]);

  const silentRefetch = useCallback(async () => {
    try {
      const data = await fetchRestaurant(id);
      setRestaurant(data);
    } catch {
      // Silent
    }
  }, [id]);

  useVisibilityRefetch(silentRefetch);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  return { restaurant, isLoading, error, refetch };
}

// ===========================================================================
// useRestaurantMenu — menu items for a restaurant
// ===========================================================================
export function useRestaurantMenu(restaurantId: number) {
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchRestaurantMenu(restaurantId);
        if (!cancelled) setMenuItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(extractErrorMessage(err, "Failed to load menu."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, refetchKey]);

  const silentRefetch = useCallback(async () => {
    try {
      const data = await fetchRestaurantMenu(restaurantId);
      setMenuItems(data);
    } catch {
      // Silent
    }
  }, [restaurantId]);

  useVisibilityRefetch(silentRefetch);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  return { menuItems, isLoading, error, refetch };
}


// -----------------------------------------------
export function useAllMenuItems() {
  const [items, setItems] = useState<MenuItemWithRestaurant[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAllMenuItems();
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(extractErrorMessage(err, "Failed to load menu items."));
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

  const silentRefetch = useCallback(async () => {
    try {
      const data = await fetchAllMenuItems();
      setItems(data);
    } catch {
      // Silent
    }
  }, []);

  useVisibilityRefetch(silentRefetch);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  return { items, isLoading, error, refetch };
}
