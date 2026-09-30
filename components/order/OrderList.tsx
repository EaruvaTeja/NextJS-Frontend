// components/order/OrderList.tsx
//
// Stacked list of OrderCards + a matching skeleton + empty state.
//
// Three exports:
//   OrderList           — the real list
//   OrderListSkeleton   — loading placeholder (matches card dimensions)
//   OrderEmptyState     — shown when the user has no orders yet

import Link from "next/link";
import { Package } from "lucide-react";

import { OrderCard } from "./OrderCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Order } from "@/types/order";

// ---------------------------------------------------------------------------
// OrderList — the real list
// ---------------------------------------------------------------------------
interface OrderListProps {
  orders: Order[];
}

export function OrderList({ orders }: OrderListProps) {
  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OrderListSkeleton — loading placeholder
// ---------------------------------------------------------------------------
interface OrderListSkeletonProps {
  count?: number;
}

export function OrderListSkeleton({ count = 4 }: OrderListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex items-center gap-3 p-3 sm:p-4">
          {/* Image placeholder */}
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-muted sm:h-20 sm:w-20" />

          {/* Content skeleton */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="mt-2 h-3 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-2 flex items-center justify-between">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-12 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OrderEmptyState — shown when there are no orders
// ---------------------------------------------------------------------------
export function OrderEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Package className="h-9 w-9 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">No orders yet</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        You haven&apos;t placed any orders yet. Once you do, they&apos;ll
        show up here for easy reordering.
      </p>
      <Button
        className="mt-6"
        nativeButton={false}
        render={<Link href="/restaurants" />}
      >
        Browse restaurants
      </Button>
    </div>
  );
}