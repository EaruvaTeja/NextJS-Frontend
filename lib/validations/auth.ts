// lib/validations/auth.ts
//
// Zod schemas for auth-related forms.
//
// IMPORTANT: These rules MIRROR the backend rules in
// users/serializers.py. If the backend rules change, update this file too.
//
// Why mirror them?
//   - Frontend validation = instant UX feedback (no network round trip)
//   - Backend validation = actual security (frontend can be bypassed)

import { z } from "zod";

// ---------------------------------------------------------------------------
// REGEX PATTERNS — mirror the backend exactly
// ---------------------------------------------------------------------------
// Username: starts with a letter, then letters/digits/underscore/hyphen.
// Examples OK:  john, John_99, jane-doe
// Examples BAD: 123john, _john, john@doe
const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9_-]*$/;

// Email: local part must start with a letter.
// Examples OK:  john@mail.com, john.doe+tag@mail.co.uk
// Examples BAD: 123@mail.com, _john@mail.com
const EMAIL_REGEX = /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Human name: starts with a letter, then letters/spaces/'/-/.
// Examples OK:  John, Mary Jane, O'Brien, Anne-Marie, St. John
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'\-.]*$/;

// Password requirements — one rule per regex
const PASSWORD_UPPER = /[A-Z]/;
const PASSWORD_LOWER = /[a-z]/;
const PASSWORD_DIGIT = /[0-9]/;
const PASSWORD_SPECIAL = /[^A-Za-z0-9]/;

// ---------------------------------------------------------------------------
// LOGIN SCHEMA
// ---------------------------------------------------------------------------
// Login is intentionally simple — we don't want to reject existing users
// whose passwords don't meet the new registration rules.
// The backend decides if credentials are valid.

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// REGISTER SCHEMA
// ---------------------------------------------------------------------------

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be 30 characters or fewer")
      .regex(
        USERNAME_REGEX,
        "Username must start with a letter and can only contain letters, numbers, underscores, and hyphens"
      ),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email")
      .regex(
        EMAIL_REGEX,
        "Email must start with a letter (e.g. john@example.com)"
      ),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(PASSWORD_UPPER, "Password must contain at least one uppercase letter")
      .regex(PASSWORD_LOWER, "Password must contain at least one lowercase letter")
      .regex(PASSWORD_DIGIT, "Password must contain at least one number")
      .regex(
        PASSWORD_SPECIAL,
        "Password must contain at least one special character"
      ),

    confirmPassword: z.string().min(1, "Please confirm your password"),

    first_name: z
      .string()
      .max(50, "First name must be 50 characters or fewer")
      .refine(
        (val) => val === "" || NAME_REGEX.test(val),
        "First name must start with a letter and can only contain letters, spaces, hyphens, apostrophes, and periods"
      ),

    last_name: z
      .string()
      .max(50, "Last name must be 50 characters or fewer")
      .refine(
        (val) => val === "" || NAME_REGEX.test(val),
        "Last name must start with a letter and can only contain letters, spaces, hyphens, apostrophes, and periods"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;