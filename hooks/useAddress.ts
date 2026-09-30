// hooks/useAddress.ts
//
// Shortcut hook for consuming AddressContext.
//
// Usage:
//   const { addresses, selectedAddress, select } = useAddress();

"use client";

import { useContext } from "react";
import { AddressContext } from "@/context/AddressContext";

export function useAddress() {
  const context = useContext(AddressContext);

  if (context === undefined) {
    throw new Error(
      "useAddress must be used inside an <AddressProvider>. " +
        "Make sure <AddressProvider> wraps your app in providers/index.tsx."
    );
  }

  return context;
}