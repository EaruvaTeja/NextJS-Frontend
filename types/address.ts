// types/address.ts
//
// TypeScript types for the Address domain.
// Mirrors users/serializers.py AddressSerializer.

export type AddressType = "home" | "office" | "other";

// ---------------------------------------------------------------------------
// Full address record as returned by the backend
// ---------------------------------------------------------------------------
export interface Address {
  id: number;
  address_type: AddressType;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Input shape for create / update
// ---------------------------------------------------------------------------
export interface AddressInput {
  address_type: AddressType;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  home: "Home",
  office: "Office",
  other: "Other",
};

export const ADDRESS_LIMITS = {
  total: 10,
  home: 3,
  office: 3,
  other: 4,
} as const;