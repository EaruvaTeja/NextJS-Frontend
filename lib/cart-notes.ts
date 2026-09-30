// lib/cart-notes.ts
//
// Persists the "delivery / special instructions" text across page reloads.
//
// Storage: localStorage (browser-only, per-device). Every access is guarded
// because storage can be blocked (Safari private mode, cookie settings) or full.
// Key: a single shared key. Clearing happens on logout and whenever the cart
// becomes empty (see CartContext) and after a successful order (checkout).
//
// Lifecycle:
//   - User types in CartSuggestions -> saved on blur / Enter
//   - Checkout reads it via getCartNotes() and sends it as `notes` in the
//     order-creation request.
//   - Cleared after order placement, on logout, and when the cart is empty.

const NOTES_KEY = "swiggy_cart_notes";
const CHANGE_EVENT = "swiggy-cart-notes-changed";

export const CART_NOTES_MAX_LENGTH = 100;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getCartNotes(): string {
  if (!isBrowser()) return "";
  try {
    return window.localStorage.getItem(NOTES_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setCartNotes(value: string): void {
  if (!isBrowser()) return;

  const clean = value.trim().slice(0, CART_NOTES_MAX_LENGTH);
  if (getCartNotes() === clean) return; // nothing changed, no event

  try {
    if (clean === "") window.localStorage.removeItem(NOTES_KEY);
    else window.localStorage.setItem(NOTES_KEY, clean);
  } catch {
    /* storage blocked or full — notes are best-effort */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearCartNotes(): void {
  setCartNotes("");
}

// For useSyncExternalStore (same tab via CHANGE_EVENT, other tabs via "storage")
export function subscribeCartNotes(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}