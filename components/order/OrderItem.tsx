// components/order/OrderItem.tsx
//
// One line item inside an order. Read-only.
//
// Differences from CartItem:
//   - No stepper (order is final — quantity is locked)
//   - No note editor (note is a snapshot — cannot be changed)
//   - Uses the SNAPSHOT price from OrderItem.price (not live menu price)
//
// Layout:
//   [IMG]  🟢 Name                              ₹subtotal
//          ₹price × qty
//          " note"  (only if present)

"use client";

import Image from "next/image";
import { Quote } from "lucide-react";

import { resolveImageUrl } from "@/lib/image";
import type { OrderItem as OrderItemType } from "@/types/order";

interface OrderItemProps {
  item: OrderItemType;
}

// ---------------------------------------------------------------------------
// Veg indicator (same visual as elsewhere)
// ---------------------------------------------------------------------------
function VegIndicator({ isVeg }: { isVeg: boolean }) {
  const color = isVeg ? "text-green-700" : "text-red-700";
  return (
    <span
      className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] ${color}`}
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
    </span>
  );
}

// Remove ".00" from whole numbers for a cleaner look
function formatPrice(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function OrderItem({ item }: OrderItemProps) {
  const priceNum = Number(item.price);
  const subtotalNum = Number(item.subtotal);
  const imageUrl = resolveImageUrl(item.menu_item.image);

  return (
    <div className="flex gap-3 py-3">
      {/* Image */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.menu_item.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200 text-lg">
            <span aria-hidden="true">🍽️</span>
          </div>
        )}
      </div>

      {/* Middle — name, price, note */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <VegIndicator isVeg={item.menu_item.is_vegetarian} />
          <h3 className="truncate text-sm font-semibold leading-tight">
            {item.menu_item.name}
          </h3>
        </div>

        <p className="text-[11px] font-medium text-muted-foreground">
          ₹{formatPrice(priceNum)} × {item.quantity}
        </p>

        {item.special_instructions && (
          <p className="flex items-start gap-1 text-[11px] italic text-muted-foreground">
            <Quote className="mt-0.5 h-2.5 w-2.5 shrink-0" />
            <span className="line-clamp-2">{item.special_instructions}</span>
          </p>
        )}
      </div>

      {/* Right — subtotal */}
      <div className="flex shrink-0 items-start pt-0.5">
        <p className="text-sm font-bold tabular-nums">
          ₹{formatPrice(subtotalNum)}
        </p>
      </div>
    </div>
  );
}