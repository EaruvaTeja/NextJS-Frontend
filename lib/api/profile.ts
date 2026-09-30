// lib/api/profile.ts
//
// Profile API wrappers.
//
// Backend rules (users/serializers.py ProfileSerializer):
//   read_only: id, username
//   editable:  email, first_name, last_name

import apiClient from "./client";
import type { User } from "@/types/auth";

export interface UpdateProfileInput {
  email?: string;
  first_name?: string;
  last_name?: string;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<User> {
  const { data } = await apiClient.patch<User>("/users/profile/", input);
  return data;
}