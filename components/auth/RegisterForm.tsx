// components/auth/RegisterForm.tsx
//
// Register form with password visibility toggles on both fields.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import {
  registerSchema,
  type RegisterFormData,
} from "@/lib/validations/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldError } from "@/components/ui/field";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchView?: (view: "login" | "register") => void;
}

const FORM_FIELDS = [
  "username",
  "email",
  "password",
  "first_name",
  "last_name",
] as const;

// Reusable password input with toggle. Declared as a helper component
// to avoid duplicating the toggle markup across the two password fields.
interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  autoComplete: string;
  disabled: boolean;
  show: boolean;
  onToggle: () => void;
}

function PasswordInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  disabled,
  show,
  onToggle,
}: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="
          absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2
          items-center justify-center rounded-md
          text-muted-foreground transition-colors
          hover:bg-zinc-100 hover:text-foreground
          disabled:cursor-not-allowed disabled:opacity-50
          cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
        "
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function RegisterForm({ onSuccess, onSwitchView }: RegisterFormProps) {
  const router = useRouter();
  const { register } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      first_name: "",
      last_name: "",
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = data;
      void confirmPassword;

      await register(payload);
      toast.success("Account created! You're now logged in.");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: Record<string, string[] | string> };
      };
      const respData = err.response?.data;

      if (!respData || typeof respData !== "object") {
        toast.error("Registration failed. Please try again.");
        return;
      }

      let showedInline = false;

      for (const [key, value] of Object.entries(respData)) {
        const message = Array.isArray(value) ? value[0] : String(value);

        if ((FORM_FIELDS as readonly string[]).includes(key)) {
          setError(key as keyof RegisterFormData, { message });
          showedInline = true;
        } else {
          toast.error(message);
        }
      }

      if (!showedInline) {
        toast.error("Registration failed. Please check the form.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Username */}
      <Field>
        <Label htmlFor="modal-reg-username">Username</Label>
        <Controller
          control={control}
          name="username"
          render={({ field }) => (
            <Input
              id="modal-reg-username"
              placeholder="Choose a username"
              autoComplete="username"
              disabled={submitting}
              {...field}
            />
          )}
        />
        <FieldError errors={errors.username ? [errors.username] : undefined} />
      </Field>

      {/* Email */}
      <Field>
        <Label htmlFor="modal-reg-email">Email</Label>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Input
              id="modal-reg-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={submitting}
              {...field}
            />
          )}
        />
        <FieldError errors={errors.email ? [errors.email] : undefined} />
      </Field>

      {/* First + Last */}
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <Label htmlFor="modal-reg-first-name">First name</Label>
          <Controller
            control={control}
            name="first_name"
            render={({ field }) => (
              <Input
                id="modal-reg-first-name"
                placeholder="Optional"
                autoComplete="given-name"
                disabled={submitting}
                {...field}
              />
            )}
          />
          <FieldError
            errors={errors.first_name ? [errors.first_name] : undefined}
          />
        </Field>
        <Field>
          <Label htmlFor="modal-reg-last-name">Last name</Label>
          <Controller
            control={control}
            name="last_name"
            render={({ field }) => (
              <Input
                id="modal-reg-last-name"
                placeholder="Optional"
                autoComplete="family-name"
                disabled={submitting}
                {...field}
              />
            )}
          />
          <FieldError
            errors={errors.last_name ? [errors.last_name] : undefined}
          />
        </Field>
      </div>

      {/* Password */}
      <Field>
        <Label htmlFor="modal-reg-password">Password</Label>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordInput
              id="modal-reg-password"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="At least 8 chars with mixed case, digit, symbol"
              autoComplete="new-password"
              disabled={submitting}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          )}
        />
        <FieldError errors={errors.password ? [errors.password] : undefined} />
      </Field>

      {/* Confirm Password */}
      <Field>
        <Label htmlFor="modal-reg-confirm-password">Confirm password</Label>
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <PasswordInput
              id="modal-reg-confirm-password"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              disabled={submitting}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
            />
          )}
        />
        <FieldError
          errors={
            errors.confirmPassword ? [errors.confirmPassword] : undefined
          }
        />
      </Field>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      {onSwitchView && (
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => onSwitchView("login")}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </button>
        </p>
      )}
    </form>
  );
}