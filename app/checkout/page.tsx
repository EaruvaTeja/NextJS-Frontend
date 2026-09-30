// app/checkout/page.tsx
//
// Checkout page — final step before placing an order.
//
// Guards (in order):
//   1. Auth not loaded          -> skeleton
//   2. Cart is loading          -> skeleton
//   3. Cart fetch error         -> error state
//   4. Empty cart               -> "Cart is empty" + back link
//   5. No address selected      -> "Select an address" + back link
//   6. Otherwise                -> render content

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  MapPin,
} from "lucide-react";

import { useCart } from "@/hooks/useCart";
import { useAddress } from "@/hooks/useAddress";
import { getCartNotes, clearCartNotes } from "@/lib/cart-notes";
import { AddressPicker } from "@/components/address/AddressPicker";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Cart } from "@/types/cart";
import type { Address } from "@/types/address";
import { ADDRESS_TYPE_LABELS } from "@/types/address";

// ===========================================================================
// OUTER — guards + delegation
// ===========================================================================
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading: cartLoading, error: cartError, refresh } = useCart();
  const { selectedAddress, isLoading: addrLoading } = useAddress();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/cart");
    }
  }

  const loading = cartLoading || addrLoading;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      {/* Back + breadcrumb row */}
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
            { label: "Cart", href: "/cart" },
            { label: "Checkout" },
          ]}
        />
      </div>

      {/* Loading */}
      {loading && <CheckoutSkeleton />}

      {/* Cart error */}
      {!loading && cartError && (
        <ErrorState message={cartError} onRetry={refresh} />
      )}

      {/* Empty cart */}
      {!loading && !cartError && (!cart || cart.items.length === 0) && (
        <BlockedState
          icon={<ShoppingBag className="h-8 w-8 text-muted-foreground" />}
          title="Your cart is empty"
          description="Add some items before proceeding to checkout."
          ctaLabel="Browse restaurants"
          ctaHref="/restaurants"
        />
      )}

      {/* No address */}
      {!loading &&
        !cartError &&
        cart &&
        cart.items.length > 0 &&
        !selectedAddress && (
          <BlockedState
            icon={<MapPin className="h-8 w-8 text-muted-foreground" />}
            title="Select a delivery address"
            description="You need to pick a delivery address before placing this order."
            ctaLabel="Back to cart"
            ctaHref="/cart"
          />
        )}

      {/* Ready */}
      {!loading &&
        !cartError &&
        cart &&
        cart.items.length > 0 &&
        selectedAddress && (
          <CheckoutContent cart={cart} address={selectedAddress} />
        )}
    </div>
  );
}

// ===========================================================================
// CheckoutContent — safe to use hooks here
// ===========================================================================
function CheckoutContent({
  cart,
  address,
}: {
  cart: Cart;
  address: Address;
}) {
  const router = useRouter();
  const { refresh: refreshCart } = useCart();

  // Build the delivery_address string once
  const addressString = buildAddressString(address);

  // Read notes from localStorage (set on the cart page)
  const notes = getCartNotes();

  async function handlePaymentSuccess(orderId: number) {
    // 1. Clear the cart notes from localStorage
    clearCartNotes();
    
    // 2. Refresh the cart — backend cleared it after payment success
    await refreshCart();
    
    // 3. Navigate to the order detail page
    router.push(`/orders/${orderId}`);
}

  function handlePaymentFailure(error: string, _orderId?: number) {
    // Errors are already toasted by useRazorpayCheckout.
    // Nothing to log here — keeping this handler avoids the dev overlay
    // and gives us a hook point for future telemetry if needed.
    void error;
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your order and complete payment
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Address picker (reused from cart) */}
          <AddressPicker />

          {/* Items summary */}
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-tight">
                Items in your order ({cart.item_count})
              </h2>
              <Link
                href="/cart"
                className="
                  text-[11px] font-semibold text-primary hover:underline
                "
              >
                Edit cart
              </Link>
            </div>

            <div className="divide-y divide-zinc-100">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.menu_item.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      ₹{Number(item.menu_item.price).toFixed(2)} ×{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    ₹{Number(item.subtotal).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes (read-only display) */}
          {notes && (
            <Card className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Special instructions
              </p>
              <p className="mt-1.5 text-sm italic">&ldquo;{notes}&rdquo;</p>
            </Card>
          )}
        </div>

        {/* RIGHT column */}
        <div className="lg:col-span-1">
          <CheckoutSummary
            cart={cart}
            createOrderParams={{
              delivery_address: addressString,
              notes,
            }}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
            onDismiss={(orderId) => router.push(`/orders/${orderId}`)}
          />
        </div>
      </div>
    </>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================

function buildAddressString(a: Address): string {
  const lines: string[] = [
    `${a.full_name} · ${a.phone}`,
    `${ADDRESS_TYPE_LABELS[a.address_type]} — ${a.label}`,
    a.line1,
  ];
  if (a.line2) lines.push(a.line2);
  if (a.landmark) lines.push(`Landmark: ${a.landmark}`);
  lines.push(`${a.city}, ${a.state} — ${a.pincode}`);
  return lines.join("\n");
}

// ===========================================================================
// Loading skeleton
// ===========================================================================
function CheckoutSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="lg:col-span-1">
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

// ===========================================================================
// Blocked state (empty cart / no address)
// ===========================================================================
interface BlockedStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

function BlockedState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: BlockedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      <Button
        className="mt-6"
        nativeButton={false}
        render={<Link href={ctaHref} />}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}

// ===========================================================================
// Error state
// ===========================================================================
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">
        Couldn&apos;t load checkout
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry} className="mt-6">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}