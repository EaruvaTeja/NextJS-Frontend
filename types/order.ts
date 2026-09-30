// types/order.ts
//
// TypeScript types for the Order domain.
//
// These MIRROR the backend serializers from orders/api_serializers.py:
//   - OrderReadSerializer
//   - OrderItemReadSerializer
//
// Endpoints:
//   GET  /api/orders/         -> Order[]
//   GET  /api/orders/<id>/    -> Order
//   POST /api/orders/         -> Order (creates from cart)

// ---------------------------------------------------------------------------
// ORDER STATUS
// ---------------------------------------------------------------------------
// Lifecycle:
//   awaiting_payment -> confirmed -> preparing -> out_for_delivery -> delivered
//   Can also be: payment_failed (retry), cancelled
//
// 'pending' is legacy — kept for backwards compat with the old API.
export type OrderStatus =
  | "awaiting_payment"
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "payment_failed"
  | "cancelled";

// ---------------------------------------------------------------------------
// NESTED — minimal restaurant inside an order
// ---------------------------------------------------------------------------
export interface OrderRestaurant {
  id: number;
  name: string;
  cuisine_type: string;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// NESTED — minimal menu item inside an order item
// ---------------------------------------------------------------------------
export interface OrderMenuItem {
  id: number;
  name: string;
  image: string | null;
  is_vegetarian: boolean;
  category:
    | "appetizer"
    | "main_course"
    | "dessert"
    | "beverage"
    | "side";
  is_available: boolean;
}

// ---------------------------------------------------------------------------
// ORDER ITEM
// ---------------------------------------------------------------------------
// Note: `price` is the SNAPSHOT price at order time, not the live menu price.
// `subtotal` = price × quantity.
export interface OrderItem {
  id: number;
  menu_item: OrderMenuItem;
  quantity: number;
  price: string;              // snapshot, DecimalField -> string
  special_instructions: string;
  subtotal: string;
}

// ---------------------------------------------------------------------------
// ORDER
// ---------------------------------------------------------------------------
// Money breakdown (all frozen snapshots at order time):
//   subtotal      - sum of item subtotals (pre-tax, pre-delivery)
//   delivery_fee  - frozen delivery charge (based on restaurant distance)
//   gst_amount    - frozen 18% GST (rounded to whole ₹)
//   total_amount  - subtotal + delivery_fee + gst_amount
//
// All are strings (DecimalField -> string in JSON).
export interface Order {
  id: number;
  restaurant: OrderRestaurant;
  status: OrderStatus;
  status_display: string;     // e.g. "Out for Delivery"
  subtotal: string;           // <-- NEW
  delivery_fee: string;       // <-- NEW
  gst_amount: string;         // <-- NEW
  total_amount: string;       // grand total
  delivery_address: string;
  notes: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}