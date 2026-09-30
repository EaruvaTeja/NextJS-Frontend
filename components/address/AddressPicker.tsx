// components/address/AddressPicker.tsx
//
// Delivery address card + selection dialog for the cart page.
//
// Two visual states:
//   - No addresses saved  -> CTA "Add delivery address" (opens form)
//   - Has addresses       -> shows the selected one + "Change" (opens dialog)
//
// Selection is LOCAL (via AddressContext) — picking an address here does
// NOT change the DB default. That's only done from /profile → Addresses.

"use client";

import { useState } from "react";
import { MapPin, ChevronRight, Plus, Check } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddressForm } from "./AddressForm";
import { useAddress } from "@/hooks/useAddress";
import type { Address } from "@/types/address";
import { ADDRESS_TYPE_LABELS } from "@/types/address";

export function AddressPicker() {
  const { addresses, selectedAddress, select, isLoading } = useAddress();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  function handleOpen() {
    if (!addresses || addresses.length === 0) {
      setFormOpen(true);
    } else {
      setDialogOpen(true);
    }
  }

  function handleSelect(addr: Address) {
    select(addr.id);
    setDialogOpen(false);
  }

  function handleAddNew() {
    setDialogOpen(false);
    setFormOpen(true);
  }

  // -------------------------------------------------------------------------
  // Loading skeleton
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // No addresses
  // -------------------------------------------------------------------------
  if (!addresses || addresses.length === 0) {
    return (
      <>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Delivery address
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                Add a delivery address
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                You need at least one address to place an order.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleOpen}
                className="mt-3"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add address
              </Button>
            </div>
          </div>
        </Card>

        <AddressForm
          open={formOpen}
          onOpenChange={setFormOpen}
          hideDefaultCheckbox
        />
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Has addresses
  // -------------------------------------------------------------------------
  return (
    <>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Delivering to
              </p>
              <button
                type="button"
                onClick={handleOpen}
                className="
                  inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5
                  text-[11px] font-semibold text-primary
                  transition-colors hover:bg-primary/5 cursor-pointer
                "
              >
                Change
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {selectedAddress && (
              <>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-700">
                    {ADDRESS_TYPE_LABELS[selectedAddress.address_type]}
                  </span>
                  {selectedAddress.is_default && (
                    <span className="text-[10px] font-semibold text-amber-700">
                      · Default
                    </span>
                  )}
                </div>

                <p className="mt-1 truncate text-sm font-semibold">
                  {selectedAddress.full_name} · {selectedAddress.phone}
                </p>

                <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
                  {selectedAddress.line1}
                  {selectedAddress.line2 && `, ${selectedAddress.line2}`},{" "}
                  {selectedAddress.city} — {selectedAddress.pincode}
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* ---------------------- Selection dialog ---------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="
            sm:max-w-md p-0 gap-0 overflow-hidden
            max-h-[80vh] flex flex-col
          "
        >
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="text-base">
              Select delivery address
            </DialogTitle>
            <DialogDescription className="text-xs">
              {addresses.length} saved · pick one for this order
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-2">
            {addresses.map((addr) => {
              const isSelected = selectedAddress?.id === addr.id;
              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => handleSelect(addr)}
                  className={`
                    flex w-full items-start gap-3 rounded-lg p-3 text-left
                    transition-colors cursor-pointer
                    ${isSelected ? "bg-primary/5" : "hover:bg-zinc-50"}
                  `}
                >
                  {/* Radio circle */}
                  <div className="mt-0.5 shrink-0">
                    <div
                      className={`
                        flex h-5 w-5 items-center justify-center rounded-full border-2
                        ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-zinc-300"
                        }
                      `}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-700">
                        {ADDRESS_TYPE_LABELS[addr.address_type]}
                      </span>
                      {addr.is_default && (
                        <span className="text-[10px] font-semibold text-amber-700">
                          · Default
                        </span>
                      )}
                    </div>

                    <p className="mt-1 truncate text-sm font-semibold">
                      {addr.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {addr.full_name} · {addr.phone}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground line-clamp-2">
                      {addr.line1}
                      {addr.line2 && `, ${addr.line2}`}, {addr.city} —{" "}
                      {addr.pincode}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t p-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddNew}
              className="w-full"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add new address
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------------- Add new form ---------------------- */}
      <AddressForm open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}