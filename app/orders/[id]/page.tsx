// app/orders/[id]/page.tsx
//
// Single order detail page.
//
// Layout:
//   [Back + breadcrumb]
//   [Title + status badge + date + refresh]
//   [Stale-data notice]         (when a background refresh failed)
//   [Payment OR Unfulfillable]  (based on live fulfillability)
//   [Order status tracker]
//   [Restaurant + items]
//   [Bill breakdown]
//   [Delivery details]
//
// Fulfillability rule:
//   For awaiting_payment / payment_failed orders, we check LIVE state:
//     - restaurant.is_active  == true
//     - every item.is_available == true
//   If either fails, we hide the retry card and show an Unfulfillable
//   notice instead. Users cannot retry an impossible order.

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ElementType,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  MapPin,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Store,
  StickyNote,
  X,
} from "lucide-react";

import { useOrder } from "@/hooks/useOrders";
import { useCart } from "@/hooks/useCart";
import { OrderStatus } from "@/components/order/OrderStatus";
import { OrderItem } from "@/components/order/OrderItem";
import { RazorpayCheckout } from "@/components/payment/RazorpayCheckout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ===========================================================================
// Constants & types
// ===========================================================================
const RETRY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LOW_TIME_MS = 2 * 60 * 1000; // turn the countdown red under 2 minutes
const POLL_MS = 15_000;

type Order = NonNullable<ReturnType<typeof useOrder>["order"]>;
type CheckoutSuccessHandler = NonNullable<
  ComponentProps<typeof RazorpayCheckout>["onSuccess"]
>;
type CheckoutFailureHandler = NonNullable<
  ComponentProps<typeof RazorpayCheckout>["onFailure"]
>;

// ===========================================================================
// OUTER — validates id, delegates to inner
// ===========================================================================
export default function OrderDetailPage() {
  const params = useParams();
  const orderId = parseOrderId(params?.id);

  if (orderId === null) {
    return <InvalidIdPage />;
  }

  return <OrderDetailContent orderId={orderId} />;
}

// ===========================================================================
// INNER — hooks are safe here
// ===========================================================================
function OrderDetailContent({ orderId }: { orderId: number }) {
  const router = useRouter();
  const { order, isLoading, error, refetch } = useOrder(orderId, {
    pollMs: POLL_MS,
  });
  const { refresh: refreshCart } = useCart();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    document.title = `Order #${orderId}`;
  }, [orderId]);

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/orders");
    }
  }

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // After successful payment, refresh both order + cart.
  const handlePaid = useCallback<CheckoutSuccessHandler>(
    async (id) => {
      await Promise.all([refetch(), refreshCart()]);
      if (Number(id) !== orderId) {
        router.push(`/orders/${id}`);
      }
    },
    [refetch, refreshCart, router, orderId]
  );

  // After a failed payment (or unfulfillable), just refetch order —
  // the backend has already updated status to payment_failed.
  const handlePaymentFailure = useCallback<CheckoutFailureHandler>(() => {
    void refetch();
  }, [refetch]);

  // After the user dismisses the Razorpay modal (X / ESC), the backend
  // marked the payment cancelled — refetch to reflect the new state.
  const handlePaymentDismiss = useCallback(
    (_id: number) => {
      void refetch();
    },
    [refetch]
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-8">
      {/* Back + breadcrumb */}
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="
            inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center
            rounded-full border border-zinc-200 bg-white text-foreground
            transition-colors hover:border-primary/40 hover:bg-primary/5
            hover:text-primary
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          "
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "My Orders", href: "/orders" },
            { label: `#${orderId}` },
          ]}
        />
      </div>

      {order ? (
        <OrderBody
          order={order}
          hasRefreshError={Boolean(error)}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onPaid={handlePaid}
          onPaymentFailure={handlePaymentFailure}
          onPaymentDismiss={handlePaymentDismiss}
        />
      ) : isLoading || !error ? (
        <OrderDetailSkeleton />
      ) : (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      )}
    </div>
  );
}

