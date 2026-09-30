// components/layout/LocationPicker.tsx
//
// Location pill — shows the selected delivery address and lets the user
// switch between saved addresses.
//
// Three states:
//   1. Anonymous            -> "Login to select address" -> auth modal
//   2. Logged in, no addr   -> "Add delivery address" -> /profile
//   3. Logged in, has addr  -> shows selected + dropdown to change
//
// Two variants:
//   - default : two-line layout (label + address) — used in Hero + mobile menu
//   - compact : single-line pill — used in Navbar
//
// Selection is LOCAL (via AddressContext). Picking here does NOT change
// the DB-level default — that's only done from /profile → Addresses.

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  ChevronDown,
  Check,
  Plus,
  LogIn,
} from "lucide-react";

import { useAddress } from "@/hooks/useAddress";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";

interface LocationPickerProps {
  /** Visual density. "compact" fits in the Navbar. */
  variant?: "default" | "compact";
  /** Extra Tailwind classes for the trigger wrapper. */
  className?: string;
}

export function LocationPicker({
  variant = "default",
  className = "",
}: LocationPickerProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const {
    addresses,
    selectedAddress,
    select,
    isLoading: addrLoading,
  } = useAddress();

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------
  // Close on outside click / Escape
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // ---------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------
  function handleTrigger() {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!addresses || addresses.length === 0) {
      // No saved addresses -> send to profile to add one
      router.push("/profile?tab=addresses");
      return;
    }
    setOpen((v) => !v);
  }

  function handleSelect(id: number) {
    select(id);
    setOpen(false);
  }

  function handleAddNew() {
    setOpen(false);
    router.push("/profile?tab=addresses");
  }

  // ---------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------
  if (authLoading || (isAuthenticated && addrLoading)) {
    return (
      <div
        className={`
          flex h-9 items-center gap-2 rounded-md bg-zinc-100 px-3
          ${variant === "compact" ? "w-32" : "w-40"}
          animate-pulse
          ${className}
        `}
      />
    );
  }

  // ---------------------------------------------------------------------
  // Display content (based on state)
  // ---------------------------------------------------------------------
  const isCompact = variant === "compact";
  const hasAddresses = addresses && addresses.length > 0;

  // Icon + primary text + optional secondary text
  let icon: React.ReactNode = <MapPin className="h-4 w-4 text-primary" />;
  let primaryText = "Select address";
  let secondaryText: string | null = null;

  if (!isAuthenticated) {
    icon = <LogIn className="h-4 w-4 text-primary" />;
    primaryText = "Login to select address";
  } else if (!hasAddresses) {
    primaryText = "Add delivery address";
  } else if (selectedAddress) {
    primaryText = selectedAddress.label;
    secondaryText = isCompact
      ? null
      : `${selectedAddress.city} · ${selectedAddress.pincode}`;
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleTrigger}
        aria-expanded={open}
        aria-label="Change delivery location"
        className={`
          group flex w-full min-w-0 items-center gap-2 rounded-md
          text-left transition-colors hover:bg-zinc-100
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
          cursor-pointer
          ${isCompact ? "px-2.5 py-1.5" : "px-3 py-2"}
        `}
      >
        <span className="shrink-0">{icon}</span>

        <span className="min-w-0 flex-1">
          <span
            className={`
              block truncate font-semibold leading-tight text-foreground
              ${isCompact ? "text-xs" : "text-xs"}
            `}
          >
            {primaryText}
          </span>
          {secondaryText && (
            <span className="block truncate text-[10px] leading-tight text-muted-foreground">
              {secondaryText}
            </span>
          )}
        </span>

        {/* Chevron only when there's something to expand */}
        {isAuthenticated && hasAddresses && (
          <ChevronDown
            className={`
              h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform
              ${open ? "rotate-180" : ""}
            `}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && hasAddresses && (
        <div
          role="listbox"
          aria-label="Saved addresses"
          className="
            absolute left-0 top-full z-[100] mt-2
            w-[min(22rem,calc(100vw-2rem))]
            max-h-[min(24rem,70vh)] overflow-y-auto
            rounded-xl border border-zinc-200 bg-white shadow-2xl
            animate-in fade-in slide-in-from-top-1 duration-150
          "
        >
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-zinc-100 bg-white px-4 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Choose delivery address
            </p>
          </div>

          {/* Options */}
          <div className="p-1.5">
            {addresses!.map((addr) => {
              const isSelected = selectedAddress?.id === addr.id;
              return (
                <button
                  key={addr.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(addr.id)}
                  className={`
                    flex w-full items-start gap-3 rounded-lg px-3 py-2.5
                    text-left transition-colors cursor-pointer
                    ${isSelected ? "bg-primary/5" : "hover:bg-zinc-50"}
                  `}
                >
                  <MapPin
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`
                          truncate text-sm font-semibold
                          ${isSelected ? "text-primary" : "text-foreground"}
                        `}
                      >
                        {addr.label}
                      </span>
                      {addr.is_default && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {addr.line1}
                      {addr.line2 && `, ${addr.line2}`}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/80">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </span>
                  </span>
                  {isSelected && (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer — Add new */}
          <div className="border-t border-zinc-100 p-1.5">
            <button
              type="button"
              onClick={handleAddNew}
              className="
                flex w-full items-center gap-2 rounded-lg px-3 py-2.5
                text-left text-sm font-semibold text-primary
                transition-colors hover:bg-primary/5
                cursor-pointer
              "
            >
              <Plus className="h-4 w-4" />
              Add new address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}