// lib/loading.ts
//
// Shared top-loading-bar controller.
//
// Why a module-level counter instead of a React context?
//   - The loading bar is a purely visual side-effect, not UI state
//   - Callers don't need to be inside a Provider
//   - Can be called from anywhere: API wrappers, hooks, event handlers
//
// Usage:
//   import { startLoading, stopLoading } from "@/lib/loading";
//
//   startLoading();
//   try {
//     await someApiCall();
//   } finally {
//     stopLoading();
//   }
//
// The counter handles nesting: multiple concurrent requests won't
// cause flickering. Bar stays visible until ALL are done.

import NProgress from "nprogress";

// Configuration
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.1,
});

// Tracks active "loading tokens" — one per in-flight operation
let activeCount = 0;

export function startLoading(): void {
  if (typeof window === "undefined") return;
  activeCount += 1;
  if (activeCount === 1) {
    NProgress.start();
  }
}

export function stopLoading(): void {
  if (typeof window === "undefined") return;
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) {
    NProgress.done();
  }
}

// Force-reset (rarely needed — useful on hard navigation or errors)
export function resetLoading(): void {
  if (typeof window === "undefined") return;
  activeCount = 0;
  NProgress.done();
}