// components/cart/CartRestaurantHeader.tsx
//
// Upgraded single-row restaurant header for the cart.
// Removed the "card" box styling so it doesn't blend in with cart items.
// Now acts as a clean, flush section header with a bottom divider.

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Utensils } from "lucide-react";

import { resolveImageUrl } from "@/lib/image";
import type { CartRestaurant } from "@/types/cart";

interface CartRestaurantHeaderProps {
  restaurant: CartRestaurant;
}

export function CartRestaurantHeader({
  restaurant,
}: CartRestaurantHeaderProps) {
  // Remember WHICH url failed (not just "failed"), so switching restaurant
  // (clear & add) gets a fresh chance to load its image.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imageUrl = resolveImageUrl(restaurant.image);
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl;

  const meta = [
    restaurant.cuisine_type,
    restaurant.delivery_time > 0 ? `${restaurant.delivery_time} mins` : null,
  ]
    .filter(Boolean)
    .join(" \u2022 ");

  return (
    // Changed from a full rounded-2xl border to a flush layout with a bottom border
    <div className="relative flex items-center gap-4 border-b border-zinc-200/60 pb-4 dark:border-zinc-800/80">
      {/* Restaurant Image */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-black/5 shadow-sm dark:border-white/5">
        {showImage ? (
          <Image
            src={imageUrl!}
            alt={restaurant.name}
            fill
            sizes="56px"
            className="object-cover"
            onError={() => setFailedUrl(imageUrl ?? null)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800/50">
            <Utensils className="h-5 w-5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-primary/80">
          Order From
        </span>
        <h2 className="truncate text-base font-bold tracking-tight text-foreground">
          {restaurant.name}
        </h2>
        {meta && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {meta}
          </p>
        )}
      </div>

      {/* Add items link — Modern soft pill button */}
      <Link
        href={`/restaurants/${restaurant.id}`}
        aria-label={`Add more items from ${restaurant.name}`}
        className="
          group flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-2
          text-xs font-bold text-primary transition-all duration-200
          hover:bg-primary hover:text-primary-foreground
          active:scale-95
        "
      >
        <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
        <span>Add</span>
      </Link>
    </div>
  );
}