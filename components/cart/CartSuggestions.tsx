// components/cart/CartSuggestions.tsx
//
// Delivery instructions for the whole order.
// Auto-saves on blur / Enter. Esc cancels.

"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { MessageSquarePlus, Quote } from "lucide-react";

import {
  CART_NOTES_MAX_LENGTH,
  getCartNotes,
  setCartNotes,
  subscribeCartNotes,
} from "@/lib/cart-notes";

const PLACEHOLDER = "Any delivery instructions? (e.g., Ring bell twice...)";
const getServerSnapshot = () => "";

export function CartSuggestions() {
  const notes = useSyncExternalStore(
    subscribeCartNotes,
    getCartNotes,
    getServerSnapshot
  );
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  // Set by Esc so the blur that follows does not save.
  const cancelledRef = useRef(false);

  function startEditing() {
    cancelledRef.current = false;
    setDraft(notes);
    setIsEditing(true);
  }

  function handleBlur() {
    if (cancelledRef.current) {
      cancelledRef.current = false;
    } else {
      setCartNotes(draft); // trims + persists (or removes when empty)
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur(); // blur saves
    } else if (e.key === "Escape") {
      cancelledRef.current = true;
      e.currentTarget.blur(); // blur discards
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
        Delivery Instructions
      </h3>

      {isEditing ? (
        <div className="flex w-full flex-col gap-1 rounded-xl border border-primary/30 bg-background px-3 py-2.5 ring-1 ring-primary/20">
          <div className="flex items-center gap-2.5">
            <MessageSquarePlus className="h-4 w-4 shrink-0 text-primary" />
            <input
              autoFocus
              value={draft}
              onChange={(e) =>
                setDraft(e.target.value.slice(0, CART_NOTES_MAX_LENGTH))
              }
              onFocus={(e) => {
                const len = e.currentTarget.value.length;
                e.currentTarget.setSelectionRange(len, len);
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              maxLength={CART_NOTES_MAX_LENGTH}
              aria-label="Delivery instructions"
              placeholder={PLACEHOLDER}
              className="w-full bg-transparent p-0 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
          <p className="text-right text-[10px] tabular-nums text-muted-foreground">
            {draft.length}/{CART_NOTES_MAX_LENGTH} · Enter to save, Esc to cancel
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          aria-label={
            notes
              ? `Edit delivery instructions: ${notes}`
              : "Add delivery instructions"
          }
          className="
            group flex w-full cursor-pointer items-start gap-2.5 rounded-xl
            border border-transparent bg-zinc-100/70 px-3 py-2.5 text-left
            transition-all hover:border-primary/30 hover:bg-primary/5
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
            dark:bg-zinc-800/50
          "
        >
          {notes ? (
            <>
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-primary/70 transition-colors group-hover:text-primary" />
              <span className="line-clamp-3 break-words text-xs font-medium italic text-foreground">
                {notes}
              </span>
            </>
          ) : (
            <>
              <MessageSquarePlus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary" />
              <span className="text-xs font-medium italic text-muted-foreground/70 transition-colors group-hover:text-primary">
                {PLACEHOLDER}
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}