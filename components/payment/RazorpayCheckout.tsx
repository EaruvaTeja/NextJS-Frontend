// components/payment/RazorpayCheckout.tsx
//
// "Pay" button that wraps useRazorpayCheckout.
// Forwards onDismiss so callers can navigate on modal close.

"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useRazorpayCheckout,
  type PayParams,
  type RazorpayStatus,
} from "@/hooks/useRazorpayCheckout";

interface RazorpayCheckoutProps {
  params: PayParams;
  onSuccess?: (orderId: number) => void;
  onFailure?: (error: string, orderId?: number) => void;
  /** Called when the modal closes without payment. */
  onDismiss?: (orderId: number) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

function getBusyLabel(status: RazorpayStatus): string {
  switch (status) {
    case "creating-order":
      return "Creating order…";
    case "creating-payment":
      return "Preparing payment…";
    case "opening-checkout":
      return "Opening checkout…";
    case "verifying":
      return "Verifying payment…";
    default:
      return "Processing…";
  }
}

export function RazorpayCheckout({
  params,
  onSuccess,
  onFailure,
  onDismiss,
  label = "Pay now",
  className = "",
  disabled = false,
}: RazorpayCheckoutProps) {
  const { pay, status, isBusy } = useRazorpayCheckout({
    onSuccess,
    onFailure,
    onDismiss,
  });

  async function handleClick() {
    try {
      await pay(params);
    } catch {
      // Errors already toasted by hook
    }
  }

  return (
    <Button
      type="button"
      size="lg"
      onClick={handleClick}
      disabled={isBusy || disabled}
      className={`w-full ${className}`}
    >
      {isBusy ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {getBusyLabel(status)}
        </>
      ) : (
        label
      )}
    </Button>
  );
}