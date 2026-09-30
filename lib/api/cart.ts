// lib/api/cart.ts
//
// Cart API wrappers.
//
// Every endpoint requires JWT authentication (enforced server-side).
// Every mutation returns the FULL updated cart, so the caller can
// simply replace local state — no manual merging needed.
//
// Endpoints (from cart/api_urls.py):
//   GET    /api/cart/                    -> current user's cart
//   POST   /api/cart/add/                -> add or increment an item
//   PATCH  /api/cart/items/<item_id>/    -> update quantity/instructions
//   DELETE /api/cart/items/<item_id>/    -> remove one item
//   DELETE /api/cart/clear/              -> remove all items

import apiClient from "./client";
import type {
  Cart,
  AddToCartInput,
  UpdateCartItemInput,
} from "@/types/cart";

// ---------------------------------------------------------------------------
// GET CURRENT CART
// ---------------------------------------------------------------------------
// Auto-creates an empty cart on first call (backend behaviour).
export async function fetchCart(): Promise<Cart> {
  const { data } = await apiClient.get<Cart>("/cart/");
  return data;
}

// ---------------------------------------------------------------------------
// ADD ITEM
// ---------------------------------------------------------------------------
// Backend:
//   - Creates a new CartItem, OR
//   - Increments quantity if the menu_item already exists
//   - Rejects if the item belongs to a different restaurant than the
//     current cart's restaurant (returns 400 with `restaurant_mismatch`)
export async function addToCart(input: AddToCartInput): Promise<Cart> {
  const { data } = await apiClient.post<Cart>("/cart/add/", input);
  return data;
}

// ---------------------------------------------------------------------------
// UPDATE ONE ITEM
// ---------------------------------------------------------------------------
// PATCH is partial: send only { quantity } or only { special_instructions }
// or both. The backend requires at least one field.
export async function updateCartItem(
  cartItemId: number,
  input: UpdateCartItemInput
): Promise<Cart> {
  const { data } = await apiClient.patch<Cart>(
    `/cart/items/${cartItemId}/`,
    input
  );
  return data;
}

// ---------------------------------------------------------------------------
// REMOVE ONE ITEM
// ---------------------------------------------------------------------------
// Returns the updated cart (with that item removed).
export async function removeCartItem(cartItemId: number): Promise<Cart> {
  const { data } = await apiClient.delete<Cart>(
    `/cart/items/${cartItemId}/`
  );
  return data;
}

// ---------------------------------------------------------------------------
// CLEAR ENTIRE CART
// ---------------------------------------------------------------------------
// Deletes every CartItem. The Cart row itself remains (empty).
export async function clearCart(): Promise<Cart> {
  const { data } = await apiClient.delete<Cart>("/cart/clear/");
  return data;
}