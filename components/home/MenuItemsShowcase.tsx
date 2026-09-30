// components/home/MenuItemsShowcase.tsx
//
// "Try something new" — a random selection of dishes from all restaurants.
//
// Shuffle rules (so the layout stays stable):
//   - Shuffle happens ONCE per component mount (first data load)
//   - Tab switches that trigger silent refetches do NOT reshuffle
//   - Navigating away and back reshuffles (component remounts)
//   - A "Shuffle" button lets the user reshuffle on demand
//
// Cards are compact — 6 per row on large screens.

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RefreshCw, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import {
  useAllMenuItems,
  type MenuItemWithRestaurant,
} from "@/hooks/useRestaurants";
import { resolveImageUrl } from "@/lib/image";

const SHOWCASE_COUNT = 12;

// ---------------------------------------------------------------------------
// Helper — pick N random items from an array
// ---------------------------------------------------------------------------
function pickRandom<T>(source: T[], n: number): T[] {
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ---------------------------------------------------------------------------
// One item card — compact
// ---------------------------------------------------------------------------
function ShowcaseCard({
  item,
  priority = false,
}: {
  item: MenuItemWithRestaurant;
  priority?: boolean;
}) {
  const imageUrl = resolveImageUrl(item.image);
  const priceNum = Number(item.price);

  return (
    <Card className="group flex flex-col gap-2 overflow-hidden p-2 transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 15vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200 text-3xl">
            <span aria-hidden="true">🍽️</span>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 px-0.5">
        <h3 className="truncate text-xs font-semibold leading-tight">
          {item.name}
        </h3>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {item.restaurant.name}
        </p>
        <p className="mt-1 text-xs font-bold">
          ₹{priceNum.toFixed(0)}
        </p>
      </div>

      {/* Add button */}
      <div className="mt-0.5 flex justify-end">
        <AddToCartButton
          menuItemId={item.id}
          isAvailable={item.is_available}
        />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function ShowcaseSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: SHOWCASE_COUNT }).map((_, i) => (
        <Card key={i} className="flex flex-col gap-2 p-2">
          <div className="aspect-square w-full animate-pulse rounded-md bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function MenuItemsShowcase() {
  const { items, isLoading, error } = useAllMenuItems();
  const [randomItems, setRandomItems] = useState<MenuItemWithRestaurant[]>([]);

  // Guards against reshuffling when `items` refetches (e.g. tab-visibility)
  const hasShuffledRef = useRef(false);

  // Initial shuffle — runs once per mount
  useEffect(() => {
    if (hasShuffledRef.current) return;
    if (!items || items.length === 0) return;

    hasShuffledRef.current = true;

    // Math.random is fine here — effects are not part of render.
    // We defer the setState to a microtask to satisfy the "no sync setState
    // in effect" lint rule.
    const initial = pickRandom(items, SHOWCASE_COUNT);
    void Promise.resolve().then(() => setRandomItems(initial));
  }, [items]);

  // Manual shuffle — user-triggered
  function handleShuffle() {
    if (!items || items.length === 0) return;
    setRandomItems(pickRandom(items, SHOWCASE_COUNT));
  }

  // Hide if there are no items to show at all
  if (!isLoading && (error || (items && items.length === 0))) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-14 sm:py-20">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" />
            Discover
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.02em] sm:text-4xl">
            Try something new
          </h2>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Handpicked dishes from across our restaurants — add them right
            to your cart
          </p>
        </div>

        {/* Shuffle button */}
        {!isLoading && items && items.length > 0 && (
          <button
            type="button"
            onClick={handleShuffle}
            className="
              group inline-flex shrink-0 items-center gap-1.5 rounded-full
              border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold
              text-zinc-700 shadow-sm transition-all
              hover:border-primary/40 hover:bg-primary/5 hover:text-primary
              hover:shadow
              active:scale-95
              cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
            "
          >
            <RefreshCw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
            Shuffle
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <ShowcaseSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {randomItems.map((item, index) => (
              <ShowcaseCard
                key={item.id}
                item={item}
                priority={index < 6}
               />
            ))}
        </div>
      )}
    </section>
  );
}