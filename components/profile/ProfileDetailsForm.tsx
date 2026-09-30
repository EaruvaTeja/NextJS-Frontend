// components/profile/ProfileDetailsForm.tsx
//
// Profile details form using the Change / Update pattern.
// Each field receives an `isDirty` flag computed from the original user
// record — used to display a small orange dot next to the label.

"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditableField } from "./EditableField";
import { updateProfile } from "@/lib/api/profile";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types/auth";

interface ProfileDetailsFormProps {
  user: User;
}

// ---------------------------------------------------------------------------
// Email validator — mirrors backend rules
// ---------------------------------------------------------------------------
const EMAIL_REGEX = /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function validateEmail(value: string): string | null {
  if (!value) return "Email is required.";

  if (!value.includes("@")) {
    return "Email must include an '@' symbol (e.g. john@example.com).";
  }

  const parts = value.split("@");
  if (parts.length !== 2) {
    return "Email must contain exactly one '@' symbol.";
  }

  const [localPart, domain] = parts;
  if (!localPart) {
    return "Email must have text before the '@' (e.g. john@example.com).";
  }
  if (!/^[A-Za-z]/.test(localPart)) {
    return "Email must start with a letter (e.g. john@example.com).";
  }
  if (!domain) {
    return "Email must have a domain after the '@' (e.g. gmail.com).";
  }
  if (!domain.includes(".")) {
    return "Email domain must include a dot (e.g. gmail.com).";
  }
  if (!EMAIL_REGEX.test(value)) {
    return "Please enter a valid email (e.g. john@example.com).";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Name validator
// ---------------------------------------------------------------------------
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'\-.]*$/;

function validateName(value: string, label: string): string | null {
  if (!value) return null; // optional
  if (!NAME_REGEX.test(value)) {
    return `${label} must start with a letter (letters, spaces, hyphens, apostrophes, periods only).`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ProfileDetailsForm({ user }: ProfileDetailsFormProps) {
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState(user.email ?? "");
  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [submitting, setSubmitting] = useState(false);

  // Per-field dirty flags — compare current draft vs saved user record
  const emailDirty = email.trim() !== (user.email ?? "").trim();
  const firstNameDirty = firstName.trim() !== (user.first_name ?? "").trim();
  const lastNameDirty = lastName.trim() !== (user.last_name ?? "").trim();

  const anyDirty = emailDirty || firstNameDirty || lastNameDirty;

  function resetDrafts() {
    setEmail(user.email ?? "");
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!anyDirty) return;

    const emailError = validateEmail(email.trim());
    if (emailError) {
      toast.error(emailError);
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      await refreshUser();
      toast.success("Profile updated");
    } catch (error: unknown) {
      const axiosErr = error as {
        response?: { data?: Record<string, string[] | string> };
      };
      const data = axiosErr.response?.data;

      let message = "Could not update profile. Try again.";
      if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const firstValue = data[firstKey];
        message = Array.isArray(firstValue)
          ? firstValue[0]
          : String(firstValue);
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-bold tracking-tight">
        Personal Information
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Click <span className="font-semibold">Change</span> to edit a field.
        Click <span className="font-semibold">Update</span> to confirm your
        edits, then{" "}
        <span className="font-semibold">Save changes</span> to persist.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Username — locked */}
        <EditableField
          id="profile-username"
          label="Username"
          value={user.username}
          onChange={() => {}}
          locked
          hint="Usernames cannot be changed."
        />

        {/* Email */}
        <EditableField
          id="profile-email"
          label="Email"
          value={email}
          onChange={setEmail}
          isDirty={emailDirty}
          type="email"
          placeholder="you@example.com"
          maxLength={254}
          validate={validateEmail}
          hint="Must start with a letter (e.g. john@example.com)."
        />

        {/* Names side by side */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <EditableField
            id="profile-first-name"
            label="First Name"
            value={firstName}
            onChange={setFirstName}
            isDirty={firstNameDirty}
            placeholder="Enter first name"
            maxLength={50}
            validate={(v) => validateName(v, "First name")}
          />
          <EditableField
            id="profile-last-name"
            label="Last Name"
            value={lastName}
            onChange={setLastName}
            isDirty={lastNameDirty}
            placeholder="Enter last name"
            maxLength={50}
            validate={(v) => validateName(v, "Last name")}
          />
        </div>

                {/* Save / Discard row — wraps on mobile */}
        <div className="flex flex-wrap items-center gap-3 border-t pt-5">
          <Button
            type="submit"
            disabled={submitting || !anyDirty}
            className="min-w-[150px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>

          {anyDirty && !submitting && (
            <button
              type="button"
              onClick={resetDrafts}
              className="
                group inline-flex items-center gap-1.5 rounded-md border
                border-transparent px-2.5 py-1.5 text-xs font-medium
                text-muted-foreground
                transition-all duration-150
                hover:border-zinc-200 hover:bg-zinc-50 hover:text-foreground
                active:scale-95
                cursor-pointer
              "
            >
              <RotateCcw className="h-3 w-3 transition-transform duration-300 group-hover:-rotate-180" />
              Discard all
            </button>
          )}

          {anyDirty && !submitting && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 sm:ml-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}