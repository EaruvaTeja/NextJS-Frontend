// components/home/HeroStatusCard.tsx
//
// The 4-state status card on the Hero.
//
// States:
//   guest       -> not signed in
//   empty_cart  -> signed in, no items, no active order
//   cart_items  -> signed in, cart has items
//   order_status-> signed in, has an active order
//
// Order status behavior:
//   awaiting_payment                -> tracker + "Retry payment"
//   pending/confirmed/preparing/out_for_delivery -> tracker + "Track order"
//   delivered                       -> "Delivered" + "Order again"
//   cancelled                       -> "Cancelled" + "Order again"
//   payment_failed                  -> "Failed" + "Retry payment"
//
// All action buttons share the SAME visual style (border, no fill).

"use client";

import Link from "next/link";
import { Check, Quote, X } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useCart } from "@/hooks/useCart";
import { useActiveOrder } from "@/hooks/useOrders";
import type { OrderStatus } from "@/types/order";

// ---------------------------------------------------------------------------
// Order flow
// ---------------------------------------------------------------------------
interface FlowStep {
  key: OrderStatus;
  label: string;
}

const ORDER_FLOW: FlowStep[] = [
  { key: "awaiting_payment", label: "Awaiting payment" },
  { key: "pending", label: "Order placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

// Statuses that get the "Track order" button
const TRACKABLE_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
];

type CardState = "guest" | "empty_cart" | "cart_items" | "order_status";

// ---------------------------------------------------------------------------
// Shared action button style — used by every CTA in this card
// ---------------------------------------------------------------------------
const ACTION_BUTTON_CLASS = `
  mt-auto inline-flex w-full items-center justify-center
  rounded-full border border-[#0A0A0A]/15 px-5 py-3
  text-sm font-semibold text-[#0A0A0A]
  transition-colors hover:border-[#0A0A0A]
  cursor-pointer
`;

// ===========================================================================
// Main component
// ===========================================================================
export function HeroStatusCard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { cart, isLoading: cartLoading, itemCount } = useCart();
  const {
    order: activeOrder,
    isLoading: orderLoading,
  } = useActiveOrder(isAuthenticated, { pollMs: 30000 });

  const hasCartItems = itemCount > 0;

  const resolvedState: CardState = !isAuthenticated
    ? "guest"
    : activeOrder
    ? "order_status"
    : hasCartItems
    ? "cart_items"
    : "empty_cart";

  const isBootstrapping =
    authLoading ||
    (isAuthenticated &&
      (cartLoading || orderLoading) &&
      resolvedState === "empty_cart");

  return (
    <div className="w-full max-w-md">
      {/* The card is now a flex column so child states can use flex-1 */}
      <div className="flex min-h-[360px] flex-col rounded-[28px] border border-[#E5E5E5] bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8">
        {isBootstrapping ? (
          <BootstrapLoader />
        ) : resolvedState === "guest" ? (
          <GuestState />
        ) : resolvedState === "empty_cart" ? (
          <EmptyCartState />
        ) : resolvedState === "cart_items" ? (
          <CartItemsState
            itemCount={itemCount}
            itemNames={(cart?.items ?? []).map((i) => i.menu_item.name)}
          />
        ) : activeOrder ? (
          <OrderStatusState order={activeOrder} />
        ) : null}
      </div>
    </div>
  );
}

// ===========================================================================
// Loader
// ===========================================================================
function BootstrapLoader() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[#737373]">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5E5E5] border-t-[#0A0A0A]" />
      <span className="text-sm">Loading your account…</span>
    </div>
  );
}

