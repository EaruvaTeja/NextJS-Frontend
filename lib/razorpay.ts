// lib/razorpay.ts
//
// Loads the Razorpay Checkout script on demand.
//
// Why on-demand?
//   The script is ~50KB. Loading it on every page wastes bandwidth for
//   users who never reach checkout. We inject it only when we need it.
//
// Caching:
//   If the script is already loaded, we return the cached promise.
//   Multiple calls share the same load.
//
// SSR safety:
//   This module must only be imported into client components (or hooks
//   that run client-side). It touches `document` / `window`.

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const SCRIPT_ID = "razorpay-checkout-script";

// Module-level cached promise — survives across component remounts
let loadPromise: Promise<boolean> | null = null;

/**
 * Loads the Razorpay Checkout script and resolves when
 * `window.Razorpay` is available.
 *
 * @returns Promise<boolean> — resolves true when ready, false on error.
 */
export function loadRazorpayScript(): Promise<boolean> {
  // Server-side — nothing to do
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  // Already loaded
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  // Already loading — return the same promise
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<boolean>((resolve) => {
    // Check if a stale <script> tag exists (e.g. after HMR)
    const existing = document.getElementById(
      SCRIPT_ID
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      // Give the script a tick to attach window.Razorpay
      if (window.Razorpay) {
        resolve(true);
      } else {
        // Rare — network says loaded but global missing
        resolve(false);
      }
    };

    script.onerror = () => {
      // Clear the cache so a subsequent call can retry
      loadPromise = null;
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return loadPromise;
}

/**
 * Test-only helper — resets the cached script load.
 * In production, the script is loaded once and reused.
 */
export function resetRazorpayScriptCache(): void {
  if (typeof window === "undefined") return;
  loadPromise = null;
  const el = document.getElementById(SCRIPT_ID);
  if (el) el.remove();
}