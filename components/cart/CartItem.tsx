// components/cart/CartItem.tsx
"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { Quote, Loader2, Utensils, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { extractCartError } from "@/context/CartContext";
import { resolveImageUrl } from "@/lib/image";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import type { CartItem as CartItemType } from "@/types/cart";

interface CartItemProps {
  item: CartItemType;
}

// ---------------------------------------------------------------------------
// Veg indicator (Sharp  & Authentic)
// ---------------------------------------------------------------------------
function VegIndicator({ isVeg }: { isVeg: boolean }) {
  const color = isVeg
    ? "text-green-600 border-green-600 "
    : "text-red-600 border-red-600 ";
  return (
    <span
      className={`relative flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] ${color}`}
      aria-label={isVeg ? "Vegetarian " : "Non-vegetarian "}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isVeg ? "bg-green-600" : "bg-red-600"}`}
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Inline note — blur-to-save UX
// ---------------------------------------------------------------------------
function InlineNote({ item }: { item: CartItemType }) {
  const { updateItem } = useCart();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Set by Esc so the blur that follows does NOT save. Relying on the input
  // unmounting is browser-dependent (Chrome fires blur on removal, Firefox
  // does not).
  const cancelledRef = useRef(false);

  // Enter edit mode — seed the draft with the current note.
  function startEditing() {
    cancelledRef.current = false;
    setDraft(item.special_instructions || "");
    setIsEditing(true);
  }

  async function handleSave(valueToSave: string) {
    const trimmed = valueToSave.trim();
    const current = (item.special_instructions || "").trim();
    if (trimmed === current) {
      setIsEditing(false);
      setDraft("");
      return;
    }
    setIsEditing(false);
    setIsSaving(true);
    try {
      await updateItem(item.id, { special_instructions: trimmed });
      toast.success(trimmed ? "Note saved" : "Note removed");
    } catch (err) {
      toast.error(extractCartError(err, "Could not save note."));
    } finally {
      setIsSaving(false);
      setDraft("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur(); // Blurring triggers the save seamlessly
    } else if (e.key === "Escape") {
      cancelledRef.current = true; // blur below must not save
      inputRef.current?.blur();
    }
  }

  // 1. Saving State (Sleek inline spinner)
  if (isSaving) {
    return (
      <div className="group mt-1 flex min-h-[28px] max-w-full items-center gap-1.5 text-left opacity-60">
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" />
        <span className="line-clamp-1 text-[11px] font-medium italic text-muted-foreground">
          {draft ? draft : "Removing note... "}
        </span>
      </div>
    );
  }

  // 2. Editing State (Clean, buttonless input)
  if (isEditing) {
    return (
      <div className="relative mt-1 flex h-7 items-center gap-1.5 w-full">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 100))}
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            if (cancelledRef.current) {
              cancelledRef.current = false;
              setIsEditing(false);
              setDraft(" ");
              return;
            }
            void handleSave(e.target.value);
          }}
          autoFocus
          aria-label="Cooking instructions for this item "
          maxLength={100}
          placeholder="eg. Make it extra spicy... "
          className="
            h-full w-full rounded-md border border-primary/30 bg-primary/5
            px-2.5 text-[11px] font-medium text-foreground
            placeholder:text-primary/40 focus:border-primary
            focus:outline-none  focus:ring-1 focus:ring-primary/20
            transition-all
          "
        />
      </div>
    );
  }

  // 3. Display State (Shows saved note)
  if (item.special_instructions) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className="group mt-1 flex min-h-[28px] max-w-full cursor-pointer items-center gap-1.5 text-left"
      >
        <Quote className="h-3 w-3 shrink-0 text-primary/60 transition-colors group-hover:text-primary" />
        <span className="line-clamp-1 text-[11px] font-medium italic text-muted-foreground transition-colors group-hover:text-primary">
          {item.special_instructions}
        </span>
      </button>
    );
  }

  // 4. Empty State (Sleek, minimalist unboxed text matching the italic style)
  return (
    <button
      type="button"
      onClick={startEditing}
      className="group mt-1 flex min-h-[28px] max-w-full cursor-pointer items-center gap-1.5 text-left"
    >
      <Plus className="h-3 w-3 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
      <span className="text-[11px] font-medium italic text-muted-foreground/70 transition-colors group-hover:text-primary">
        Add cooking instructions...
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function CartItem({ item }: CartItemProps) {
  const { removeItem } = useCart();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const priceNum = Number(item.menu_item.price);
  const subtotalNum = Number(item.subtotal);
  const imageUrl = resolveImageUrl(item.menu_item.image);
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl;

  // Backend may not send this yet; only an explicit `false` counts.
  const isUnavailable = item.menu_item.is_available === false;

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await removeItem(item.id);
      toast.success("Removed from cart");
    } catch (err) {
      toast.error(extractCartError(err, "Could not remove item."));
      setIsRemoving(false);
    }
  }

  return (
    <div className="group relative flex gap-3.5 rounded-2xl border border-zinc-200/60 bg-background p-3 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800/80">
      {/* Image */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/5 dark:border-white/5">
        {showImage ? (
          <Image
            src={imageUrl!}
            alt={item.menu_item.name}
            fill
            sizes="64px"
            className="object-cover"
            onError={() => setFailedUrl(imageUrl ?? null)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-800/50">
            <Utensils
              className="h-5 w-5 text-zinc-300 dark:text-zinc-600"
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>
      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        {/* Row 1 — veg + name | subtotal */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2 pt-0.5">
            <div className="pt-[2px]">
              <VegIndicator isVeg={item.menu_item.is_vegetarian} />
            </div>
            <h3
              className={`line-clamp-2 text-sm font-bold tracking-tight ${
                isUnavailable
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }`}
              title={item.menu_item.name}
            >
              {item.menu_item.name}
            </h3>
          </div>
          <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
            ₹{formatPrice(subtotalNum)}
          </p>
        </div>
        {/* Row 2 — price × qty | stepper */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-muted-foreground/80">
            ₹{formatPrice(priceNum)} × {item.quantity}
          </p>
          <div className="shrink-0 scale-95 origin-right">
            {isUnavailable ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isRemoving}
                className="
                  inline-flex h-9 items-center gap-1.5 rounded-md border
                  border-red-300 bg-white px-3 text-xs font-bold text-red-600
                  transition-colors hover:bg-red-50
                  disabled:cursor-not-allowed disabled:opacity-60
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400
                "
              >
                {isRemoving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Remove
              </button>
            ) : (
              <AddToCartButton
                menuItemId={item.menu_item.id}
                isAvailable={true}
                itemName={item.menu_item.name}
              />
            )}
          </div>
        </div>
        {isUnavailable && (
          <p className="mt-1 text-[11px] font-semibold text-red-600">
            No longer available. Remove it to continue.
          </p>
        )}
        {/* Row 3 — note */}
        <InlineNote item={item} />
      </div>
    </div>
  );
}
