// components/restaurant/RestaurantHeader.tsx
//
// Hero header for the restaurant detail page.
//
// Banner strategy:
//   - If restaurant.image exists and loads -> show the photo
//   - Otherwise -> gradient + cuisine emoji fallback
//
// Info card layout:
//   Line 1: {cuisine_type} • {distance} km away • {delivery_time} min delivery
//   Line 2: 📍 {address}
//   Line 3: description (if any)
//   Stats row (border-top): rating pill + Open now / Closed

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Star,
  MapPin,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { resolveImageUrl } from "@/lib/image";
import type { Restaurant } from "@/types/restaurant";

interface RestaurantHeaderProps {
  restaurant: Restaurant;
}

// ---------------------------------------------------------------------------
// Cuisine → visual style map (fallback)
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
// Rating → pill background color
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
export function RestaurantHeader({ restaurant }: RestaurantHeaderProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const style = getCuisineStyle(restaurant.cuisine_type);
  const ratingNum = Number(restaurant.rating);
  const isActive = restaurant.is_active;

  const imageUrl = resolveImageUrl(restaurant.image);
  const showImage = Boolean(imageUrl) && !imageFailed;
  const distanceLabel = formatDistance(restaurant.distance_km);

  return (
    <div className="relative">
      {/* -------------------------------------------------------------- */}
      {/* Banner                                                          */}
      {/* -------------------------------------------------------------- */}
      <div
        className={`relative flex h-56 items-center justify-center sm:h-64 ${
          showImage ? "bg-muted" : `bg-gradient-to-br ${style.gradient}`
        }`}
      >
        {showImage ? (
          <Image
            src={imageUrl!}
            alt={restaurant.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span
            className="text-8xl drop-shadow-md sm:text-9xl"
            aria-hidden="true"
          >
            {style.emoji}
          </span>
        )}

        {/* Dark gradient overlay — improves contrast for the back button */}
        {showImage && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/10 pointer-events-none" />
        )}

        {/* Closed stamp overlay — subtle but clear signal */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <span className="rotate-[-8deg] rounded-lg border-4 border-white/90 bg-black/70 px-6 py-3 text-2xl font-bold uppercase tracking-widest text-white shadow-lg sm:text-3xl">
              Closed
            </span>
          </div>
        )}

        {/* Back button — top left */}
        <Link
          href="/restaurants"
          className="
            absolute left-4 top-4 z-20
            flex h-10 w-10 items-center justify-center
            rounded-full bg-white/95 text-foreground shadow-md backdrop-blur-sm
            transition-transform hover:scale-105
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white
          "
          aria-label="Back to restaurants"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* Info card — pulled up over the banner                           */}
      {/* -------------------------------------------------------------- */}
      <div className="container mx-auto max-w-4xl px-4">
        <Card className="-mt-12 relative z-10 p-6 sm:-mt-16 sm:p-8">
          {/* Name */}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {restaurant.name}
          </h1>

          {/* Meta line 1 — cuisine • distance • delivery time */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {restaurant.cuisine_type}
            </span>
            <span aria-hidden="true">•</span>
            <span>{distanceLabel} away</span>
            <span aria-hidden="true">•</span>
            <span
              className={isActive ? "" : "opacity-60"}
            >
              {restaurant.delivery_time} min delivery
            </span>
          </div>

          {/* Meta line 2 — address */}
          <div className="mt-0 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>{restaurant.address}</span>
          </div>

          {/* Description */}
          {restaurant.description && (
            <p className="mt-0 text-sm text-muted-foreground line-clamp-2">
              {restaurant.description}
            </p>
          )}

          {/* Stats row — rating + open/closed status */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
            {/* Rating pill — color scales with value */}
            <div
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-semibold text-white ${getRatingColor(
                ratingNum
              )}`}
            >
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{ratingNum.toFixed(1)}</span>
            </div>

            {/* Status — Open now (green) or Closed (red) */}
            {isActive ? (
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Open now</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                <XCircle className="h-4 w-4" />
                <span>Closed</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
