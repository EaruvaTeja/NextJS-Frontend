// components/cart/CartList.tsx
//
// Vertical list of <CartItem /> rows, plus the non-happy-path cards the cart
// page shows:
//   <CartEmptyState />     - logged in, no items
//   <CartSignedOutState /> - guest

"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { CartItem } from "./CartItem";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/hooks/useAuthModal";
import type { CartItem as CartItemType } from "@/types/cart";

interface CartListProps {
  items: CartItemType[];
}

export function CartList({ items }: CartListProps) {
  return (
    <ul className="flex flex-col gap-4" aria-label="Items in your cart">
      {items.map((item) => (
        <li key={item.id}>
          <CartItem item={item} />
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
export function CartEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <ShoppingBag className="h-9 w-9 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Your cart is empty</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Looks like you haven&apos;t added anything yet. Browse our
        restaurants and start ordering!
      </p>
      <Button
        className="mt-6"
        nativeButton={false}
        render={<Link href="/restaurants" />}
      >
        Browse restaurants
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Guest
// ---------------------------------------------------------------------------
export function CartSignedOutState() {
  const { open } = useAuthModal();
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <ShoppingBag className="h-9 w-9 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Log in to see your cart</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your cart is saved to your account, so you can pick up where you left
        off on any device.
      </p>
      <Button className="mt-6" onClick={() => open("login")}>
        Log in
      </Button>
    </div>
  );
}
