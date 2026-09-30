// app/cart/page.tsx
//
// The /cart page.
//
// Layout (desktop):
//   [Breadcrumb]
//   [Title + item count]
//   ┌──────────────────────────┬─────────────────┐
//   │ RestaurantHeader         │                 │
//   │ CartList                 │ Bill Details    │
//   │ CartSuggestions          │ (sticky right)  │
//   │ CouponInput              │                 │
//   └──────────────────────────┴─────────────────┘
//
// Mobile: stacked (items first, summary below).
//
// States handled:
//   1. Loading  -> skeleton
//   2. Error    -> error card with retry
//   3. Empty    -> CartEmptyState
//   4. Success  -> full layout

"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import {
  CartList,
  CartEmptyState,
  CartSignedOutState,
} from "@/components/cart/CartList";
import { CartSummary } from "@/components/cart/CartSummary";
import { CartRestaurantHeader } from "@/components/cart/CartRestaurantHeader";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddressPicker } from "@/components/address/AddressPicker";

export default function CartPage() {
  const { cart, isLoading, error, refresh } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Cart" },
        ]}
      />

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Your Cart
        </h1>
        {cart && cart.item_count > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {cart.item_count}{" "}
            {cart.item_count === 1 ? "item" : "items"} ready to order
          </p>
        )}
      </div>

      {/* States */}
      {isLoading && <CartSkeleton />}

      {/* Guest: without this the page is blank */}
      {!isLoading && !isAuthenticated && <CartSignedOutState />}

      {!isLoading && isAuthenticated && error && !cart && (
        <ErrorState message={error} onRetry={refresh} />
      )}

      {!isLoading && isAuthenticated && cart && cart.items.length === 0 && (
        <CartEmptyState />
      )}

      {!isLoading && isAuthenticated && cart && cart.items.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="space-y-4 lg:col-span-2">
            {cart.restaurant && (
              <CartRestaurantHeader restaurant={cart.restaurant} />
            )}

            <CartList items={cart.items} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4 lg:col-span-1">
            <AddressPicker />
            <CartSummary cart={cart} />
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Skeleton
// ===========================================================================
function CartSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      role="status"
      aria-busy="true"
      aria-label="Loading your cart"
    >
      <div className="space-y-4 lg:col-span-2">
        {/* Restaurant header skeleton (flush, like the real header) */}
        <div className="flex items-center gap-4 border-b pb-4">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
        </div>

        {/* Item skeletons */}
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex flex-col items-end justify-between gap-2">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-9 w-24 animate-pulse rounded bg-muted" />
            </div>
          </Card>
        ))}

        {/* Suggestions skeleton */}
        <Card className="p-4">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-20 w-full animate-pulse rounded bg-muted" />
        </Card>
      </div>

      {/* Summary skeleton */}
      <div className="lg:col-span-1">
        <Card className="p-5">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-6 w-full animate-pulse rounded bg-muted" />
            <div className="h-11 w-full animate-pulse rounded bg-muted" />
          </div>
        </Card>
      </div>
      <span className="sr-only">Loading your cart…</span>
    </div>
  );
}

// ===========================================================================
// Error state
// ===========================================================================
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div 
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 py-16 px-6 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">
        Couldn&apos;t load your cart
      </h2>
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