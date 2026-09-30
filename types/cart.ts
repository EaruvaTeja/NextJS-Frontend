// types/cart.ts
//
// TypeScript types for the Cart domain.
//
// These mirror the JSON shapes from:
//   cart/api_serializers.py  (CartReadSerializer)
//
// Backend endpoints:
//   GET    /api/cart/                    -> Cart
//   POST   /api/cart/add/                -> Cart (updated)
//   PATCH  /api/cart/items/<item_id>/    -> Cart (updated)
//   DELETE /api/cart/items/<item_id>/    -> Cart (updated)
//   DELETE /api/cart/clear/              -> Cart (empty)

// ---------------------------------------------------------------------------
// NESTED — minimal menu item inside a cart item
// ---------------------------------------------------------------------------
// Deliberately smaller than the full MenuItem type from restaurant.ts.
// The cart only needs enough to render a row: name, price, image, veg flag.
export interface CartMenuItem {
  id: number;
  name: string;
  price: string;              // DecimalField -> string
  image: string | null;
  is_vegetarian: boolean;
  // Optional until the backend serializer sends it. `false` means the item
  // was added earlier but is unavailable now.
  is_available?: boolean;
  category:
    | "appetizer"
    | "main_course"
    | "dessert"
    | "beverage"
    | "side";
}

// ---------------------------------------------------------------------------
// NESTED — minimal restaurant info at cart level
// ---------------------------------------------------------------------------
// Just enough to show "Your order from Dragon Wok (Est. 25 min)".
// `distance_km` lets us compute the delivery fee client-side.
export interface CartRestaurant {
  id: number;
  name: string;
  cuisine_type: string;
  delivery_time: number;
  distance_km: string;        // DecimalField -> string (e.g. "5.00")
  image: string | null;
}

// ---------------------------------------------------------------------------
// CART ITEM
// ---------------------------------------------------------------------------
export interface CartItem {
  id: number;                          // CartItem.id (used for PATCH/DELETE)
  menu_item: CartMenuItem;
  quantity: number;
  special_instructions: string;
  subtotal: string;                    // current price * quantity
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// CART
// ---------------------------------------------------------------------------
// `restaurant` is null when the cart is empty.
// `items` is always an array (empty when no items).
export interface Cart {
  id: number;
  restaurant: CartRestaurant | null;
  items: CartItem[];
  item_count: number;                  // total quantity across all items
  total: string;                       // sum of all subtotals
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// INPUT SHAPES (what we send to the backend)
// ---------------------------------------------------------------------------

// Body for POST /api/cart/add/
export interface AddToCartInput {
  menu_item_id: number;
  quantity: number;
  special_instructions?: string;
}

// Body for PATCH /api/cart/items/<id>/
// Both fields optional — send only what's changing.
export interface UpdateCartItemInput {
  quantity?: number;
  special_instructions?: string;
}