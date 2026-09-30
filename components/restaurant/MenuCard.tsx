// components/restaurant/MenuCard.tsx
//
// One menu item row — used inside MenuList's category grids.
//
// Layout: text left, square image right with a floating ADD button
// hanging off the image's bottom edge (classic food-delivery pattern).
//
// Status handling:
//   - Available   -> hover shadow, image zoom, active ADD button
//   - Unavailable -> dimmed card, grayscale image, "Sold out" overlay
//
// Badges (top row):
//   - Veg / non-veg square indicator (Indian standard)
//   - "Bestseller" chip — derived from rating >= 4.2 AND 50+ ratings
//   - Star rating + formatted count
//
// NEW in this upgrade:
//   - Bestseller chip, Sold out overlay, hover zoom, focus-within ring,
//     name -> description -> price reading flow, MenuCardSkeleton export.

"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Flame } from "lucide-react";

import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { resolveImageUrl } from "@/lib/image";
import type { MenuItem } from "@/types/restaurant";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MenuCardProps {
  item: MenuItem;
  /** Load the image eagerly (use for the first items above the fold). */
  priority?: boolean;
}

// ---------------------------------------------------------------------------
// Bestseller rule — shared with MenuList so the section and the chip agree
// ---------------------------------------------------------------------------
const BESTSELLER_MIN_RATING = 4.2;
const BESTSELLER_MIN_COUNT = 50;

function isBestseller(item: MenuItem): boolean {
  return (
    Number(item.rating) >= BESTSELLER_MIN_RATING &&
    item.rating_count >= BESTSELLER_MIN_COUNT
  );
}

// ---------------------------------------------------------------------------
// Veg indicator (Indian standard: green/red square with a dot)
// ---------------------------------------------------------------------------
function VegIndicator({ isVeg }: { isVeg: boolean }) {
  const color = isVeg ? "text-green-700" : "text-red-700";
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border-2 ${color}`}
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
      title={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Rating helpers
// ---------------------------------------------------------------------------
function getRatingTextColor(rating: number): string {
  if (rating >= 4.0) return "text-green-800";
  if (rating >= 3.0) return "text-green-600";
  if (rating >= 2.6) return "text-orange-600";
  if (rating >= 2.0) return "text-yellow-700";
  return "text-red-600";
}

function formatRatingCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M+`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K+`;
  return count.toString();
}

function RatingBadge({ rating, count }: { rating: number; count: number }) {
  if (rating <= 0) return null;
  const colorClass = getRatingTextColor(rating);
  return (
    <div
      className="inline-flex items-center gap-1 text-xs font-semibold"
      title={`${rating.toFixed(1)} out of 5`}
    >
      <Star className={`h-3.5 w-3.5 fill-current ${colorClass}`} />
      <span className={colorClass}>{rating.toFixed(1)}</span>
      {count > 0 && (
        <span className="font-normal text-muted-foreground">
          ({formatRatingCount(count)})
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function MenuCard({ item, priority = false }: MenuCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const priceNum = Number(item.price);
  const ratingNum = Number(item.rating);
  const isAvailable = item.is_available;
  const bestseller = isBestseller(item);

  const imageUrl = resolveImageUrl(item.image);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <Card
      className={`group flex flex-row gap-4 p-4 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
        isAvailable ? "" : "opacity-70"
      }`}
    >
      {/* LEFT: text */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Badge row — veg + bestseller + rating */}
        <div className="flex flex-wrap items-center gap-2">
          <VegIndicator isVeg={item.is_vegetarian} />
          {bestseller && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
              <Flame className="h-3 w-3" aria-hidden="true" />
              Bestseller
            </span>
          )}
          <RatingBadge rating={ratingNum} count={item.rating_count} />
        </div>

        <h3 className="text-base font-semibold leading-tight line-clamp-2">
          {item.name}
        </h3>

        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        <p className="pt-0.5 text-sm font-semibold">
          ₹{priceNum.toFixed(2)}
        </p>
      </div>

      {/* RIGHT: image + floating ADD */}
      <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
        <div
          className={`absolute inset-0 overflow-hidden rounded-lg bg-muted ${
            isAvailable ? "" : "grayscale"
          }`}
        >
          {showImage ? (
            <Image
              src={imageUrl!}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 112px, 128px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200 text-4xl">
              <span aria-hidden="true">🍽️</span>
            </div>
          )}

          {/* Sold out overlay — unmissable but not ugly */}
          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded-sm bg-white/95 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-700">
                Sold out
              </span>
            </div>
          )}
        </div>

        {/* ADD button hangs off the image bottom edge */}
        <div className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2">
          <AddToCartButton menuItemId={item.id} isAvailable={isAvailable} />
        </div>
      </div>

      {/* Spacer so the floating ADD never overlaps the text column */}
      <div className="w-0" aria-hidden="true" />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// MenuCardSkeleton (NEW) — single-card placeholder, extracted so
// MenuListSkeleton can reuse it. Matches real-card dimensions (prevents CLS).
// ---------------------------------------------------------------------------
export function MenuCardSkeleton() {
  return (
    <Card className="flex flex-row gap-4 p-4">
      {/* Text side */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded-sm bg-muted" />
          <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      </div>

      {/* Image side */}
      <div className="h-28 w-28 shrink-0 animate-pulse rounded-lg bg-muted sm:h-32 sm:w-32" />
    </Card>
  );
}