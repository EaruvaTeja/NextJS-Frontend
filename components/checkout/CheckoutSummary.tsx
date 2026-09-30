// components/checkout/CheckoutSummary.tsx
//
// Right column of the checkout page.
//
// Contents:
//   - Bill breakdown (item total, delivery by km, 18% GST, grand total)
//   - Pay button (RazorpayCheckout)
//   - Trust line ("Secured by Razorpay")
//
// The onDismiss prop is forwarded to RazorpayCheckout so the parent
// page can navigate when the user closes the Razorpay modal.

"use client";

import { ShieldCheck } from "lucide-react";

import { calculateBill } from "@/lib/bill";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import { RazorpayCheckout } from "@/components/payment/RazorpayCheckout";
import type { Cart } from "@/types/cart";

interface CheckoutSummaryProps {
  cart: Cart;
  createOrderParams: {
    delivery_address: string;
    notes?: string;
  };
  onSuccess: (orderId: number) => void;
  onFailure: (error: string, orderId?: number) => void;
  /** Called when the Razorpay modal closes without payment. */
  onDismiss?: (orderId: number) => void;
  disabled?: boolean;
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

export function CheckoutSummary({
  cart,
  createOrderParams,
  onSuccess,
  onFailure,
  onDismiss,
  disabled = false,
}: CheckoutSummaryProps) {
  // Distance comes from the cart's nested restaurant.
  const distanceKm = cart.restaurant?.distance_km ?? null;
  const bill = calculateBill(Number(cart.total), distanceKm);
  const distanceLabel = formatDistance(distanceKm);

  return (
    <Card className="p-5 lg:sticky lg:top-24">
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

      {/* Pay button */}
      <div className="mt-5">
        <RazorpayCheckout
          params={{ createOrder: createOrderParams }}
          onSuccess={onSuccess}
          onFailure={onFailure}
          onDismiss={onDismiss}
          label={`Pay ₹${formatPrice(bill.grandTotal)}`}
          disabled={disabled}
        />
      </div>

      {/* Trust line */}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
        Secured by Razorpay
      </p>
    </Card>
  );
}