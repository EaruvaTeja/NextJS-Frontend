// hooks/useCart.ts
//
// Shortcut hook for consuming CartContext.
//
// Usage:
//   const { cart, itemCount, addItem } = useCart();

"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";

export function useCart() {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error(
      "useCart must be used inside a <CartProvider>. " +
        "Make sure <CartProvider> wraps your app in providers/index.tsx."
    );
  }

  return context;
}