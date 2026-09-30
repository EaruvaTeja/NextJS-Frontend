// lib/bill.ts
//
// Client-side bill PREVIEW.
//
// IMPORTANT: This file must mirror the exact math done on the backend
// in orders/models.py so the user sees the same total on the cart page
// as they will be charged at checkout.
//
// Backend reference (orders/models.py):
//   - DELIVERY_FEE_TIERS: tiered by restaurant distance
//   - GST_RATE = 0.18
//   - GST is rounded to the nearest whole rupee (ignoring paise)
//   - Subtotal and total keep 2 decimals
//
// If you change anything here, update orders/models.py to match —
// and vice versa.

// ---------------------------------------------------------------------------
// Delivery fee tiers
// ---------------------------------------------------------------------------
// (max_km, fee_in_rupees)
// First matching tier wins. Distances above the last tier pay the
// highest tier's fee.
// ---------------------------------------------------------------------------
export const DELIVERY_FEE_TIERS: Array<[number, number]> = [
  [2, 25],
  [5, 43],
  [8, 65],
  [12, 80],
  [16, 100],
  [20, 130],
  [25, 170],
  [30, 240],
];

export const GST_RATE = 0.18; // 18%

// ---------------------------------------------------------------------------
// Rounding helpers
// ---------------------------------------------------------------------------
// Math.round in JS rounds half away from zero for positive numbers —
// equivalent to Python's ROUND_HALF_UP.
//   12.49 -> 12
//   12.50 -> 13
//   12.51 -> 13
// ---------------------------------------------------------------------------
const roundToWhole = (n: number) => Math.round(n);
const round2 = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;

// ---------------------------------------------------------------------------
// calculateDeliveryFee
// ---------------------------------------------------------------------------
// Return the delivery fee for a given distance (in km).
// Non-numeric or negative inputs are treated as 0.
// ---------------------------------------------------------------------------
export function calculateDeliveryFee(distanceKm: number | string): number {
  const distance = Number(distanceKm);
  if (!Number.isFinite(distance) || distance < 0) {
    return 0;
  }

  for (const [maxKm, fee] of DELIVERY_FEE_TIERS) {
    if (distance <= maxKm) {
      return fee;
    }
  }

  // Above the last tier: pay the highest tier's fee.
  return DELIVERY_FEE_TIERS[DELIVERY_FEE_TIERS.length - 1][1];
}

// ---------------------------------------------------------------------------
// calculateBill
// ---------------------------------------------------------------------------
// Compute the full bill breakdown.
//
// Inputs:
//   itemTotal   - sum of item subtotals (from cart.total)
//   distanceKm  - restaurant's distance in km (from cart.restaurant.distance_km)
//
// Returns:
//   {
//     itemTotal:   number,   // 2 decimals
//     deliveryFee: number,   // whole rupees (per tier)
//     gst:         number,   // WHOLE rupees (18% of itemTotal, rounded)
//     grandTotal:  number,   // itemTotal + deliveryFee + gst, 2 decimals
//   }
//
// Special cases:
//   - Empty cart (itemTotal <= 0): no delivery, no GST, no total.
//   - Missing/invalid distance: delivery fee = 0.
// ---------------------------------------------------------------------------
export interface BillBreakdown {
  itemTotal: number;
  deliveryFee: number;
  gst: number;
  grandTotal: number;
}

export function calculateBill(
  itemTotal: number,
  distanceKm?: number | string
): BillBreakdown {
  // Guard against NaN / negative inputs.
  const safeItemTotal =
    Number.isFinite(itemTotal) && itemTotal > 0 ? itemTotal : 0;

  // Empty cart -> zero everything.
  if (safeItemTotal === 0) {
    return {
      itemTotal: 0,
      deliveryFee: 0,
      gst: 0,
      grandTotal: 0,
    };
  }

  const deliveryFee = calculateDeliveryFee(distanceKm ?? 0);

  // GST: 18% of itemTotal, then rounded to whole rupees.
  const gst = roundToWhole(safeItemTotal * GST_RATE);

  const grandTotal = round2(safeItemTotal + deliveryFee + gst);

  return {
    itemTotal: round2(safeItemTotal),
    deliveryFee,
    gst,
    grandTotal,
  };
}