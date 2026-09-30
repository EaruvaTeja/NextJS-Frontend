// components/order/OrderStatus.tsx
//
// Vertical progress tracker for an order's lifecycle.
//
// Two visual states:
//   OPEN      -> full 6-step tracker
//   COLLAPSED -> compact view showing only the current step, sandwiched
//                between a green line (completed above) and a gray line
//                (pending below)
//
// Failure states (payment_failed / cancelled) show a distinct
// non-collapsible banner.

"use client";

import { useState } from "react";
import {
  Check,
  Clock,
  ChefHat,
  Bike,
  Home,
  AlertCircle,
  XCircle,
  CreditCard,
  ChevronDown,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { OrderStatus as OrderStatusType } from "@/types/order";

interface OrderStatusProps {
  status: OrderStatusType;
  orderId?: number | string;
}

// ---------------------------------------------------------------------------
// Order flow steps
// ---------------------------------------------------------------------------
interface Step {
  key: OrderStatusType;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const ORDER_FLOW: Step[] = [
  {
    key: "awaiting_payment",
    label: "Awaiting Payment",
    description: "Complete payment to place this order",
    Icon: CreditCard,
  },
  {
    key: "pending",
    label: "Order Placed",
    description: "We've received your order",
    Icon: Clock,
  },
  {
    key: "confirmed",
    label: "Confirmed",
    description: "The restaurant has accepted your order",
    Icon: Check,
  },
  {
    key: "preparing",
    label: "Preparing",
    description: "Your food is being prepared",
    Icon: ChefHat,
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    description: "Your rider is on the way",
    Icon: Bike,
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Enjoy your meal!",
    Icon: Home,
  },
];

// ===========================================================================
// Main component
// ===========================================================================
export function OrderStatus({ status, orderId }: OrderStatusProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Failed / cancelled get non-collapsible banner
  if (status === "payment_failed") {
    return (
      <FailureCard
        variant="failed"
        title="Payment failed"
        message="No charge was made. You can retry the payment from your cart."
        orderId={orderId}
      />
    );
  }

  if (status === "cancelled") {
    return (
      <FailureCard
        variant="cancelled"
        title="Order cancelled"
        message="This order was cancelled. You can start a new one any time."
        orderId={orderId}
      />
    );
  }

  // Determine current index
  const currentIndex = ORDER_FLOW.findIndex((s) => s.key === status);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentStep = ORDER_FLOW[activeIndex];

  const hasCompletedAbove = activeIndex > 0;
  const hasPendingBelow = activeIndex < ORDER_FLOW.length - 1;

  return (
    <Card className="overflow-hidden p-0">
      {/* -------------------------------------------------------- */}
      {/* Header bar — clickable to toggle                          */}
      {/* -------------------------------------------------------- */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="order-progress-body"
        className="
          flex w-full items-center justify-between gap-3 px-5 py-4
          text-left transition-colors hover:bg-zinc-50
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          cursor-pointer
        "
      >
        <h2 className="text-base font-bold tracking-tight">
          Order Progress
        </h2>

        <div className="flex items-center gap-3">
          {orderId !== undefined && (
            <span className="text-xs font-semibold text-muted-foreground">
              #{orderId}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>
      </button>

      {/* -------------------------------------------------------- */}
      {/* Body                                                       */}
      {/* -------------------------------------------------------- */}
      <div id="order-progress-body" className="border-t px-5 py-4">
        {isOpen ? (
          // ==================== OPEN: full tracker ====================
          <ol className="space-y-1">
            {ORDER_FLOW.map((step, i) => {
              const isComplete = i < activeIndex;
              const isCurrent = i === activeIndex;
              const isPending = i > activeIndex;

              return (
                <StepRow
                  key={step.key}
                  step={step}
                  isComplete={isComplete}
                  isCurrent={isCurrent}
                  isPending={isPending}
                  isLast={i === ORDER_FLOW.length - 1}
                />
              );
            })}
          </ol>
        ) : (
          // ==================== COLLAPSED: current step only ====================
          <CollapsedView
            step={currentStep}
            showLineAbove={hasCompletedAbove}
            showLineBelow={hasPendingBelow}
          />
        )}
      </div>
    </Card>
  );
}

// ===========================================================================
// StepRow — one line in the full tracker
// ===========================================================================
interface StepRowProps {
  step: Step;
  isComplete: boolean;
  isCurrent: boolean;
  isPending: boolean;
  isLast: boolean;
}

function StepRow({
  step,
  isComplete,
  isCurrent,
  isPending,
  isLast,
}: StepRowProps) {
  const { Icon } = step;

  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`
            relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full
            border-2 transition-all
            ${
              isComplete
                ? "border-green-600 bg-green-600 text-white"
                : isCurrent
                ? "border-primary bg-primary text-white"
                : "border-zinc-200 bg-background text-zinc-400"
            }
          `}
        >
          {isCurrent && (
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-primary/30"
            />
          )}

          {isComplete ? (
            <Check className="relative h-4 w-4" />
          ) : (
            <Icon className="relative h-4 w-4" />
          )}
        </div>

        {!isLast && (
          <div
            className={`
              w-0.5 flex-1 min-h-[28px]
              ${isComplete ? "bg-green-600" : "bg-zinc-200"}
            `}
          />
        )}
      </div>

      <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
        <p
          className={`
            text-sm font-semibold leading-tight
            ${
              isComplete || isCurrent
                ? "text-foreground"
                : "text-muted-foreground"
            }
          `}
        >
          {step.label}
        </p>
        <p
          className={`
            mt-0.5 text-xs leading-snug
            ${isPending ? "text-muted-foreground/60" : "text-muted-foreground"}
          `}
        >
          {step.description}
        </p>
      </div>
    </li>
  );
}

// ===========================================================================
// CollapsedView — compact "just the current step" preview
// ===========================================================================
interface CollapsedViewProps {
  step: Step;
  showLineAbove: boolean;
  showLineBelow: boolean;
}

function CollapsedView({
  step,
  showLineAbove,
  showLineBelow,
}: CollapsedViewProps) {
  const { Icon } = step;

  return (
    <div className="flex gap-4">
      {/* Left column — the mini timeline */}
      <div className="flex flex-col items-center">
        {/* Green line above (only if there are completed steps) */}
        {showLineAbove && (
          <div className="h-2.5 w-0.5 bg-green-600" aria-hidden="true" />
        )}

        {/* Current step circle */}
        <div
          className="
            relative flex h-9 w-9 shrink-0 items-center justify-center
            rounded-full border-2 border-primary bg-primary text-white
          "
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-primary/30"
          />
          <Icon className="relative h-4 w-4" />
        </div>

        {/* Gray line below (only if there are pending steps) */}
        {showLineBelow && (
          <div className="h-4 w-0.5 bg-zinc-200" aria-hidden="true" />
        )}
      </div>

      {/* Right column — current step text */}
      <div className="pt-2">
        <p className="text-sm font-semibold leading-tight text-foreground">
          {step.label}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {step.description}
        </p>
      </div>
    </div>
  );
}

// ===========================================================================
// FailureCard — for payment_failed / cancelled (unchanged)
// ===========================================================================
interface FailureCardProps {
  variant: "failed" | "cancelled";
  title: string;
  message: string;
  orderId?: number | string;
}

function FailureCard({
  variant,
  title,
  message,
  orderId,
}: FailureCardProps) {
  const isFailed = variant === "failed";

  return (
    <Card
      className={`
        overflow-hidden border p-0
        ${isFailed ? "border-red-200" : "border-zinc-200"}
      `}
    >
      <div
        className={`
          flex items-center gap-3 px-5 py-4
          ${isFailed ? "bg-red-50" : "bg-zinc-50"}
        `}
      >
        <div
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-full
            ${isFailed ? "bg-red-100 text-red-600" : "bg-zinc-200 text-zinc-600"}
          `}
        >
          {isFailed ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={`
              text-sm font-bold
              ${isFailed ? "text-red-900" : "text-zinc-900"}
            `}
          >
            {title}
          </h3>
          {orderId !== undefined && (
            <p
              className={`
                text-[11px] font-medium
                ${isFailed ? "text-red-700/70" : "text-zinc-500"}
              `}
            >
              Order #{orderId}
            </p>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
    </Card>
  );
}