// components/address/AddressCard.tsx
//
// One address card in the profile list.
//
// Shows: type badge, default pill, name, address, phone, actions.

"use client";

import { Briefcase, Home as HomeIcon, MapPin, Pencil, Trash2, Star } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { Address, AddressType } from "@/types/address";
import { ADDRESS_TYPE_LABELS } from "@/types/address";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onSetDefault: (address: Address) => void;
}

// ---------------------------------------------------------------------------
// Type → icon + color
// ---------------------------------------------------------------------------
function TypeBadge({ type }: { type: AddressType }) {
  const config = {
    home: {
      Icon: HomeIcon,
      classes: "bg-blue-50 text-blue-700 border-blue-200",
    },
    office: {
      Icon: Briefcase,
      classes: "bg-purple-50 text-purple-700 border-purple-200",
    },
    other: {
      Icon: MapPin,
      classes: "bg-zinc-100 text-zinc-700 border-zinc-200",
    },
  }[type];

  const { Icon, classes } = config;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border px-2 py-0.5
        text-[10px] font-bold uppercase tracking-wide
        ${classes}
      `}
    >
      <Icon className="h-3 w-3" />
      {ADDRESS_TYPE_LABELS[type]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  return (
    <Card className="p-4">
      {/* Top row: type + default pill */}
      <div className="mb-2 flex items-center gap-2">
        <TypeBadge type={address.address_type} />
        {address.is_default && (
          <span
            className="
              inline-flex items-center gap-1 rounded-full border
              border-amber-200 bg-amber-50 px-2 py-0.5
              text-[10px] font-bold uppercase tracking-wide text-amber-700
            "
          >
            <Star className="h-3 w-3 fill-current" />
            Default
          </span>
        )}
      </div>

      {/* Label (bold) */}
      <h3 className="text-sm font-bold">{address.label}</h3>

      {/* Recipient */}
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        {address.full_name} · {address.phone}
      </p>

      {/* Address lines */}
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {address.line1}
        {address.line2 && `, ${address.line2}`}
        {address.landmark && `, ${address.landmark}`}
        <br />
        {address.city}, {address.state} — {address.pincode}
      </p>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-1.5 border-t pt-3">
        {!address.is_default && (
          <button
            type="button"
            onClick={() => onSetDefault(address)}
            className="
              inline-flex items-center gap-1 rounded-md border border-zinc-200
              bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground
              transition-colors hover:border-primary/40 hover:bg-primary/5
              hover:text-primary cursor-pointer
            "
          >
            <Star className="h-3 w-3" />
            Set as default
          </button>
        )}

        <button
          type="button"
          onClick={() => onEdit(address)}
          aria-label="Edit address"
          className="
            ml-auto flex h-7 w-7 items-center justify-center rounded-md
            text-muted-foreground transition-colors hover:bg-zinc-100
            hover:text-foreground cursor-pointer
          "
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(address)}
          aria-label="Delete address"
          className="
            flex h-7 w-7 items-center justify-center rounded-md
            text-muted-foreground transition-colors hover:bg-red-50
            hover:text-red-600 cursor-pointer
          "
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}