// components/cart/CouponDrawer.tsx
//
// Right-side slide-in panel for coupon selection (Sheet).
//
// UI-only for now: flip COUPONS_ENABLED to true once the backend supports
// applying coupons, and replace the TODO in handleApply.

"use client";

import { useId, useState, type FormEvent } from "react";
import { Tag, X, Sparkles, Info } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const COUPONS_ENABLED = false;

interface CouponDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAMPLE_COUPONS = [
  { code: "WELCOME50", label: "50% off on first order", tag: "New user" },
  { code: "FLAT100", label: "₹100 off on orders above ₹499", tag: "Popular" },
  { code: "FREESHIP", label: "Free delivery on this order", tag: "Limited" },
];

export function CouponDrawer({ open, onOpenChange }: CouponDrawerProps) {
  const inputId = useId();
  const [code, setCode] = useState("");

  function handleApply(codeToApply?: string) {
    if (!COUPONS_ENABLED) {
      toast.info("Coupons are coming soon!");
      return;
    }

    const value = (codeToApply ?? code).trim().toUpperCase();
    if (!value) {
      toast.error("Please enter a coupon code.");
      return;
    }

    // TODO: call the apply-coupon endpoint, then refresh the cart totals.
    toast.info("Coupons coming soon!");
    setCode("");
    onOpenChange(false);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // Enter key applies
    handleApply();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        // Same `data-[side=right]:` variant as the sheet's defaults, so
        // these actually win (plain `w-full` / `sm:max-w-md` would lose).
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        {/* Header — X on the LEFT, title next to it */}
        <div className="flex items-center gap-3 border-b px-4 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="
              flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center
              rounded-md text-foreground transition-colors hover:bg-zinc-100
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
            "
          >
            <X className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-left text-base font-semibold">
              Apply Coupon
            </SheetTitle>
            <SheetDescription className="text-left text-xs">
              Save more on your order
            </SheetDescription>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {!COUPONS_ENABLED && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-xs leading-relaxed text-amber-900">
                Coupons aren&apos;t live yet. The offers below are a preview
                and can&apos;t be applied.
              </p>
            </div>
          )}

          {/* Manual code input */}
          <form onSubmit={handleSubmit}>
            <label
              htmlFor={inputId}
              className="text-xs font-semibold text-foreground"
            >
              Enter coupon code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id={inputId}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="E.g. WELCOME50"
                maxLength={20}
                autoComplete="off"
                disabled={!COUPONS_ENABLED}
                className="
                  flex-1 rounded-md border border-zinc-200 bg-background
                  px-3 py-2 text-sm uppercase tracking-wider
                  placeholder:normal-case placeholder:tracking-normal
                  placeholder:text-muted-foreground
                  focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              />
              <Button
                type="submit"
                disabled={!COUPONS_ENABLED || !code.trim()}
                size="sm"
              >
                Apply
              </Button>
            </div>
          </form>

          {/* Available coupons */}
          <div>
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Available Coupons</span>
            </div>

            <div className="space-y-2.5">
              {SAMPLE_COUPONS.map((coupon) => (
                <button
                  key={coupon.code}
                  type="button"
                  onClick={() => handleApply(coupon.code)}
                  disabled={!COUPONS_ENABLED}
                  className="
                    group flex w-full items-start gap-3 rounded-lg
                    border border-dashed border-zinc-300 bg-zinc-50/50 p-3
                    text-left transition-colors
                    enabled:cursor-pointer enabled:hover:border-primary/60 enabled:hover:bg-primary/5
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                    disabled:cursor-not-allowed disabled:opacity-60
                  "
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Tag className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tracking-wide text-foreground">
                        {coupon.code}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {COUPONS_ENABLED ? coupon.tag : "Coming soon"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {coupon.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}