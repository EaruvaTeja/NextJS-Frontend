// types/restaurant.ts
//
// TypeScript types for the Restaurant domain.
// These MIRROR the JSON shapes from the Django backend.
//
// Backend endpoints (from restaurants/api_urls.py):
//   GET /api/restaurants/                  -> Restaurant[]
//   GET /api/restaurants/<id>/             -> Restaurant
//   GET /api/restaurants/<id>/menu/        -> MenuItem[]
//   GET /api/restaurants/<id>/menu/<mid>/  -> MenuItem

// ---------------------------------------------------------------------------
// RESTAURANT
// ---------------------------------------------------------------------------
// NOTE: `rating` comes back as a STRING from the backend because Django's
// DecimalField serializes to string (to preserve precision).
// Always convert to number before doing math:
//     const stars = Number(restaurant.rating);
//
// `distance_km` is also a DecimalField -> string. The frontend uses it to
// compute the delivery fee tier client-side.
export interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  cuisine_type: string;
  rating: string;
  delivery_time: number;
  distance_km: string;        // <-- NEW (e.g. "2.50")
  image: string | null;
  is_active: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// MENU ITEM
// ---------------------------------------------------------------------------
// Backend ships these fields for each menu item:
//   id, restaurant, name, description, price (string), image (url or null),
//   is_vegetarian, is_available, category, created_at
//
// Category choices (from Django model):
//   "appetizer" | "main_course" | "dessert" | "beverage" | "side"
export type MenuItemCategory =
  | "appetizer"
  | "main_course"
  | "dessert"
  | "beverage"
  | "side";

export interface MenuItem {
  id: number;
  restaurant: number; // FK id
  name: string;
  description: string;
  price: string; // string from DecimalField
  image: string | null; // full URL or null
  is_vegetarian: boolean;
  is_available: boolean;
  category: MenuItemCategory;
  rating: string;
  rating_count: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// HELPER TYPES
// ---------------------------------------------------------------------------

// Human-readable labels for each category (used to group the menu)
export const CATEGORY_LABELS: Record<MenuItemCategory, string> = {
  appetizer: "Appetizers",
  main_course: "Main Course",
  dessert: "Desserts",
  beverage: "Beverages",
  side: "Sides",
};