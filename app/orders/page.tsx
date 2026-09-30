// app/orders/page.tsx
//
// Order history page.
//
// Route: /orders
// Uses:
//   - useOrders() hook
//   - <OrderList />          -> stacked cards
//   - <OrderListSkeleton />  -> loading placeholder
//   - <OrderEmptyState />    -> no orders
//
// Four states:
//   1. Loading  -> skeleton
//   2. Error    -> message + retry
//   3. Empty    -> CTA to browse
//   4. Success  -> list

"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { useOrders } from "@/hooks/useOrders";
import {
  OrderList,
  OrderListSkeleton,
  OrderEmptyState,
} from "@/components/order/OrderList";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
  const { orders, isLoading, error, refetch } = useOrders({
  pollMs: 20000, // poll every 20s
});

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "My Orders" },
        ]}
      />

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          My Orders
        </h1>
        {orders && orders.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {orders.length} order{orders.length === 1 ? "" : "s"} · most
            recent first
          </p>
        )}
      </div>

      {/* States */}
      {isLoading && <OrderListSkeleton />}

      {!isLoading && error && (
        <ErrorState message={error} onRetry={refetch} />
      )}

      {!isLoading && !error && orders && orders.length === 0 && (
        <OrderEmptyState />
      )}

      {!isLoading && !error && orders && orders.length > 0 && (
        <OrderList orders={orders} />
      )}
    </div>
  );
}

// ===========================================================================
// ErrorState
// ===========================================================================
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
      <h2 className="mt-4 text-xl font-semibold">
        Couldn&apos;t load your orders
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