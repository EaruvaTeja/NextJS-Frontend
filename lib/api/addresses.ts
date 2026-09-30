// lib/api/addresses.ts
//
// Address API wrappers.
//
// Endpoints (from users/api_address_urls.py):
//   GET    /api/addresses/                    -> Address[]
//   POST   /api/addresses/                    -> Address
//   GET    /api/addresses/<id>/               -> Address
//   PATCH  /api/addresses/<id>/               -> Address
//   DELETE /api/addresses/<id>/               -> 204
//   POST   /api/addresses/<id>/set-default/   -> Address

import apiClient from "./client";
import type { Address, AddressInput } from "@/types/address";

export async function fetchAddresses(): Promise<Address[]> {
  const { data } = await apiClient.get<Address[]>("/addresses/");
  return data;
}

export async function createAddress(input: AddressInput): Promise<Address> {
  const { data } = await apiClient.post<Address>("/addresses/", input);
  return data;
}

export async function updateAddress(
  id: number,
  input: Partial<AddressInput>
): Promise<Address> {
  const { data } = await apiClient.patch<Address>(
    `/addresses/${id}/`,
    input
  );
  return data;
}

export async function deleteAddress(id: number): Promise<void> {
  await apiClient.delete(`/addresses/${id}/`);
}

export async function setDefaultAddress(id: number): Promise<Address> {
  const { data } = await apiClient.post<Address>(
    `/addresses/${id}/set-default/`
  );
  return data;
}