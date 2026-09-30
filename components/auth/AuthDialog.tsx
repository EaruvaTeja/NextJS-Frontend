// components/auth/AuthDialog.tsx
//
// The auth modal — a beautiful floating dialog for Login + Register.
//
// Layout strategy (fixes the resize-on-error problem):
//   - DialogContent is a flex column with max-h-[85vh]
//   - Header: fixed (flex-shrink-0) — brand icon + title
//   - Middle: scrollable (flex-1 overflow-y-auto) — tabs + form
//   - Footer: fixed (flex-shrink-0) — terms text
//
// When form errors appear and grow the middle section beyond the
// available space, ONLY the middle scrolls. The modal itself stays
// the same size. No jumping, no off-screen content.

"use client";

import { UtensilsCrossed } from "lucide-react";

import { useAuthModal } from "@/hooks/useAuthModal";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AuthDialog() {
  const { isOpen, view, setView, close } = useAuthModal();

  function handleOpenChange(open: boolean) {
    if (!open) {
      close();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          sm:max-w-md
          p-0 gap-0
          overflow-hidden
          max-h-[85vh]
          flex flex-col
        "
      >
        {/* ------------------------------------------------------------- */}
        {/* Brand header — FIXED height                                   */}
        {/* ------------------------------------------------------------- */}
        <DialogHeader className="flex-shrink-0 flex flex-col items-center gap-3 pt-8 pb-4 px-6 space-y-0 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-xl">
              Welcome to Swiggy Clone
            </DialogTitle>
            <DialogDescription className="text-sm">
              Order from your favourite places
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* ------------------------------------------------------------- */}
        {/* Middle section — SCROLLABLE                                   */}
        {/* ------------------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "login" | "register")}
            className="w-full"
          >
            {/* Tabs header — sticky at top of scroll area */}
            <div className="px-6 pt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="login" className="px-6 pb-6 pt-5 mt-0">
              <LoginForm onSuccess={close} onSwitchView={setView} />
            </TabsContent>

            <TabsContent value="register" className="px-6 pb-6 pt-5 mt-0">
              <RegisterForm onSuccess={close} onSwitchView={setView} />
            </TabsContent>
          </Tabs>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Footer — FIXED height                                         */}
        {/* ------------------------------------------------------------- */}
        <div className="flex-shrink-0 border-t px-6 py-3">
          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service &amp; Privacy
            Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
