// app/restaurants/page.tsx
//
// The /restaurants page.
//
// Reads ?q= from the URL and passes it to useRestaurants.
// Wrapped in <Suspense> because of useSearchParams().

"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  UtensilsCrossed,
  RefreshCw,
  X,
} from "lucide-react";

import { useRestaurants } from "@/hooks/useRestaurants";
import {
  RestaurantList,
  RestaurantListSkeleton,
} from "@/components/restaurant/RestaurantList";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";

// ===========================================================================
// OUTER — Suspense boundary
// ===========================================================================
export default function RestaurantsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RestaurantsContent />
    </Suspense>
  );
}

// ===========================================================================
// INNER — reads ?q= from URL
// ===========================================================================
function RestaurantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const { restaurants, isLoading, error, refetch } = useRestaurants(q);

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  function clearSearch() {
    router.push("/restaurants");
  }

  const isSearching = q.trim().length > 0;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Back + breadcrumb */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="
            inline-flex h-9 w-9 shrink-0 items-center justify-center
            rounded-full border border-zinc-200 bg-white text-foreground
            transition-colors hover:border-primary/40 hover:bg-primary/5
            hover:text-primary cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          "
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Restaurants" },
          ]}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        {isSearching ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Results for &ldquo;{q}&rdquo;
              </h1>
              <button
                type="button"
                onClick={clearSearch}
                className="
                  inline-flex items-center gap-1 rounded-full border
                  border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold
                  text-muted-foreground transition-colors hover:border-zinc-300
                  hover:text-foreground cursor-pointer
                "
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </div>
            {!isLoading && restaurants && (
              <p className="mt-2 text-sm text-muted-foreground">
                {restaurants.length}{" "}
                {restaurants.length === 1 ? "match" : "matches"} · sorted
                by relevance
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Restaurants
            </h1>
            <p className="mt-2 text-muted-foreground">
              Discover delicious food from the best places near you
            </p>
          </>
        )}
      </div>

      {/* Content */}
      {isLoading && <RestaurantListSkeleton />}

      {!isLoading && error && (
        <ErrorState message={error} onRetry={refetch} />
      )}

      {!isLoading && !error && restaurants && restaurants.length === 0 && (
        isSearching ? <NoSearchResults query={q} onClear={clearSearch} /> : <EmptyState />
      )}

      {!isLoading && !error && restaurants && restaurants.length > 0 && (
        <RestaurantList restaurants={restaurants} />
      )}
    </div>
  );
}

// ===========================================================================
// Empty / error states
// ===========================================================================
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">No restaurants yet</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        We&apos;re working on adding great places to order from.
        Check back soon!
      </p>
    </div>
  );
}

function NoSearchResults({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">
        No results for &ldquo;{query}&rdquo;
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Try a different search term, or browse all restaurants.
      </p>
      <Button onClick={onClear} className="mt-6">
        Browse all restaurants
      </Button>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {message}
      </p>
      <Button onClick={onRetry} className="mt-6">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-muted" />
      <RestaurantListSkeleton />
    </div>
  );
}