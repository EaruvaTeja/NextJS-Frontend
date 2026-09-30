// components/restaurant/RestaurantCard.tsx
//
// One restaurant card — used on the /restaurants list page.
//
// Image strategy:
//   - If restaurant.image exists and loads -> show the photo
//   - Otherwise -> gradient + cuisine emoji fallback
//
// Status handling:
//   - Active   -> "• 2.5 km" in muted text
//   - Inactive -> "• Currently closed" in red + dimmed card + "Closed" badge on image
//
// Interactions:
//   - Hover: card lifts + image zooms (pure CSS, zero JS cost)
//   - Favorite heart: local-state toggle (swap for an API call later)
//   - Stretched-link pattern: ONE tab stop for the whole card + a separate
//     stop for the heart. Avoids invalid nested <a><button> HTML.
//
// Priority prop:
//   Pass `priority={true}` for cards above the fold. That tells Next.js
//   to load the image eagerly (instead of lazily) so it becomes the LCP
//   quickly and avoids the "add loading=eager" warning.

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, XCircle, Heart } from "lucide-react";

import { Card } from "@/components/ui/card";
import { resolveImageUrl } from "@/lib/image";
import type { Restaurant } from "@/types/restaurant";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface RestaurantCardProps {
  restaurant: Restaurant;
  /**
   * Load the image eagerly (use for the first ~4 cards above the fold).
   * Defaults to lazy loading.
   */
  priority?: boolean;
}

// ---------------------------------------------------------------------------
// Cuisine -> visual style map (used for the fallback only)
// ---------------------------------------------------------------------------
interface CuisineStyle {
  gradient: string;
  emoji: string;
}

const CUISINE_STYLES: Record<string, CuisineStyle> = {
  indian: { gradient: "from-orange-400 to-red-500", emoji: "🍛" },
  italian: { gradient: "from-red-400 to-green-500", emoji: "🍕" },
  chinese: { gradient: "from-red-500 to-yellow-500", emoji: "🥡" },
  mexican: { gradient: "from-yellow-400 to-red-500", emoji: "🌮" },
  japanese: { gradient: "from-pink-400 to-red-500", emoji: "🍣" },
  american: { gradient: "from-blue-400 to-red-500", emoji: "🍔" },
  thai: { gradient: "from-purple-400 to-pink-500", emoji: "🍜" },
  continental: { gradient: "from-slate-400 to-slate-600", emoji: "🍽️" },
};

const DEFAULT_STYLE: CuisineStyle = {
  gradient: "from-slate-400 to-slate-600",
  emoji: "🍽️",
};

function getCuisineStyle(cuisineType: string): CuisineStyle {
  const key = cuisineType.toLowerCase().trim();
  return CUISINE_STYLES[key] ?? DEFAULT_STYLE;
}

// ---------------------------------------------------------------------------
// Rating pill color — scales with the rating value
// ---------------------------------------------------------------------------
function getRatingColor(rating: number): string {
  if (rating >= 4) return "bg-green-600";
  if (rating >= 3) return "bg-amber-500";
  return "bg-red-600";
}

// ---------------------------------------------------------------------------
// Distance formatter:  "2.50" -> "2.5 km"
// ---------------------------------------------------------------------------
function formatDistance(km: string | number | null | undefined): string {
  const n = Number(km);
  if (!Number.isFinite(n) || n < 0) return "—";
  return `${n.toFixed(1)} km`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RestaurantCard({
  restaurant,
  priority = false,
}: RestaurantCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const style = getCuisineStyle(restaurant.cuisine_type);
  const ratingNum = Number(restaurant.rating);
  const isActive = restaurant.is_active;

  const imageUrl = resolveImageUrl(restaurant.image);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <div className="group relative rounded-xl">
      <Card
        className={`cursor-pointer overflow-hidden pt-0 gap-0 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg ${
          isActive ? "" : "opacity-90"
        }`}
      >
        {/* ------------------------------------------------------------ */}
        {/* Header — image OR gradient + emoji fallback                  */}
        {/* ------------------------------------------------------------ */}
        <div
          className={`relative flex h-32 items-center justify-center ${
            showImage ? "bg-muted" : `bg-gradient-to-br ${style.gradient}`
          }`}
        >
          {showImage ? (
            <Image
              src={imageUrl!}
              alt={restaurant.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                isActive ? "" : "grayscale"
              }`}
              priority={priority}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span
              className="text-6xl drop-shadow-md transition-transform duration-300 group-hover:scale-110"
              aria-hidden="true"
            >
              {style.emoji}
            </span>
          )}

          {/* Closed overlay — dims the image/gradient */}
          {!isActive && (
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          )}

          {/* Delivery time badge — top right */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
            <Clock className="h-3 w-3" />
            <span>{restaurant.delivery_time} min</span>
          </div>

          {/* Closed badge — bottom left, only when inactive */}
          {!isActive && (
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <XCircle className="h-3 w-3" />
              <span>Closed</span>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------ */}
        {/* Text section                                                  */}
        {/* ------------------------------------------------------------ */}
        <div className="space-y-2 p-4">
          <h3 className="text-lg font-semibold leading-tight line-clamp-1">
            {restaurant.name}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-1">
            {restaurant.cuisine_type} • {restaurant.address}
          </p>

          <div className="flex items-center gap-3 pt-1">
            {/* Rating pill — color scales with value */}
            <div
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-white ${getRatingColor(
                ratingNum
              )}`}
            >
              <Star className="h-3 w-3 fill-current" />
              <span>{ratingNum.toFixed(1)}</span>
            </div>

            {/* Status — Distance (active) vs Closed (inactive) */}
            {isActive ? (
              <span className="text-xs text-muted-foreground">
                • {formatDistance(restaurant.distance_km)}
              </span>
            ) : (
              <span className="text-xs font-medium text-red-600">
                • Currently closed
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Stretched link — covers the whole card, sits UNDER the buttons */}
      <Link
        href={`/restaurants/${restaurant.id}`}
        aria-label={`View ${restaurant.name}`}
        className="absolute inset-0 z-10 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />

      {/* Favorite button — z-20 so it stays clickable above the link */}
      <button
        type="button"
        onClick={() => setIsFavorite((v) => !v)}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite
            ? `Remove ${restaurant.name} from favorites`
            : `Save ${restaurant.name} to favorites`
        }
        className="absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm backdrop-blur-sm transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isFavorite ? "fill-red-500 text-red-500" : ""
          }`}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RestaurantCardSkeleton — single-card placeholder for the loading state.
// ---------------------------------------------------------------------------
export function RestaurantCardSkeleton() {
  return (
    <Card className="overflow-hidden pt-0 gap-0">
      {/* Image placeholder */}
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
  );
}