// ===========================================================================
// Order body (success state)
// ===========================================================================
interface OrderBodyProps {
  order: Order;
  hasRefreshError: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onPaid: CheckoutSuccessHandler;
  onPaymentFailure: CheckoutFailureHandler;
  onPaymentDismiss: (id: number) => void;
}

function OrderBody({
  order,
  hasRefreshError,
  isRefreshing,
  onRefresh,
  onPaid,
  onPaymentFailure,
  onPaymentDismiss,
}: OrderBodyProps) {
  const status = String(order.status);
  const needsPayment =
    status === "awaiting_payment" || status === "payment_failed";
  const itemCount = order.items.length;

  // Money breakdown (all frozen snapshots from the order)
  const subtotal = toAmount(order.subtotal);
  const deliveryFee = toAmount(order.delivery_fee);
  const gst = toAmount(order.gst_amount);
  const total = toAmount(order.total_amount);

  // -------------------------------------------------------------------------
  // Live fulfillability check
  // -------------------------------------------------------------------------
  // Only relevant for orders that need payment. Once confirmed, we don't
  // care if the restaurant later goes inactive — the order is in flight.
  const restaurantInactive = order.restaurant.is_active === false;
  const unavailableItems = order.items.filter(
    (i) => !i.menu_item.is_available
  );
  const isUnfulfillable =
    needsPayment && (restaurantInactive || unavailableItems.length > 0);

  // Badge label: when unfulfillable, prefer the descriptive status.
  const badgeStatus = isUnfulfillable ? "unfulfillable" : status;

  const showPaymentCard = needsPayment && !isUnfulfillable;
  const showUnfulfillableCard = needsPayment && isUnfulfillable;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Order #{order.id}
            </h1>
            <StatusBadge status={badgeStatus} />
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Placed on {formatFullDate(order.created_at)}
            <span className="mx-1.5 text-zinc-300" aria-hidden="true">
              |
            </span>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh order"
          title="Refresh"
          className="
            inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center
            rounded-full border border-zinc-200 bg-white text-muted-foreground
            transition-colors hover:border-primary/40 hover:bg-primary/5
            hover:text-primary disabled:cursor-not-allowed disabled:opacity-60
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          "
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "motion-safe:animate-spin" : ""}`}
          />
        </button>
      </header>

      {/* Stale-data notice */}
      {hasRefreshError && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
            <p className="text-xs font-medium text-amber-900">
              Couldn&apos;t refresh. Showing the last details we loaded.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="shrink-0 cursor-pointer rounded text-xs font-semibold text-amber-800 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Payment OR Unfulfillable card */}
      {showPaymentCard && (
        <PaymentCard
          orderId={order.id}
          restaurantId={order.restaurant.id}
          createdAt={order.created_at}
          failed={status === "payment_failed"}
          amount={total}
          onPaid={onPaid}
          onFailure={onPaymentFailure}
          onDismiss={onPaymentDismiss}
        />
      )}

      {showUnfulfillableCard && (
        <UnfulfillableNotice
          restaurantId={order.restaurant.id}
          restaurantName={order.restaurant.name}
          restaurantInactive={restaurantInactive}
          unavailableItems={unavailableItems.map((i) => ({
            id: i.id,
            name: i.menu_item.name,
          }))}
          wasCharged={status === "payment_failed"}
        />
      )}

      {/* Status tracker */}
      <OrderStatus status={order.status} orderId={order.id} />

      {/* Restaurant + items */}
      <Card className="gap-0 p-4 sm:p-5">
        <Link
          href={`/restaurants/${order.restaurant.id}`}
          className="
            group -m-1 flex items-center gap-3 rounded-lg p-1
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          "
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Store className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">
              Ordered from
            </span>
            <span className="block truncate text-base font-bold leading-snug transition-colors group-hover:text-primary">
              {order.restaurant.name}
            </span>
            {order.restaurant.cuisine_type && (
              <span className="block truncate text-xs text-muted-foreground">
                {order.restaurant.cuisine_type}
              </span>
            )}
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </Link>

        <div className="mt-4 flex items-center gap-2 border-t border-dashed border-zinc-200 pt-4">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold tracking-tight">
            Your items
            <span className="ml-1.5 font-medium text-muted-foreground">
              ({itemCount})
            </span>
          </h2>
        </div>

        <div className="mt-1 divide-y divide-zinc-100">
          {order.items.map((item) => (
            <OrderItem key={item.id} item={item} />
          ))}
        </div>
      </Card>

      {/* Bill breakdown */}
      <Card className="gap-0 p-4 sm:p-5">
        <SectionTitle icon={Receipt}>Bill details</SectionTitle>

        <dl className="space-y-2 text-sm">
          {/* Item subtotal */}
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Item total</dt>
            <dd className="font-medium tabular-nums">
              {formatRupees(subtotal)}
            </dd>
          </div>

          {/* Delivery fee */}
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Delivery fee</dt>
            <dd className="font-medium tabular-nums">
              {formatRupees(deliveryFee)}
            </dd>
          </div>

          {/* GST — 18%, rounded to whole rupees at order time */}
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">GST (18%)</dt>
            <dd className="font-medium tabular-nums">
              {formatRupees(gst)}
            </dd>
          </div>
        </dl>

        {/* Grand total */}
        <div className="mt-3 rounded-lg bg-muted/50 px-3.5 py-3">
          <div className="flex items-center justify-between text-base font-bold">
            <span>{needsPayment ? "Amount due" : "Total paid"}</span>
            <span className="tabular-nums">{formatRupees(total)}</span>
          </div>
        </div>
      </Card>

      {/* Delivery details */}
      <Card className="gap-0 p-4 sm:p-5">
        <SectionTitle
          icon={MapPin}
          aside={<CopyButton text={order.delivery_address} label="address" />}
        >
          Delivery details
        </SectionTitle>

        <p className="whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
          {order.delivery_address}
        </p>

        {order.notes && (
          <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <StickyNote className="h-3.5 w-3.5" />
              Your note
            </div>
            <p className="mt-1.5 whitespace-pre-line break-words text-sm italic text-foreground">
              &ldquo;{order.notes}&rdquo;
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ===========================================================================
// Payment card — owns its own 1s clock
// ===========================================================================
interface PaymentCardProps {
  orderId: number;
  restaurantId: number | string;
  createdAt: string;
  failed: boolean;
  amount: number;
  onPaid: CheckoutSuccessHandler;
  onFailure: CheckoutFailureHandler;
  onDismiss: (id: number) => void;
}

function PaymentCard({
  orderId,
  restaurantId,
  createdAt,
  failed,
  amount,
  onPaid,
  onFailure,
  onDismiss,
}: PaymentCardProps) {
  const now = useNow(1000);
  const createdMs = new Date(createdAt).getTime();

  if (now === null || Number.isNaN(createdMs)) return null;

  const remaining = RETRY_WINDOW_MS - (now - createdMs);

  // Window closed → explain clearly instead of silently hiding the card.
  if (remaining <= 0) {
    return (
      <Card className="gap-0 border-zinc-200 p-5">
        <div className="flex items-start gap-3">
          <IconBadge tone="muted">
            <Clock className="h-5 w-5" />
          </IconBadge>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold">Payment window closed</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              This order can no longer be paid. Nothing was charged. You can
              place a fresh order from the restaurant.
            </p>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/restaurants/${restaurantId}`} />}
              >
                Order again
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const isLow = remaining <= LOW_TIME_MS;
  const percent = Math.max(
    0,
    Math.min(100, (remaining / RETRY_WINDOW_MS) * 100)
  );
  const clock = formatCountdown(remaining);

  return (
    <Card className="gap-0 overflow-hidden border-amber-200 p-0">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <IconBadge tone="amber">
            <CreditCard className="h-5 w-5" />
          </IconBadge>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-bold">
                {failed
                  ? "Payment didn't go through"
                  : "Complete your payment"}
              </h2>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                  isLow
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span aria-hidden="true">{clock}</span>
                <span className="sr-only">
                  {Math.ceil(remaining / 60_000)} minutes left to pay
                </span>
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {failed
                ? "Your card was not charged. You can try again."
                : "Finish paying for this order to confirm it."}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <PayAction
            orderId={orderId}
            amount={amount}
            onPaid={onPaid}
            onFailure={onFailure}
            onDismiss={onDismiss}
          />
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Time left to pay"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="h-1 w-full bg-amber-100"
      >
        <div
          className={`h-full transition-[width] duration-1000 ease-linear ${
            isLow ? "bg-red-500" : "bg-amber-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </Card>
  );
}

// Memoised so the 1s countdown never re-renders the Razorpay checkout.
const PayAction = memo(function PayAction({
  orderId,
  amount,
  onPaid,
  onFailure,
  onDismiss,
}: {
  orderId: number;
  amount: number;
  onPaid: CheckoutSuccessHandler;
  onFailure: CheckoutFailureHandler;
  onDismiss: (id: number) => void;
}) {
  const params = useMemo(() => ({ existingOrderId: orderId }), [orderId]);

  return (
    <RazorpayCheckout
      params={params}
      onSuccess={onPaid}
      onFailure={onFailure}
      onDismiss={onDismiss}
      label={`Pay ${formatRupees(amount)}`}
    />
  );
});

// ===========================================================================
// Unfulfillable notice — replaces the payment card when the order can't proceed
// ===========================================================================
interface UnfulfillableNoticeProps {
  restaurantId: number | string;
  restaurantName: string;
  restaurantInactive: boolean;
  unavailableItems: { id: number; name: string }[];
  wasCharged: boolean;
}

function UnfulfillableNotice({
  restaurantId,
  restaurantName,
  restaurantInactive,
  unavailableItems,
  wasCharged,
}: UnfulfillableNoticeProps) {
  return (
    <Card className="gap-0 border-red-200 p-5">
      <div className="flex items-start gap-3">
        <IconBadge tone="danger">
          <X className="h-5 w-5" />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold">
            This order can&apos;t be completed
          </h2>

          {/* Reason */}
          {restaurantInactive && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">
                {restaurantName}
              </span>{" "}
              is no longer accepting orders.
            </p>
          )}

          {unavailableItems.length > 0 && (
            <>
              <p
                className={`text-xs leading-relaxed text-muted-foreground ${
                  restaurantInactive ? "mt-2" : "mt-1"
                }`}
              >
                {unavailableItems.length === 1
                  ? "The following item is no longer available:"
                  : "The following items are no longer available:"}
              </p>
              <ul className="mt-1.5 space-y-1">
                {unavailableItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 truncate">{item.name}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Refund note — only if the user was already charged */}
          {wasCharged && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              If payment was deducted, a refund will be processed within
              3–5 business days.
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href={`/restaurants/${restaurantId}`} />}
            >
              Order again
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/restaurants" />}
            >
              See all restaurants
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ===========================================================================
// Small UI pieces
// ===========================================================================
function SectionTitle({
  icon: Icon,
  children,
  aside,
}: {
  icon: ElementType;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-bold tracking-tight">{children}</h2>
      </div>
      {aside}
    </div>
  );
}

function IconBadge({
  tone,
  children,
}: {
  tone: "amber" | "muted" | "danger";
  children: ReactNode;
}) {
  const cls =
    tone === "amber"
      ? "bg-amber-100 text-amber-700"
      : tone === "danger"
      ? "bg-red-100 text-red-700"
      : "bg-muted text-muted-foreground";
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cls}`}
    >
      {children}
    </div>
  );
}

