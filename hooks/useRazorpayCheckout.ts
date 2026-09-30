// hooks/useRazorpayCheckout.ts
//
// Orchestrates the complete Razorpay payment flow.
//
// Outcomes:
//   1. Success  -> verify -> onSuccess(orderId)
//   2. Dismiss  -> cancel -> onDismiss(orderId)  (modal closed by user)
//   3. Error    -> onFailure(msg, orderId?)

"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { placeOrder } from "@/lib/api/orders";
import {
  createPaymentOrder,
  verifyPayment,
  cancelPayment,
} from "@/lib/api/payments";
import { loadRazorpayScript } from "@/lib/razorpay";
import { useAuth } from "@/hooks/useAuth";
import { clearCartNotes } from "@/lib/cart-notes";

export type RazorpayStatus =
  | "idle"
  | "creating-order"
  | "creating-payment"
  | "opening-checkout"
  | "verifying"
  | "success"
  | "failed";

interface UseRazorpayCheckoutOptions {
  onSuccess?: (orderId: number) => void;
  onFailure?: (errorMessage: string, orderId?: number) => void;
  /** Called when the user closes the Razorpay modal without paying. */
  onDismiss?: (orderId: number) => void;
}

interface PayWithNewOrder {
  createOrder: {
    delivery_address: string;
    notes?: string;
  };
  existingOrderId?: never;
}

interface PayWithExistingOrder {
  existingOrderId: number;
  createOrder?: never;
}

export type PayParams = PayWithNewOrder | PayWithExistingOrder;

const DISMISS_SENTINEL = "__razorpay_dismissed__";

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as {
    response?: {
      data?: {
        detail?: string | string[];
        error?: string;
        problems?: string[];
        [key: string]: string | string[] | undefined;
      };
    };
  };

  const data = axiosErr.response?.data;

  // Prefer "detail" — it's the human-readable field
  let baseMessage: string | null = null;

  if (data?.detail) {
    if (typeof data.detail === "string") {
      baseMessage = data.detail;
    } else if (Array.isArray(data.detail) && data.detail.length > 0) {
      baseMessage = String(data.detail[0]);
    }
  }

  // Fall back to any other field (skipping internal codes)
  if (!baseMessage && data && typeof data === "object") {
    for (const key of Object.keys(data)) {
      if (key === "error" || key === "problems") continue;
      const val = data[key];
      if (typeof val === "string") {
        baseMessage = val;
        break;
      }
      if (Array.isArray(val) && val.length > 0) {
        baseMessage = String(val[0]);
        break;
      }
    }
  }

  if (!baseMessage) {
    if (err instanceof Error) return err.message;
    return fallback;
  }

  // Append the "problems" array if present — this is where the backend
  // surfaces specifics like "'X' is currently unavailable."
  if (
    Array.isArray(data?.problems) &&
    data.problems.length > 0
  ) {
    const problemsText = data.problems.map((p) => `• ${p}`).join("\n");
    return `${baseMessage}\n\n${problemsText}`;
  }

  return baseMessage;
}

export function useRazorpayCheckout(
  options: UseRazorpayCheckoutOptions = {}
) {
  const { user } = useAuth();
  const [status, setStatus] = useState<RazorpayStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const isBusy =
    status !== "idle" && status !== "success" && status !== "failed";

  const pay = useCallback(
    async (params: PayParams) => {
      setError(null);

      let paymentId: number | null = null;
      let settled = false;
      let orderId: number | null = null;

      try {
        // 1. Determine orderId (new OR existing)
        if ("existingOrderId" in params && params.existingOrderId) {
          orderId = params.existingOrderId;
        } else {
          setStatus("creating-order");
          if (!params.createOrder) {
            throw new Error("Missing order details.");
          }
          const order = await placeOrder({
            delivery_address: params.createOrder.delivery_address,
            notes: params.createOrder.notes ?? "",
          });
          orderId = order.id;
        }

        // 2. Create Razorpay order
        setStatus("creating-payment");
        const paymentData = await createPaymentOrder({ order_id: orderId });
        paymentId = paymentData.payment_id;

        // 3. Load script
        setStatus("opening-checkout");
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error(
            "Could not load the payment gateway. Check your connection and try again."
          );
        }

        // 4. Open modal
        await new Promise<void>((resolve, reject) => {
          async function markFailed() {
            if (!paymentId) return;
            try {
              await cancelPayment(paymentId);
            } catch {
              // Silent — backend may already be updated
            }
          }

          const rzp = new window.Razorpay({
            key: paymentData.razorpay_key_id,
            amount: paymentData.amount,
            currency: paymentData.currency,
            name: "Swiggy Clone",
            description: `Order #${orderId}`,
            order_id: paymentData.razorpay_order_id,
            prefill: {
              name: user?.username ?? "",
              email: user?.email ?? "",
            },
            theme: { color: "#fc8019" },

            handler: async (response) => {
              if (settled) return;
              settled = true;
              setStatus("verifying");
              try {
                const result = await verifyPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });

                if (result.success) {
                  clearCartNotes();
                  setStatus("success");
                  toast.success("Payment successful!");
                  options.onSuccess?.(orderId!);
                  resolve();
                } else {
                  throw new Error(
                    result.message || "Payment verification failed."
                  );
                }
              } catch (err) {
                const msg = extractErrorMessage(
                  err,
                  "Payment verification failed. Contact support if money was deducted."
                );
                setStatus("failed");
                setError(msg);
                toast.error(msg, { duration: 7000 });
                options.onFailure?.(msg, orderId ?? undefined);
                reject(err);
              }
            },

            modal: {
              ondismiss: async () => {
                if (settled) return;
                settled = true;

                // Tell backend this attempt is done
                await markFailed();

                setStatus("idle");

                // Let the caller navigate to the order detail page
                if (orderId) options.onDismiss?.(orderId);

                reject(new Error(DISMISS_SENTINEL));
              },
            },
          });

          rzp.open();
        });
      } catch (err) {
        if (err instanceof Error && err.message === DISMISS_SENTINEL) {
          return; // Silent — user just closed the modal
        }

        const msg = extractErrorMessage(
          err,
          "Could not complete payment. Please try again."
        );
        setStatus("failed");
        setError(msg);
        toast.error(msg, { duration: 7000 });
        options.onFailure?.(msg, orderId ?? undefined);
        throw err;
      }
    },
    [user, options]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { pay, status, error, isBusy, reset };
}