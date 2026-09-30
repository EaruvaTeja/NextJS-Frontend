// lib/api/payments.ts
//
// Payment API wrappers.
//
// Endpoints:
//   POST /api/payments/create/   -> PaymentCreateResponse
//   POST /api/payments/verify/   -> PaymentVerifyResponse
//   GET  /api/payments/          -> Payment[]
//
// All requests go through apiClient — JWT auto-attached, 401 handled.

import apiClient from "./client";
import type {
  Payment,
  PaymentCreateResponse,
  PaymentVerifyResponse,
  CreatePaymentOrderInput,
  VerifyPaymentInput,
} from "@/types/payment";

// ---------------------------------------------------------------------------
// CREATE — ask backend to create a Razorpay order
// ---------------------------------------------------------------------------
export async function createPaymentOrder(
  input: CreatePaymentOrderInput
): Promise<PaymentCreateResponse> {
  const { data } = await apiClient.post<PaymentCreateResponse>(
    "/payments/create/",
    input
  );
  return data;
}

// ---------------------------------------------------------------------------
// VERIFY — send Razorpay's callback data for signature verification
// ---------------------------------------------------------------------------
// On success: backend marks payment success, confirms order, clears cart.
// On failure: backend marks payment failed, order = payment_failed.
export async function verifyPayment(
  input: VerifyPaymentInput
): Promise<PaymentVerifyResponse> {
  const { data } = await apiClient.post<PaymentVerifyResponse>(
    "/payments/verify/",
    input
  );
  return data;
}

// ---------------------------------------------------------------------------
// LIST — payment history for this user
// ---------------------------------------------------------------------------
export async function fetchPayments(): Promise<Payment[]> {
  const { data } = await apiClient.get<Payment[]>("/payments/");
  return data;
}

// ---------------------------------------------------------------------------
// CANCEL — mark a payment as failed (abandoned / declined)
// ---------------------------------------------------------------------------
// Idempotent on the backend — safe to call multiple times.
export async function cancelPayment(paymentId: number): Promise<void> {
  await apiClient.post(`/payments/${paymentId}/cancel/`);
}