type Tone = "success" | "warning" | "danger" | "info";

const TONE_STYLES: Record<Tone, { chip: string; dot: string }> = {
  success: {
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  warning: {
    chip: "bg-amber-50 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
  },
  danger: {
    chip: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  info: {
    chip: "bg-primary/10 text-primary ring-primary/20",
    dot: "bg-primary",
  },
};

// Works with any status string the backend sends — unknown ones fall back to "info".
function getStatusMeta(status: string): { label: string; tone: Tone } {
  const s = status.toLowerCase();
  let tone: Tone = "info";

  // Anything with these words is treated as a "problem" state
  if (/(cancel|fail|reject|refund|unfulfillable)/.test(s)) tone = "danger";
  else if (/(awaiting|pending)/.test(s)) tone = "warning";
  else if (s === "delivered" || s === "completed") tone = "success";

  const label = s
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return { label: label || "Unknown", tone };
}

function StatusBadge({ status }: { status: string }) {
  const { label, tone } = getStatusMeta(status);
  const styles = TONE_STYLES[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles.chip}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (insecure context / denied) — fail silently */
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
      className="
        inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1
        text-xs font-medium text-muted-foreground transition-colors
        hover:bg-primary/5 hover:text-primary
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
      "
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-emerald-700">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

// ===========================================================================
// Hooks
// ===========================================================================

/**
 * Client clock. Returns null on the server / first render (no hydration
 * mismatch), then ticks every `intervalMs` and immediately when the tab
 * becomes visible again (browsers throttle timers in background tabs).
 */
function useNow(intervalMs: number): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return now;
}

// ===========================================================================
// Helpers
// ===========================================================================
function parseOrderId(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

function toAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "an unknown date";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatAmount(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

function formatRupees(value: number): string {
  return `₹${formatAmount(value)}`;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong while loading this order. Please try again.";
}

// ===========================================================================
// Invalid ID page
// ===========================================================================
function InvalidIdPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card
        role="alert"
        className="flex flex-col items-center gap-4 p-10 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Invalid order</h1>
          <p className="text-sm text-muted-foreground">
            The order id in the URL is not valid. Check the link or open the
            order from your orders list.
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/orders" />}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to orders
        </Button>
      </Card>
    </div>
  );
}

// ===========================================================================
// Skeleton — mirrors the real layout to avoid content jump
// ===========================================================================
function Bone({ className }: { className: string }) {
  return (
    <div
      className={`rounded bg-muted motion-safe:animate-pulse ${className}`}
    />
  );
}

function OrderDetailSkeleton() {
  return (
    <div
      className="space-y-4 sm:space-y-5"
      role="status"
      aria-busy="true"
      aria-label="Loading order"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Bone className="h-8 w-36" />
            <Bone className="h-6 w-24 rounded-full" />
          </div>
          <Bone className="mt-2.5 h-4 w-56" />
        </div>
        <Bone className="h-9 w-9 rounded-full" />
      </div>

      <Card className="gap-0 p-5">
        <Bone className="h-5 w-40" />
        <div className="mt-5 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Bone className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1">
                <Bone className="h-4 w-40" />
                <Bone className="mt-1.5 h-3 w-56" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="gap-0 p-5">
        <div className="flex items-center gap-3">
          <Bone className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="flex-1">
            <Bone className="h-3 w-20" />
            <Bone className="mt-1.5 h-4 w-44" />
          </div>
        </div>
        <div className="mt-5 space-y-3 border-t border-dashed border-zinc-200 pt-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Bone className="h-4 w-48" />
              <Bone className="h-4 w-14" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="gap-0 p-5">
        <Bone className="h-4 w-24" />
        <div className="mt-4 space-y-2">
          <Bone className="h-4 w-full" />
          <Bone className="h-10 w-full" />
        </div>
      </Card>

      <span className="sr-only">Loading order details…</span>
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
      className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">
        Couldn&apos;t load this order
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/orders" />}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to orders
        </Button>
      </div>
    </div>
  );
}