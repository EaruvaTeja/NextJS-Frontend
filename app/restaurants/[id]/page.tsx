// app/restaurants/[id]/page.tsx
//
// The /restaurants/<id> page — restaurant detail with menu.
//
// Route pattern: /restaurants/[id]  -> dynamic segment
// Example:       /restaurants/5     -> id = "5"
//
// Structure:
//   1. <RestaurantDetailPage />         -- parses + validates the id
//   2. <RestaurantDetailContent id={x}> -- uses hooks, renders the UI
//
// Why two components?
//   React requires hooks to be called unconditionally, in the same order,
//   on every render. If we returned early for an invalid id BEFORE calling
//   the hooks, React would complain. So we validate in the outer component
//   and delegate to an inner component that safely calls the hooks.

"use client";

import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

import { useRestaurant, useRestaurantMenu } from "@/hooks/useRestaurants";
import { RestaurantHeader } from "@/components/restaurant/RestaurantHeader";
import { MenuList } from "@/components/restaurant/MenuList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ===========================================================================
// OUTER COMPONENT — validates the id, delegates to inner
// ===========================================================================
export default function RestaurantDetailPage() {
  const params = useParams();
  const restaurantId = parseRestaurantId(params?.id);

  if (restaurantId === null) {
    return <InvalidIdPage />;
  }

  return <RestaurantDetailContent restaurantId={restaurantId} />;
}

// ===========================================================================
// INNER COMPONENT — safe to call hooks here (id is always a valid number)
// ===========================================================================
function RestaurantDetailContent({ restaurantId }: { restaurantId: number }) {
  const {
    restaurant,
    isLoading: restaurantLoading,
    error: restaurantError,
    refetch: refetchRestaurant,
  } = useRestaurant(restaurantId);

  const {
    menuItems,
    isLoading: menuLoading,
    error: menuError,
    refetch: refetchMenu,
  } = useRestaurantMenu(restaurantId);

return (
  <div className="pb-12">
    {/* ------------------------------------------------------------ */}
    {/* Breadcrumb — only when we have the restaurant name            */}
    {/* ------------------------------------------------------------ */}
    {!restaurantLoading && restaurant && (
      <div className="container mx-auto max-w-4xl px-4 pt-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Restaurants", href: "/restaurants" },
            { label: restaurant.name }, // current page
          ]}
        />
      </div>
    )}

    {/* ------------------------------------------------------------ */}
    {/* HEADER SECTION                                                */}
    {/* ------------------------------------------------------------ */}
    {restaurantLoading && <HeaderSkeleton />}

    {!restaurantLoading && restaurantError && (
      <ErrorState
        title="Couldn't load restaurant"
        message={restaurantError}
        onRetry={refetchRestaurant}
      />
    )}

    {!restaurantLoading && restaurant && (
      <RestaurantHeader restaurant={restaurant} />
    )}

    {/* ------------------------------------------------------------ */}
    {/* MENU SECTION — only renders when the restaurant loaded         */}
    {/* ------------------------------------------------------------ */}
    {restaurant && (
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mt-10">
          <h2 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl">
            Menu
          </h2>

          {menuLoading && <MenuSkeleton />}

          {!menuLoading && menuError && (
            <ErrorState
              title="Couldn't load menu"
              message={menuError}
              onRetry={refetchMenu}
            />
          )}

          {!menuLoading && menuItems && <MenuList items={menuItems} />}
        </div>
      </div>
    )}
  </div>
);
}

// ===========================================================================
// HELPERS
// ===========================================================================

/**
 * Parse and validate the id from useParams().
 * Returns null when the id is missing, non-numeric, or not a positive integer.
 */
function parseRestaurantId(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

// ===========================================================================
// InvalidIdPage — shown when the URL has a bad id (e.g., /restaurants/abc)
// ===========================================================================
function InvalidIdPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Invalid restaurant</h1>
          <p className="text-sm text-muted-foreground">
            The restaurant id in the URL is not valid.
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/restaurants" />}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to restaurants
        </Button>
      </Card>
    </div>
  );
}

// ===========================================================================
// ErrorState — generic error card with retry
// ===========================================================================
interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
}

function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="max-w-md text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/restaurants" />}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ===========================================================================
// HeaderSkeleton — placeholder while restaurant loads
// ===========================================================================
function HeaderSkeleton() {
  return (
    <div>
      {/* Banner placeholder */}
      <div className="h-56 animate-pulse bg-muted sm:h-64" />

      {/* Info card placeholder — overlaps the banner like the real header */}
      <div className="container mx-auto max-w-4xl px-4">
        <Card className="-mt-12 relative z-10 p-6 sm:-mt-16 sm:p-8">
          <div className="space-y-3">
            <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="flex gap-3 pt-3">
              <div className="h-6 w-16 animate-pulse rounded bg-muted" />
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ===========================================================================
// MenuSkeleton — placeholder while menu loads
// ===========================================================================
function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="flex flex-row gap-4 p-4">
          {/* Left text placeholder */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-6 animate-pulse rounded bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </div>

          {/* Right image placeholder */}
          <div className="h-28 w-28 shrink-0 animate-pulse rounded-md bg-muted sm:h-32 sm:w-32" />
        </Card>
      ))}
    </div>
  );
}
