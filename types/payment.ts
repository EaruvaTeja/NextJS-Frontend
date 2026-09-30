// types/payment.ts
//
// TypeScript types for the Payment domain.
//
// Mirrors:
//   payments/models.py
//   payments/api_serializers.py
//
// Endpoints:
//   POST /api/payments/create/   -> PaymentCreateResponse
//   POST /api/payments/verify/   -> PaymentVerifyResponse
//   GET  /api/payments/          -> Payment[]

import type { OrderStatus } from "./order";

// ---------------------------------------------------------------------------
// Payment status
// ---------------------------------------------------------------------------
export type PaymentStatus = "initiated" | "success" | "failed";

// ---------------------------------------------------------------------------
// Nested order reference inside a Payment
// ---------------------------------------------------------------------------
export interface PaymentOrderRef {
  id: number;
  status: OrderStatus;
  total_amount: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Payment record (read from GET /api/payments/)
// ---------------------------------------------------------------------------
export interface Payment {
  id: number;
  order: PaymentOrderRef;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  method: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Request / response shapes
// ---------------------------------------------------------------------------

// Body for POST /api/payments/create/
export interface CreatePaymentOrderInput {
  order_id: number;
}

// Response from POST /api/payments/create/
export interface PaymentCreateResponse {
  razorpay_order_id: string;
  razorpay_key_id: string;
  /** Amount in the smallest currency unit (paise) */
  amount: number;
  /** Human-readable amount (e.g. "565.00") */
  amount_display: string;
  currency: string;
  payment_id: number;
}

// Body for POST /api/payments/verify/
export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Response from POST /api/payments/verify/
export interface PaymentVerifyResponse {
  success: boolean;
  message: string;
  order_id: number;
  order_status: OrderStatus;
  payment_id: number;
  payment_status: PaymentStatus;
}

// ---------------------------------------------------------------------------
// Razorpay checkout callback payload (client-side)
// ---------------------------------------------------------------------------
// Passed to the `handler` on success.
export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// ---------------------------------------------------------------------------
// Razorpay global types
// ---------------------------------------------------------------------------
// Loaded at runtime via https://checkout.razorpay.com/v1/checkout.js
// We only declare what we use — keeps types lightweight.

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}