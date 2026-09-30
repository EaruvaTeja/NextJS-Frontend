// hooks/useAuthModal.ts
//
// Shortcut hook for consuming AuthModalContext.
//
// Usage:
//   const { open, close, view, setView } = useAuthModal();

"use client";

import { useContext } from "react";
import { AuthModalContext } from "@/context/AuthModalContext";

export function useAuthModal() {
  const context = useContext(AuthModalContext);

  if (context === undefined) {
    throw new Error(
      "useAuthModal must be used inside an <AuthModalProvider>. " +
        "Make sure <AuthModalProvider> wraps your app in providers/index.tsx."
    );
  }

  return context;
}