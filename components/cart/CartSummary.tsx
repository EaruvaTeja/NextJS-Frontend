// components/cart/CartSummary.tsx
//
// Right column of the cart page — a single Card containing:
//   1. Special instructions / delivery notes  (top)
//   2. Apply Coupon row
//   3. Bill Details (item total, delivery by km, 18% GST, grand total)
//   4. Proceed to Checkout button
//
// Checkout guard:
//   The button is DISABLED until a delivery address is selected.
//   Below it, a small hint tells the user what's missing.

"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import { useAddress } from "@/hooks/useAddress";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";

import { calculateBill } from "@/lib/bill";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import { CouponDrawer } from "./CouponDrawer";
import { CartSuggestions } from "./CartSuggestions";
import type { Cart } from "@/types/cart";

interface CartSummaryProps {
  cart: Cart;
}

// ---------------------------------------------------------------------------
// Format distance for display:  2.5 -> "2.5 km",  6 -> "6.0 km"
// ---------------------------------------------------------------------------
function formatDistance(km: string | null | undefined): string | null {
  if (!km) return null;
  const n = Number(km);
  if (!Number.isFinite(n) || n < 0) return null;
  return `${n.toFixed(1)} km`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function CartSummary({ cart }: CartSummaryProps) {
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const router = useRouter();
  const { selectedAddress } = useAddress();
  const { isMutating } = useCart();

  // Distance comes from the cart's nested restaurant.
  // If the cart is empty, restaurant is null -> fee defaults to 0.
  const distanceKm = cart.restaurant?.distance_km ?? null;
  const bill = calculateBill(Number(cart.total), distanceKm);

  const distanceLabel = formatDistance(distanceKm);

  const hasAddress = Boolean(selectedAddress);
  const hasUnavailableItems = cart.items.some(
    (i) => i.menu_item.is_available === false
  );
  const canCheckout =
    hasAddress &&
    !hasUnavailableItems &&
    !isMutating &&
    cart.items.length > 0;

  function handleCheckout() {
    if (!hasAddress) {
      toast.error("Please select a delivery address first.");
      return;
    }
    if (hasUnavailableItems) {
      toast.error("Remove unavailable items to continue.");
      return;
    }
    if (isMutating) return;
    router.push("/checkout");
  }

  return (
    <>
      <Card className="p-5 lg:sticky lg:top-24">
        {/* 1. Special instructions */}
        <CartSuggestions />

        {/* Divider */}
        <div className="my-4 border-t" />

        {/* 2. Coupon row */}
        <button
          type="button"
          onClick={() => setIsCouponOpen(true)}
          className="
            flex w-full items-center justify-between rounded-md border
            border-dashed border-primary/40 bg-primary/5 px-3 py-2.5
            text-left transition-colors hover:bg-primary/10 cursor-pointer
          "
        >
          <span className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              Apply Coupon
            </span>
          </span>
          <span className="text-xs font-medium text-primary">
            View all
          </span>
        </button>

        {/* Divider */}
        <div className="my-4 border-t" />

        {/* 3. Bill Details */}
        <h2 className="text-base font-semibold">Bill Details</h2>

        <div className="mt-3 space-y-3 text-sm">
          {/* Item total */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Item Total ({cart.item_count}{" "}
              {cart.item_count === 1 ? "item" : "items"})
            </span>
            <span className="font-medium tabular-nums">
              ₹{formatPrice(bill.itemTotal)}
            </span>
          </div>

          {/* Delivery fee — distance-aware label */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-muted-foreground">
              <span>
                Delivery Fee{distanceLabel ? ` · ${distanceLabel}` : ""}
              </span>
              <InfoTooltip
                text={
                  distanceLabel
                    ? `Delivery charge for ${distanceLabel} based on the distance from the restaurant.`
                    : "Charged by the delivery partner for bringing your order."
                }
              />
            </span>
            <span className="font-medium tabular-nums">
              ₹{formatPrice(bill.deliveryFee)}
            </span>
          </div>

          {/* GST */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-muted-foreground">
              <span>GST (18%)</span>
              <InfoTooltip text="Government tax on food items (18%) as per Indian regulations." />
            </span>
            <span className="font-medium tabular-nums">
              ₹{formatPrice(bill.gst)}
            </span>
          </div>

          {/* Grand total */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between text-base font-bold">
              <span>To Pay</span>
              <span className="tabular-nums">
                ₹{formatPrice(bill.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Checkout button */}
        <Button
          className="mt-5 w-full"
          size="lg"
          onClick={handleCheckout}
          disabled={!canCheckout}
        >
          Proceed to Checkout
        </Button>

        {!hasAddress ? (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Select a delivery address above to continue
          </p>
        ) : hasUnavailableItems ? (
          <p className="mt-2 text-center text-[11px] font-medium text-red-600">
            Remove unavailable items to continue
          </p>
        ) : null}
      </Card>

      {/* Coupon drawer */}
      <CouponDrawer open={isCouponOpen} onOpenChange={setIsCouponOpen} />
    </>
  );
}