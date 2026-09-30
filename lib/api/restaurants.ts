// lib/api/restaurants.ts
//
// Restaurant + menu API wrappers.
//
// All functions:
//   - Use the shared apiClient (auto JWT, base URL, 401 handling)
//   - Return strongly typed data
//   - Throw on non-2xx responses (caller handles via try/catch)
//
// Endpoints (from Django):
//   GET /api/restaurants/               -> Restaurant[]
//   GET /api/restaurants/<id>/          -> Restaurant
//   GET /api/restaurants/<id>/menu/     -> MenuItem[]

import apiClient from "./client";
import type { Restaurant, MenuItem } from "@/types/restaurant";

// ---------------------------------------------------------------------------
// LIST RESTAURANTS
// ---------------------------------------------------------------------------
// GET /api/restaurants/
//
// Returns all ACTIVE restaurants.
// The backend filters `is_active=True` for non-staff users automatically.
export async function fetchRestaurants(q?: string): Promise<Restaurant[]> {
  const { data } = await apiClient.get<Restaurant[]>("/restaurants/", {
    params: q ? { q } : undefined,
  });
  return data;
}

// ---------------------------------------------------------------------------
// SINGLE RESTAURANT
// ---------------------------------------------------------------------------
// GET /api/restaurants/<id>/
//
// Returns one restaurant by id.
// Throws a 404 if it doesn't exist or isn't active for customers.
export async function fetchRestaurant(id: number): Promise<Restaurant> {
  const { data } = await apiClient.get<Restaurant>(`/restaurants/${id}/`);
  return data;
}

// ---------------------------------------------------------------------------
// RESTAURANT MENU
// ---------------------------------------------------------------------------
// GET /api/restaurants/<id>/menu/
//
// Returns all menu items for the given restaurant.
// The backend filters `is_available=True` for non-staff users.
export async function fetchRestaurantMenu(
  restaurantId: number
): Promise<MenuItem[]> {
  const { data } = await apiClient.get<MenuItem[]>(
    `/restaurants/${restaurantId}/menu/`
  );
  return data;
}

// For the home showcase — item with its full restaurant nested
export interface MenuItemWithRestaurant extends MenuItem {
  restaurant: Restaurant;
}

export async function fetchAllMenuItems(): Promise<MenuItemWithRestaurant[]> {
  const { data } = await apiClient.get<MenuItemWithRestaurant[]>(
    "/menu-items/"
  );
  return data;
}