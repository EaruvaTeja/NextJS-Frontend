// hooks/useVisibilityRefetch.ts
//
// Fires `callback` whenever the browser tab becomes visible.
//
// Debounced:
//   Mobile browsers fire `visibilitychange` aggressively (keyboard open,
//   notification pull, Razorpay iframe focus, etc.). Without a debounce
//   this can trigger 10+ refetches in a couple of seconds.
//
//   We enforce a minimum interval between refetches. Events that arrive
//   inside that window are coalesced into a single trailing call.

"use client";

import { useEffect, useRef } from "react";

const DEFAULT_MIN_INTERVAL_MS = 2000;

export function useVisibilityRefetch(
  callback: () => void,
  minIntervalMs: number = DEFAULT_MIN_INTERVAL_MS
): void {
  const cbRef = useRef(callback);
  const lastFireRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the ref current
  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  // Attach once — debounce events
  useEffect(() => {
    function onVisibilityChange() {
      if (typeof document === "undefined") return;
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      const elapsed = now - lastFireRef.current;

      // Outside the debounce window → fire immediately
      if (elapsed >= minIntervalMs) {
        lastFireRef.current = now;
        cbRef.current();
        return;
      }

      // Inside the window → schedule a single trailing call
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        lastFireRef.current = Date.now();
        cbRef.current();
      }, minIntervalMs - elapsed);
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [minIntervalMs]);
}