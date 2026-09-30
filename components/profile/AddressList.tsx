// components/profile/AddressList.tsx
//
// Addresses tab — placeholder for now.
//
// When we add an Address model on the backend, this becomes a real
// CRUD UI. For now, it communicates the feature is coming.

"use client";

import { MapPin, Plus } from "lucide-react";

import { Card } from "@/components/ui/card";

export function AddressList() {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-tight">
            Saved Addresses
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Save home, work and other addresses for faster checkout.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed py-12 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <MapPin className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-sm font-semibold">
          Address management coming soon
        </h3>
        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
          We&apos;re building this feature. Soon you&apos;ll be able to save
          multiple addresses and pick one at checkout.
        </p>
        <button
          type="button"
          disabled
          className="
            mt-5 inline-flex items-center gap-1.5 rounded-full border
            border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium
            text-muted-foreground cursor-not-allowed
          "
        >
          <Plus className="h-3.5 w-3.5" />
          Add address
        </button>
      </div>
    </Card>
  );
}