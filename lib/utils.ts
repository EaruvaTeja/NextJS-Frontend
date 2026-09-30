export { cn } from "cn"

// Whole numbers drop ".00" (₹150), everything else keeps 2 decimals (₹247.50).
// Same style as the order detail page.
export function formatPrice(value: number | string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}