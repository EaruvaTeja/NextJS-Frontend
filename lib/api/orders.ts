// lib/api/orders.ts
//
// Order API wrappers.
//
// All requests go through apiClient — the shared Axios instance that:
//   - Attaches the JWT automatically
//   - Handles 401 (silent token refresh)
//   - Uses the correct base URL
//
// Endpoints (from orders/api_urls.py):
//   GET  /api/orders/         -> Order[]        (this user's orders)
//   GET  /api/orders/<id>/    -> Order          (one order, ownership-scoped)
//   POST /api/orders/         -> Order          (creates from current cart)

import apiClient from "./client";
import type { Order } from "@/types/order";

// ---------------------------------------------------------------------------
// LIST ORDERS
// ---------------------------------------------------------------------------
// Returns all orders for the authenticated user, newest first.
export async function fetchOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>("/orders/");
  return data;
}

// ---------------------------------------------------------------------------
// SINGLE ORDER
// ---------------------------------------------------------------------------
// 404 if the order doesn't exist OR belongs to another user.
export async function fetchOrder(orderId: number | string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${orderId}/`);
  return data;
}

// ---------------------------------------------------------------------------
// PLACE ORDER
// ---------------------------------------------------------------------------
// Reads items from the server-side cart. The client only sends
// delivery address and notes.
//
// NOTE: Currently lives in cart/api_views.py? No — in orders/api_views.py
// after our Day 4-ish work. If the endpoint changes, update only this file.
export async function placeOrder(input: {
  delivery_address: string;
  notes?: string;
}): Promise<Order> {
  const { data } = await apiClient.post<Order>("/orders/", input);
  return data;
}