// components/layout/RouteLoadingBar.tsx
//
// Watches for route changes and drives the top loading bar.
//
// How it works:
//   1. On every pathname change, we trigger startLoading() + stopLoading()
//   2. NProgress's trickle animation fills the bar smoothly
//   3. When the new page has mounted, we call done() to hide it
//
// Why not use Next.js router events?
//   App Router doesn't expose router.events. The recommended approach
//   is watching usePathname() + useEffect, which fires when the route
//   has settled. To make the bar feel responsive, we also add a brief
//   artificial delay so it appears even on instant navigations.

"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { startLoading, stopLoading } from "@/lib/loading";

export function RouteLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Route changed. Show the bar briefly, then hide it.
    startLoading();

    // Give the bar a moment to be visible — otherwise on fast
    // navigations it flashes for 1 frame and looks broken.
    const timer = setTimeout(() => {
      stopLoading();
    }, 350);

    return () => {
      clearTimeout(timer);
      stopLoading();
    };
    // Depend on both pathname and query string so navigation within
    // the same route (e.g., /?auth=login -> /) also triggers.
  }, [pathname, searchParams]);

  return null;
}