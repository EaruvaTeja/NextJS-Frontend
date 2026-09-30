// components/cart/AddToCartButton.tsx
//
// Swiggy-style ADD button + quantity stepper.
//
// Restaurant-mismatch handling:
//   When the backend returns 400 restaurant_mismatch, we open
//   <RestaurantMismatchDialog />. User can:
//     - Keep my cart -> dialog closes, nothing changes
//     - Clear & add  -> cart is cleared, then the item is added
//
// State separation:
//   `isBusy`             - loading on the trigger button (Add / stepper)
//   `isDialogSubmitting` - loading inside the mismatch dialog's confirm button

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { extractCartError } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useCart } from "@/hooks/useCart";
import { RestaurantMismatchDialog } from "./RestaurantMismatchDialog";

// Keep in sync with the backend's per-item limit.
const MAX_QUANTITY = 20;

interface AddToCartButtonProps {
  menuItemId: number;
  isAvailable: boolean;
  /** Used for accessible labels ("Add Paneer Tikka"). Optional. */
  itemName?: string;
}

// Shape of the backend's restaurant_mismatch error response
interface MismatchResponse {
  error?: string;
  detail?: string;
  current_restaurant?: { id: number; name: string };
  requested_restaurant?: { id: number; name: string };
}

export function AddToCartButton({
  menuItemId,
  isAvailable,
  itemName,
}: AddToCartButtonProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const {
    cart,
    isLoading: cartLoading,
    addItem,
    updateItem,
    removeItem,
    clear,
  } = useCart();

  // Trigger button loading
  const [isBusy, setIsBusy] = useState(false);

  // Dialog loading (independent from isBusy)
  const [isDialogSubmitting, setIsDialogSubmitting] = useState(false);

  // Mismatch dialog. `mismatchInfo` is kept after close so the dialog can
  // finish its close animation; it is overwritten on the next open.
  const [mismatchOpen, setMismatchOpen] = useState(false);
  const [mismatchInfo, setMismatchInfo] = useState<{
    currentName: string;
    newName: string;
  } | null>(null);

  const cartItem = cart?.items.find((i) => i.menu_item.id === menuItemId);
  const currentQuantity = cartItem?.quantity ?? 0;
  const label = itemName ?? "item";

  // ----------------------------------------------------------------------
  // ADD (first-time click)
  // ----------------------------------------------------------------------
  async function handleAdd() {
    if (authLoading) return;
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    setIsBusy(true);
    try {
      await addItem({ menu_item_id: menuItemId, quantity: 1 });
      toast.success("Added to cart");
    } catch (err) {
      const data = (err as { response?: { data?: MismatchResponse } }).response
        ?.data;

      if (data?.error === "restaurant_mismatch") {
        setMismatchInfo({
          currentName: data.current_restaurant?.name ?? "another restaurant",
          newName: data.requested_restaurant?.name ?? "this restaurant",
        });
        setMismatchOpen(true);
      } else {
        toast.error(extractCartError(err, "Could not add item. Try again."));
      }
    } finally {
      setIsBusy(false);
    }
  }

  // ----------------------------------------------------------------------
  // CLEAR & ADD (dialog confirm)
  // ----------------------------------------------------------------------
  // The backend has no atomic "replace cart" call, so this is two requests.
  // If the second one fails the cart is already empty — say so clearly.
  async function handleConfirmClearAndAdd() {
    setIsDialogSubmitting(true);
    let cleared = false;
    try {
      await clear();
      cleared = true;
      await addItem({ menu_item_id: menuItemId, quantity: 1 });
      toast.success("Cart cleared. Item added.");
      setMismatchOpen(false);
    } catch (err) {
      if (cleared) {
        toast.error(
          "Your old cart was cleared, but the new item couldn't be added. Please tap Add again."
        );
        setMismatchOpen(false);
      } else {
        toast.error(
          extractCartError(err, "Could not clear your cart. Try again.")
        );
      }
    } finally {
      setIsDialogSubmitting(false);
    }
  }

  function handleMismatchOpenChange(open: boolean) {
    setMismatchOpen(open);
    if (!open) setIsDialogSubmitting(false);
  }

  // ----------------------------------------------------------------------
  // STEPPER handlers
  // ----------------------------------------------------------------------
  async function handleIncrease() {
    if (!cartItem) return;
    if (cartItem.quantity >= MAX_QUANTITY) {
      toast.info(`You can add up to ${MAX_QUANTITY} of an item.`);
      return;
    }
    setIsBusy(true);
    try {
      await updateItem(cartItem.id, { quantity: cartItem.quantity + 1 });
    } catch (err) {
      toast.error(extractCartError(err, "Could not update quantity."));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDecrease() {
    if (!cartItem) return;
    setIsBusy(true);
    try {
      if (cartItem.quantity > 1) {
        await updateItem(cartItem.id, { quantity: cartItem.quantity - 1 });
      } else {
        await removeItem(cartItem.id);
        toast.success("Removed from cart");
      }
    } catch (err) {
      toast.error(extractCartError(err, "Could not update cart."));
    } finally {
      setIsBusy(false);
    }
  }

  // ----------------------------------------------------------------------
  // Unavailable
  // ----------------------------------------------------------------------
  if (!isAvailable) {
    return (
      <div className="inline-flex h-9 min-w-[96px] items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
        Unavailable
      </div>
    );
  }

  // Dialog is rendered at the root so it survives Add <-> stepper switches.
  const dialog = mismatchInfo ? (
    <RestaurantMismatchDialog
      open={mismatchOpen}
      onOpenChange={handleMismatchOpenChange}
      currentRestaurantName={mismatchInfo.currentName}
      newRestaurantName={mismatchInfo.newName}
      onConfirmClearAndAdd={handleConfirmClearAndAdd}
      isSubmitting={isDialogSubmitting}
    />
  ) : null;

  // ----------------------------------------------------------------------
  // Not in cart -> "ADD"
  // ----------------------------------------------------------------------
  if (currentQuantity === 0) {
    return (
      <>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isBusy || cartLoading}
          aria-label={`Add ${label} to cart`}
          className="
            inline-flex h-9 min-w-[96px] items-center justify-center
            rounded-md border border-green-600 bg-white
            px-4 text-sm font-bold uppercase tracking-wide text-green-700
            shadow-sm transition-all
            hover:bg-green-50 hover:shadow
            disabled:cursor-not-allowed disabled:opacity-70
            focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
          "
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin text-green-700" />
          ) : (
            "Add"
          )}
        </button>
        {dialog}
      </>
    );
  }

  // ----------------------------------------------------------------------
  // In cart -> stepper
  // ----------------------------------------------------------------------
  return (
    <>
      <div
        role="group"
        aria-label={`Quantity of ${label}`}
        className="
          inline-flex h-9 min-w-[96px] items-center justify-between
          rounded-md border border-green-600 bg-white
          shadow-sm
        "
      >
        <button
          type="button"
          onClick={handleDecrease}
          disabled={isBusy}
          aria-label={`Decrease quantity of ${label}`}
          className="
            flex h-full w-8 items-center justify-center
            rounded-l-md text-lg font-bold leading-none text-green-700
            transition-colors hover:bg-green-50
            focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          −
        </button>

        {isBusy ? (
          <Loader2
            className="h-3.5 w-3.5 animate-spin text-green-700"
            aria-hidden="true"
          />
        ) : (
          <span
            key={currentQuantity}
            aria-live="polite"
            className="animate-qty-pop text-sm font-bold tabular-nums text-green-700"
          >
            {currentQuantity}
          </span>
        )}

        <button
          type="button"
          onClick={handleIncrease}
          disabled={isBusy || currentQuantity >= MAX_QUANTITY}
          aria-label={`Increase quantity of ${label}`}
          className="
            flex h-full w-8 items-center justify-center
            rounded-r-md text-lg font-bold leading-none text-green-700
            transition-colors hover:bg-green-50
            focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          +
        </button>
      </div>
      {dialog}
    </>
  );
}