// providers/index.tsx
//
// Central place to wrap the entire app with all providers.
//
// Order matters:
//   AuthProvider         -- provides current user
//     AddressProvider    -- depends on user (addresses belong to user)
//       CartProvider     -- independent for now
//         AuthModalProvider
//           TooltipProvider
//             {children}
//             <AuthDialog />
//             <AuthRedirectHandler />
//             <Toaster />

"use client";

import { Suspense, type ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AddressProvider } from "@/context/AddressContext";
import { CartProvider } from "@/context/CartContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthRedirectHandler } from "@/components/auth/AuthRedirectHandler";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AddressProvider>
        <CartProvider>
          <AuthModalProvider>
            <TooltipProvider delayDuration={200}>
              {children}
              <AuthDialog />
              <Suspense fallback={null}>
                <AuthRedirectHandler />
              </Suspense>
              <Toaster
                richColors
                position="top-right"
                offset={80}
                duration={4000}
              />
            </TooltipProvider>
          </AuthModalProvider>
        </CartProvider>
      </AddressProvider>
    </AuthProvider>
  );
}