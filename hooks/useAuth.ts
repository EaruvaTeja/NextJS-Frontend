// hooks/useAuth.ts
//
// Shortcut hook for consuming AuthContext.
//
// Instead of:
//   import { useContext } from "react";
//   import { AuthContext } from "@/context/AuthContext";
//   const auth = useContext(AuthContext);
//
// You write:
//   import { useAuth } from "@/hooks/useAuth";
//   const auth = useAuth();

"use client";

import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used inside an <AuthProvider>. " +
        "Make sure <Providers> wraps your app in app/layout.tsx."
    );
  }

  return context;
}