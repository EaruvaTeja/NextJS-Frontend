// components/address/AddressList.tsx
//
// Full address management UI for the profile page.
//
// Contains:
//   - Header with "N of 10" counter + Add button
//   - Empty state (when no addresses)
//   - List of AddressCards
//   - Delete confirmation dialog
//   - The AddressForm modal (create + edit share the same instance)

"use client";

import { useState } from "react";
import { MapPin, Plus, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddressCard } from "./AddressCard";
import { AddressForm } from "./AddressForm";
import { useAddress } from "@/hooks/useAddress";
import type { Address } from "@/types/address";
import { ADDRESS_LIMITS } from "@/types/address";

export function AddressList() {
  const { addresses, isLoading, remove, setDefault } = useAddress();

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Delete dialog state
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Set-default in-flight flag
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  const isFirstAddress = !addresses || addresses.length === 0;
  const isAtLimit =
    addresses !== null && addresses.length >= ADDRESS_LIMITS.total;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  function handleAdd() {
    if (isAtLimit) {
      toast.error(
        `You can have at most ${ADDRESS_LIMITS.total} addresses.`
      );
      return;
    }
    setEditingAddress(null);
    setFormOpen(true);
  }

  function handleEdit(address: Address) {
    setEditingAddress(address);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deletingAddress) return;
    setIsDeleting(true);
    try {
      await remove(deletingAddress.id);
      toast.success("Address deleted");
      setDeletingAddress(null);
    } catch {
      toast.error("Could not delete address.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSetDefault(address: Address) {
    setSettingDefaultId(address.id);
    try {
      await setDefault(address.id);
      toast.success(`"${address.label}" is now your default address.`);
    } catch {
      toast.error("Could not update default address.");
    } finally {
      setSettingDefaultId(null);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Card className="p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-tight">
            Saved Addresses
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {addresses
              ? `${addresses.length} of ${ADDRESS_LIMITS.total} saved`
              : "Loading…"}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={isAtLimit || isLoading}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add address
        </Button>
      </div>

      {/* Content */}
      <div className="mt-5">
        {isLoading && <AddressListSkeleton />}

        {!isLoading && isFirstAddress && (
          <EmptyAddressState onAdd={handleAdd} />
        )}

        {!isLoading && addresses && addresses.length > 0 && (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="relative">
                {settingDefaultId === addr.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                <AddressCard
                  address={addr}
                  onEdit={handleEdit}
                  onDelete={setDeletingAddress}
                  onSetDefault={handleSetDefault}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit form modal */}
      <AddressForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editingAddress={editingAddress}
        hideDefaultCheckbox={isFirstAddress}
      />

      {/* Delete confirmation */}
      <Dialog
        open={deletingAddress !== null}
        onOpenChange={(open) => !open && setDeletingAddress(null)}
      >
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg">
                Delete this address?
              </DialogTitle>
              <DialogDescription className="text-sm">
                <span className="font-semibold text-foreground">
                  {deletingAddress?.label}
                </span>{" "}
                ({deletingAddress?.full_name}) will be permanently removed.
                {deletingAddress?.is_default &&
                  " A different address will become your new default."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingAddress(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ===========================================================================
// Empty state
// ===========================================================================
function EmptyAddressState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <MapPin className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">No addresses yet</h3>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
        Save your home, office or any other address for faster checkout.
      </p>
      <Button type="button" onClick={onAdd} className="mt-5" size="sm">
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add your first address
      </Button>
    </div>
  );
}

// ===========================================================================
// Loading skeleton
// ===========================================================================
function AddressListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <Card key={i} className="p-4">
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          <div className="mt-3 h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
          <div className="mt-1 h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-8 w-full animate-pulse rounded bg-muted" />
        </Card>
      ))}
    </div>
  );
}