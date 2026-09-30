// components/order/OrderCard.tsx
//
// Summary card for the /orders list page.
//
// Layout:
//   Row 1   — image | restaurant + order # + date | status badge
//   Divider — dotted line
//   Row 2   — items list (left) + "Total Paid: ₹X" (right, bottom-aligned)
//   Row 3   — [Reorder] (left, conditional) ... View details → (right)
//
// Reorder is shown only when the order is in a "finalized" state:
// delivered / cancelled / payment_failed.
// Clicking Reorder navigates to the restaurant's menu page.

"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, Package, RotateCcw } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/lib/image";
import type { Order, OrderStatus } from "@/types/order";

interface OrderCardProps {
  order: Order;
}

// ---------------------------------------------------------------------------
// Statuses that allow reordering
// ---------------------------------------------------------------------------
const REORDER_STATUSES: OrderStatus[] = [
  "delivered",
  "cancelled",
  "payment_failed",
];

// ---------------------------------------------------------------------------
// Status → badge classes + label
// ---------------------------------------------------------------------------
interface StatusStyle {
  classes: string;
  label: string;
  dotColor: string;
}

function getStatusStyle(status: OrderStatus): StatusStyle {
  switch (status) {
    case "delivered":
      return {
        classes: "bg-green-50 text-green-700 border-green-200",
        label: "Delivered",
        dotColor: "bg-green-600",
      };
    case "cancelled":
      return {
        classes: "bg-zinc-50 text-zinc-600 border-zinc-200",
        label: "Cancelled",
        dotColor: "bg-zinc-500",
      };
    case "payment_failed":
      return {
        classes: "bg-red-50 text-red-700 border-red-200",
        label: "Payment failed",
        dotColor: "bg-red-600",
      };
    case "out_for_delivery":
      return {
        classes: "bg-blue-50 text-blue-700 border-blue-200",
        label: "On the way",
        dotColor: "bg-blue-600",
      };
    case "preparing":
    case "confirmed":
      return {
        classes: "bg-amber-50 text-amber-700 border-amber-200",
        label: status === "preparing" ? "Preparing" : "Confirmed",
        dotColor: "bg-amber-600",
      };
    case "pending":
    case "awaiting_payment":
      return {
        classes: "bg-orange-50 text-orange-700 border-orange-200",
        label: status === "pending" ? "Placed" : "Awaiting payment",
        dotColor: "bg-orange-500",
      };
    default:
      return {
        classes: "bg-zinc-50 text-zinc-600 border-zinc-200",
        label: status,
        dotColor: "bg-zinc-500",
      };
  }
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------
function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "short" });
  const time = d.toLocaleString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${day} ${month} · ${time}`;
}

// ---------------------------------------------------------------------------
// Amount formatting — remove ".00" on whole numbers
// ---------------------------------------------------------------------------
function formatAmount(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const statusStyle = getStatusStyle(order.status);
  const totalNum = Number(order.total_amount);

  // Should we show the Reorder button?
  const canReorder = REORDER_STATUSES.includes(order.status);

  // First item with an image as visual anchor
  const firstWithImage =
    order.items.find((i) => i.menu_item.image) ?? order.items[0];
  const imageUrl = resolveImageUrl(firstWithImage?.menu_item.image ?? null);

  // Show up to 3 items
  const MAX_VISIBLE = 3;
  const visibleItems = order.items.slice(0, MAX_VISIBLE);
  const remainingCount = order.items.length - MAX_VISIBLE;

  // Reorder → go to the restaurant menu
  // preventDefault stops the parent <Link> from also navigating.
  function handleReorder(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/restaurants/${order.restaurant.id}`);
  }

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl"
    >
      <Card className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5">
        {/* ============================================================ */}
        {/* Row 1 — restaurant info                                       */}
        {/* ============================================================ */}
        <div className="flex items-start gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={order.restaurant.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200">
                <Package
                  className="h-5 w-5 text-amber-700/60"
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold leading-tight sm:text-base">
              {order.restaurant.name}
            </h3>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Order #{order.id}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatOrderDate(order.created_at)}
            </p>
          </div>

          <div className="shrink-0">
            <span
              className={`
                inline-flex items-center gap-1 rounded-full border
                px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide
                ${statusStyle.classes}
              `}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotColor}`}
              />
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Dotted divider                                                */}
        {/* ============================================================ */}
        <div className="my-3.5 border-t border-dashed border-zinc-200" />

        {/* ============================================================ */}
        {/* Row 2 — items + total                                         */}
        {/* ============================================================ */}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="flex items-baseline gap-1 text-xs"
              >
                <span className="truncate text-muted-foreground">
                  {item.menu_item.name}
                </span>
                <span className="shrink-0 font-medium text-muted-foreground">
                  × {item.quantity}
                </span>
              </div>
            ))}

            {remainingCount > 0 && (
              <p className="pt-0.5 text-[11px] italic text-muted-foreground">
                + {remainingCount} more item
                {remainingCount > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] font-medium text-muted-foreground">
              Total Paid:
              <span className="ml-1.5 text-sm font-bold text-foreground tabular-nums">
                ₹{formatAmount(totalNum)}
              </span>
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Row 3 — actions                                               */}
        {/* ============================================================ */}
        <div className="mt-3 flex items-center justify-between gap-3">
          {/* Left: Reorder button (only for finalized orders) */}
          {canReorder ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleReorder}
              className="
                h-8 gap-1.5 rounded-full border-primary/40 px-3
                text-xs font-semibold text-primary
                transition-all hover:border-primary hover:bg-primary/5
              "
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reorder
            </Button>
          ) : (
            // Empty spacer so "View details" stays right-aligned
            <div aria-hidden="true" />
          )}

          {/* Right: View details link */}
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary transition-transform group-hover:translate-x-0.5">
            View details
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </Card>
    </Link>
  );
}