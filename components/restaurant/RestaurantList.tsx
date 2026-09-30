// components/restaurant/RestaurantList.tsx
//
// Grid of RestaurantCards + a matching loading skeleton.
//
// Pure presentational component: it receives the restaurants array
// as a prop. The page is responsible for fetching, error handling,
// and empty states.
//
// Both exports live in the same file because they share the same
// grid layout. When we change the responsive breakpoints or gaps,
// we change them in one place.

import { RestaurantCard } from "./RestaurantCard";
import { Card } from "@/components/ui/card";
import type { Restaurant } from "@/types/restaurant";

// ---------------------------------------------------------------------------
// RestaurantList — the real grid
// ---------------------------------------------------------------------------
interface RestaurantListProps {
  restaurants: Restaurant[];
}

export function RestaurantList({ restaurants }: RestaurantListProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {restaurants.map((restaurant, index) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          priority={index < 4}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RestaurantListSkeleton — loading placeholder
// ---------------------------------------------------------------------------
// Renders 8 fake cards with the same dimensions as real cards.
// The Tailwind `animate-pulse` class adds a subtle fade animation.
//
// Why same height as real cards?
//   When the real data arrives, the layout doesn't "jump" from short
//   skeletons to tall cards. Prevents layout shift (a real perf metric
//   called CLS — Cumulative Layout Shift).
interface RestaurantListSkeletonProps {
  count?: number;
}

export function RestaurantListSkeleton({
  count = 8,
}: RestaurantListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden pt-0 gap-0">
          {/* Gradient header placeholder */}
          <div className="h-32 animate-pulse bg-muted" />

          {/* Text section placeholder */}
          <div className="space-y-3 p-4">
            {/* Title line */}
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />

            {/* Meta line */}
            <div className="h-4 w-full animate-pulse rounded bg-muted" />

            {/* Rating row */}
            <div className="flex items-center gap-2 pt-1">
              <div className="h-5 w-12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}