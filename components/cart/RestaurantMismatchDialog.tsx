// components/cart/RestaurantMismatchDialog.tsx
//
// Shown when the user tries to add an item from a different restaurant
// than the one already in their cart.
//
// Offers two choices:
//   - "Keep my cart"    -> dismiss, nothing changes
//   - "Clear & add"     -> empty the cart, then add the new item
//
// Owned by AddToCartButton — one dialog instance per button.

"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RestaurantMismatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRestaurantName: string;
  newRestaurantName: string;
  onConfirmClearAndAdd: () => void;
  isSubmitting: boolean;
}

export function RestaurantMismatchDialog({
  open,
  onOpenChange,
  currentRestaurantName,
  newRestaurantName,
  onConfirmClearAndAdd,
  isSubmitting,
}: RestaurantMismatchDialogProps) {
  // Block Esc / overlay click / X while the request is in flight, otherwise
  // the dialog vanishes and the user never sees the outcome.
  function handleOpenChange(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Warning icon band */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg">
              Items from another restaurant
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Your cart currently has items from{" "}
              <span className="font-semibold text-foreground">
                {currentRestaurantName}
              </span>
              . To add items from{" "}
              <span className="font-semibold text-foreground">
                {newRestaurantName}
              </span>
              , we&apos;ll need to clear your current cart first.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Keep my cart
          </Button>
          <Button
            type="button"
            onClick={onConfirmClearAndAdd}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating cart…
              </>
            ) : (
              "Clear cart & add"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}