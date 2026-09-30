// components/address/AddressForm.tsx
//
// Modal form for creating or editing an address.
//
// Design note: The inner form body is keyed on the editing address id.
// When the modal opens (or the editing target changes), React remounts
// the body with fresh initial state — no setState-in-effect required.

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddress } from "@/hooks/useAddress";
import type { Address, AddressInput, AddressType } from "@/types/address";
import { ADDRESS_TYPE_LABELS } from "@/types/address";

interface AddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAddress?: Address | null;
  hideDefaultCheckbox?: boolean;
}

const TYPES: AddressType[] = ["home", "office", "other"];

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------
function validateForm(v: {
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}): string | null {
  if (!v.label.trim()) return "Label is required (e.g. 'Mom's place').";
  if (!v.full_name.trim()) return "Full name is required.";
  if (!/^\d{10}$/.test(v.phone.trim()))
    return "Phone must be exactly 10 digits.";
  if (!v.line1.trim()) return "Address line 1 is required.";
  if (!v.city.trim()) return "City is required.";
  if (!v.state.trim()) return "State is required.";
  if (!/^\d{6}$/.test(v.pincode.trim()))
    return "Pincode must be exactly 6 digits.";
  return null;
}

// ===========================================================================
// Shell — the Dialog + header + footer. Body is keyed.
// ===========================================================================
export function AddressForm({
  open,
  onOpenChange,
  editingAddress = null,
  hideDefaultCheckbox = false,
}: AddressFormProps) {
  const isEdit = editingAddress !== null;

  // Force a fresh mount of the form body whenever the editing target changes.
  // This gives us clean initial state without a setState-in-effect.
  const formKey = isEdit ? `edit-${editingAddress.id}` : "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-base">
            {isEdit ? "Edit Address" : "Add New Address"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Save this address for faster checkout.
          </DialogDescription>
        </DialogHeader>

        <AddressFormBody
          key={formKey}
          isEdit={isEdit}
          editingAddress={editingAddress}
          hideDefaultCheckbox={hideDefaultCheckbox}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================================
// Body — owns the actual form state, initialised from props at mount
// ===========================================================================
interface AddressFormBodyProps {
  isEdit: boolean;
  editingAddress: Address | null;
  hideDefaultCheckbox: boolean;
  onClose: () => void;
}

function AddressFormBody({
  isEdit,
  editingAddress,
  hideDefaultCheckbox,
  onClose,
}: AddressFormBodyProps) {
  const { create, update } = useAddress();

  // Initial state comes from props — no effect needed because
  // React remounts this component whenever `key` changes.
  const [addressType, setAddressType] = useState<AddressType>(
    editingAddress?.address_type ?? "home"
  );
  const [label, setLabel] = useState(editingAddress?.label ?? "");
  const [fullName, setFullName] = useState(editingAddress?.full_name ?? "");
  const [phone, setPhone] = useState(editingAddress?.phone ?? "");
  const [line1, setLine1] = useState(editingAddress?.line1 ?? "");
  const [line2, setLine2] = useState(editingAddress?.line2 ?? "");
  const [landmark, setLandmark] = useState(editingAddress?.landmark ?? "");
  const [city, setCity] = useState(editingAddress?.city ?? "");
  const [state, setState] = useState(editingAddress?.state ?? "");
  const [pincode, setPincode] = useState(editingAddress?.pincode ?? "");
  const [isDefault, setIsDefault] = useState(
    editingAddress?.is_default ?? false
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const error = validateForm({
      label,
      full_name: fullName,
      phone,
      line1,
      city,
      state,
      pincode,
    });
    if (error) {
      toast.error(error);
      return;
    }

    const payload: AddressInput = {
      address_type: addressType,
      label: label.trim(),
      full_name: fullName.trim(),
      phone: phone.trim(),
      line1: line1.trim(),
      line2: line2.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      is_default: isDefault,
    };

    setSubmitting(true);
    try {
      if (isEdit && editingAddress) {
        await update(editingAddress.id, payload);
        toast.success("Address updated");
      } else {
        await create(payload);
        toast.success("Address added");
      }
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: Record<string, string[] | string> };
      };
      const data = axiosErr.response?.data;
      let message = "Could not save address. Try again.";
      if (data && typeof data === "object") {
        const keys = Object.keys(data);
        if (keys.length > 0) {
          const first = data[keys[0]];
          message = Array.isArray(first) ? String(first[0]) : String(first);
        }
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form
        id="address-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
      >
        {/* Address type */}
        <div className="space-y-1.5">
          <Label>Address Type</Label>
          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-zinc-100 p-1">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAddressType(t)}
                className={`
                  rounded-md py-1.5 text-xs font-semibold transition-all
                  cursor-pointer
                  ${
                    addressType === t
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {ADDRESS_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Label */}
        <div className="space-y-1.5">
          <Label htmlFor="addr-label">Label</Label>
          <Input
            id="addr-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Mom's place, Gym, Beach house"
            maxLength={50}
            disabled={submitting}
          />
        </div>

        {/* Full name + Phone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="addr-name">Full Name</Label>
            <Input
              id="addr-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Who will receive it?"
              maxLength={100}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-phone">Phone</Label>
            <Input
              id="addr-phone"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10-digit mobile number"
              inputMode="numeric"
              maxLength={10}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Line 1 */}
        <div className="space-y-1.5">
          <Label htmlFor="addr-line1">Flat / Building / Street</Label>
          <Input
            id="addr-line1"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="e.g. 402, Sunrise Apartments, MG Road"
            maxLength={200}
            disabled={submitting}
          />
        </div>

        {/* Line 2 + Landmark */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="addr-line2">
              Area / Locality{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="addr-line2"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="e.g. Banjara Hills"
              maxLength={200}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-landmark">
              Landmark{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="addr-landmark"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Metro Station"
              maxLength={100}
              disabled={submitting}
            />
          </div>
        </div>

        {/* City / State / Pincode */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="addr-city">City</Label>
            <Input
              id="addr-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              maxLength={100}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-state">State</Label>
            <Input
              id="addr-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              maxLength={100}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-pincode">Pincode</Label>
            <Input
              id="addr-pincode"
              value={pincode}
              onChange={(e) =>
                setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="6-digit"
              inputMode="numeric"
              maxLength={6}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Default checkbox */}
        {!hideDefaultCheckbox && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 hover:bg-zinc-50">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
            />
            <span className="text-sm">
              <span className="font-semibold">Set as default</span>
              <span className="block text-xs text-muted-foreground">
                Use this address as the default for all orders.
              </span>
            </span>
          </label>
        )}
      </form>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" form="address-form" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Add address"
          )}
        </Button>
      </div>
    </>
  );
}