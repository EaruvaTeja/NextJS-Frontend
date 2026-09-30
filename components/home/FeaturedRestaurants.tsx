// components/home/FeaturedRestaurants.tsx
//
// Top-rated restaurants — reuses RestaurantList + skeleton.
// Fetches all restaurants via useRestaurants, sorts by rating, takes top 4.

"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { useRestaurants } from "@/hooks/useRestaurants";
import {
  RestaurantList,
  RestaurantListSkeleton,
} from "@/components/restaurant/RestaurantList";

const FEATURED_COUNT = 4;

export function FeaturedRestaurants() {
  const { restaurants, isLoading, error } = useRestaurants();

  // Hide section entirely if error or empty
  if (!isLoading && (error || !restaurants || restaurants.length === 0)) {
    return null;
  }

  const featured = restaurants
    ? [...restaurants]
        .sort((a, b) => Number(b.rating) - Number(a.rating))
        .slice(0, FEATURED_COUNT)
    : [];

  return (
    <section className="container mx-auto px-4 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" />
            Featured
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Top-rated near you
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Handpicked based on customer ratings
          </p>
        </div>

        <Link
          href="/restaurants"
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          See all
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <RestaurantListSkeleton count={FEATURED_COUNT} />
      ) : (
        <RestaurantList restaurants={featured} />
      )}
    </section>
  );
}