// ===========================================================================
// State 1 — Guest
// ===========================================================================
function GuestState() {
  const { open: openAuthModal } = useAuthModal();

  return (
    <div className="flex flex-1 flex-col">
      <span className="text-xs font-medium uppercase tracking-wide text-[#737373]">
        Not signed in
      </span>

      <Quote className="mt-6 h-6 w-6 text-[#0A0A0A]/20" />
      <p className="mt-2 text-lg font-medium leading-snug text-[#0A0A0A]/80">
        Good food is the foundation of genuine happiness.
      </p>

      <p className="mt-6 text-2xl font-bold leading-tight text-[#0A0A0A]">
        Sign in to start ordering
      </p>
      <p className="mt-2 text-sm text-[#737373]">
        Save addresses, track orders and reorder favorites in one tap.
      </p>

      <div className="mt-auto flex gap-3 pt-8">
        <button
          type="button"
          onClick={() => openAuthModal("login")}
          className="
            flex-1 cursor-pointer rounded-full bg-[#0A0A0A] px-5 py-3
            text-center text-sm font-semibold text-white
            transition-opacity hover:opacity-80
          "
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => openAuthModal("register")}
          className="
            flex-1 cursor-pointer rounded-full border border-[#0A0A0A]/15
            px-5 py-3 text-center text-sm font-semibold text-[#0A0A0A]
            transition-colors hover:border-[#0A0A0A]
          "
        >
          Sign up
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// State 2 — Empty cart
// ===========================================================================
function EmptyCartState() {
  return (
    <div className="flex flex-1 flex-col">
      <span className="text-xs font-medium uppercase tracking-wide text-[#737373]">
        Cart
      </span>

      <Quote className="mt-6 h-6 w-6 text-[#0A0A0A]/20" />
      <p className="mt-2 text-lg font-medium leading-snug text-[#0A0A0A]/80">
        An empty cart is just a craving that hasn&apos;t found its order yet.
      </p>

      <p className="mt-6 text-2xl font-bold leading-tight text-[#0A0A0A]">
        Your cart is empty
      </p>
      <p className="mt-2 text-sm text-[#737373]">
        Browse nearby restaurants and add something you&apos;re craving.
      </p>

      <Link href="/restaurants" className={ACTION_BUTTON_CLASS}>
        Browse restaurants
      </Link>
    </div>
  );
}

// ===========================================================================
// State 3 — Cart has items
// ===========================================================================
function CartItemsState({
  itemCount,
  itemNames,
}: {
  itemCount: number;
  itemNames: string[];
}) {
  const MAX_VISIBLE = 5;
  const visible = itemNames.slice(0, MAX_VISIBLE);
  const remaining = itemNames.length - MAX_VISIBLE;

  return (
    <div className="flex flex-1 flex-col">
      <span className="text-xs font-medium uppercase tracking-wide text-[#737373]">
        Cart · {itemCount} item{itemCount > 1 ? "s" : ""}
      </span>

      <p className="mt-4 text-2xl font-bold leading-tight text-[#0A0A0A]">
        Almost there
      </p>

      <ul className="mt-4 flex-1 space-y-2.5 overflow-y-auto">
        {visible.map((name, i) => (
          <li
            key={`${name}-${i}`}
            className="
              flex items-center gap-3 rounded-2xl border border-[#E5E5E5]
              px-4 py-3 text-sm font-medium text-[#0A0A0A]
            "
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0A0A0A]" />
            <span className="truncate">{name}</span>
          </li>
        ))}
        {remaining > 0 && (
          <li className="px-1 text-xs text-[#737373]">+{remaining} more</li>
        )}
      </ul>

      <p className="mt-4 text-sm text-[#737373]">
        Good things come to those who check out.
      </p>

      <Link href="/checkout" className={ACTION_BUTTON_CLASS}>
        Order the cart
      </Link>
    </div>
  );
}

// ===========================================================================
// State 4 — Order status
// ===========================================================================
function OrderStatusState({
  order,
}: {
  order: NonNullable<ReturnType<typeof useActiveOrder>["order"]>;
}) {
  const amount = `₹${Number(order.total_amount).toFixed(2)}`;

  // ---------- Failed ----------
  if (order.status === "payment_failed") {
    return (
      <div className="flex flex-1 flex-col">
        <HeaderRow orderId={order.id} amount={amount} />

        <div className="mt-6 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0A0A0A]">
          <X className="h-5 w-5 text-[#0A0A0A]" />
        </div>

        <p className="mt-4 text-2xl font-bold leading-tight text-[#0A0A0A]">
          This order didn&apos;t go through
        </p>
        <p className="mt-2 text-sm text-[#737373]">
          No charge was made. You can try placing it again.
        </p>

        <Link
          href={`/orders/${order.id}`}
          className={ACTION_BUTTON_CLASS}
        >
          Retry payment
        </Link>
      </div>
    );
  }

  // ---------- Cancelled ----------
  if (order.status === "cancelled") {
    return (
      <div className="flex flex-1 flex-col">
        <HeaderRow orderId={order.id} amount={amount} />

        <div className="mt-6 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0A0A0A]">
          <X className="h-5 w-5 text-[#0A0A0A]" />
        </div>

        <p className="mt-4 text-2xl font-bold leading-tight text-[#0A0A0A]">
          Order cancelled
        </p>
        <p className="mt-2 text-sm text-[#737373]">
          This order was cancelled. Start a new one any time.
        </p>

        <Link href="/restaurants" className={ACTION_BUTTON_CLASS}>
          Order again
        </Link>
      </div>
    );
  }

  // ---------- Delivered ----------
  if (order.status === "delivered") {
    return (
      <div className="flex flex-1 flex-col">
        <HeaderRow orderId={order.id} amount={amount} />

        <div className="mt-6 flex h-10 w-10 items-center justify-center rounded-full bg-[#0A0A0A]">
          <Check className="h-5 w-5 text-white" />
        </div>

        <p className="mt-4 text-2xl font-bold leading-tight text-[#0A0A0A]">
          Delivered
        </p>
        <p className="mt-2 text-sm text-[#737373]">
          Enjoy your meal! Hope you loved it.
        </p>

        <Link href="/restaurants" className={ACTION_BUTTON_CLASS}>
          Order again
        </Link>
      </div>
    );
  }

  // ---------- Active flow ----------
  const currentIndex = ORDER_FLOW.findIndex((s) => s.key === order.status);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentLabel = ORDER_FLOW[activeIndex]?.label ?? "Order placed";

  // Awaiting payment -> Retry payment
  // pending/confirmed/preparing/out_for_delivery -> Track order
  const showRetryPayment = order.status === "awaiting_payment";
  const showTrackButton = TRACKABLE_STATUSES.includes(order.status);

  return (
    <div className="flex flex-1 flex-col">
      <HeaderRow orderId={order.id} amount={amount} />

      <p className="mt-4 text-2xl font-bold leading-tight text-[#0A0A0A]">
        {currentLabel}
      </p>
      <p className="mt-1 text-sm text-[#737373]">
        Great food is always worth the wait.
      </p>

      {/* Tracker */}
      <div className="mt-8 flex-1">
        {ORDER_FLOW.map((step, i) => {
          const done = i <= activeIndex;
          const isLast = i === ORDER_FLOW.length - 1;
          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-[#0A0A0A] bg-[#0A0A0A]"
                      : "border-[#E5E5E5] bg-white"
                  }`}
                >
                  {done && <Check className="h-3 w-3 text-white" />}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 ${
                      i < activeIndex ? "bg-[#0A0A0A]" : "bg-[#E5E5E5]"
                    }`}
                    style={{ minHeight: "20px" }}
                  />
                )}
              </div>
              <span
                className={`pb-6 text-sm ${
                  i === activeIndex
                    ? "font-semibold text-[#0A0A0A]"
                    : done
                    ? "text-[#0A0A0A]/60"
                    : "text-[#737373]"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action button — same style for both cases */}
      {showRetryPayment && (
        <Link
          href={`/orders/${order.id}`}
          className={ACTION_BUTTON_CLASS}
        >
          Retry payment
        </Link>
      )}
      {showTrackButton && (
        <Link
          href={`/orders/${order.id}`}
          className={ACTION_BUTTON_CLASS}
        >
          Track order
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared order header
// ---------------------------------------------------------------------------
function HeaderRow({
  orderId,
  amount,
}: {
  orderId: number | string;
  amount: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-[#737373]">
        Order #{orderId}
      </span>
      <span className="text-xs font-semibold text-[#0A0A0A]">{amount}</span>
    </div>
  );
}