// components/common/InfoTooltip.tsx
//
// Small "i" icon that shows an explanation.
//
// Works on desktop AND mobile:
//   - Desktop: hover to open, mouse-leave to close
//   - Mobile: tap to toggle
//   - Tap / click outside → closes
//   - Escape → closes
//   - Smart positioning: never clips inside overflow-hidden cards or screen edges

"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Close on outside tap/click or Escape
  useEffect(() => {
    if (!open) return;

    function handleOutside(e: MouseEvent | TouchEvent) {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKey);
    
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Calculate fixed position to prevent overflow clipping
  useEffect(() => {
    if (!open || !buttonRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const tooltipWidth = 240; // Matches max-w-[240px]
      
      // Start centered above the button
      let left = rect.left + rect.width / 2;
      
      // Prevent right edge overflow (keep 16px padding from viewport edge)
      if (left + tooltipWidth / 2 > window.innerWidth - 16) {
        left = window.innerWidth - 16 - tooltipWidth / 2;
      }
      // Prevent left edge overflow
      if (left - tooltipWidth / 2 < 16) {
        left = 16 + tooltipWidth / 2;
      }

      setPosition({
        top: rect.top - 8, // 8px gap above the button
        left: left,
      });
    };

    // Calculate immediately
    updatePosition();
    
    // Recalculate on resize or scroll to stay anchored
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <span className="relative inline-flex shrink-0 items-center align-middle">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`More info: ${text}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="
          inline-flex items-center justify-center rounded-full
          p-1 text-muted-foreground/70 transition-all duration-200
          hover:bg-accent hover:text-accent-foreground
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
        "
      >
        <Info className="h-4 w-4" />
      </button>

      {open && position && (
        <span
          role="tooltip"
          className="
            fixed z-50 max-w-[240px] 
            rounded-lg border border-border bg-popover/95 
            px-3 py-2 text-xs font-medium leading-relaxed text-popover-foreground 
            shadow-lg backdrop-blur-sm
            transition-all duration-200 ease-out
            animate-in fade-in zoom-in-95
          "
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          {text}
          {/* Subtle directional arrow pointing down to the icon */}
          <span 
            className="
              absolute top-full left-1/2 h-2 w-2 
              -translate-x-1/2 -translate-y-1/2 rotate-45 
              border-b border-r border-border bg-popover/95
            " 
          />
        </span>
      )}
    </span>
  );
}