// components/auth/LoginForm.tsx
//
// Login form with password visibility toggle.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldError } from "@/components/ui/field";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchView?: (view: "login" | "register") => void;
}

const FORM_FIELDS = ["username", "password"] as const;

export function LoginForm({ onSuccess, onSwitchView }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setSubmitting(true);
    try {
      await login(data);
      toast.success("Welcome back!");

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
        toast.error("Login failed. Please try again.");
        return;
      }

      let showedInline = false;

      for (const [key, value] of Object.entries(respData)) {
        const message = Array.isArray(value) ? value[0] : String(value);

        if ((FORM_FIELDS as readonly string[]).includes(key)) {
          setError(key as keyof LoginFormData, { message });
          showedInline = true;
        } else {
          toast.error(message);
        }
      }

      if (!showedInline && !("detail" in respData)) {
        toast.error("Login failed. Please check your credentials.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Username */}
      <Field>
        <Label htmlFor="modal-username">Username</Label>
        <Controller
          control={control}
          name="username"
          render={({ field }) => (
            <Input
              id="modal-username"
              placeholder="Enter your username"
              autoComplete="username"
              disabled={submitting}
              {...field}
            />
          )}
        />
        <FieldError errors={errors.username ? [errors.username] : undefined} />
      </Field>

      {/* Password with toggle */}
      <Field>
        <Label htmlFor="modal-password">Password</Label>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <div className="relative">
              <Input
                id="modal-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={submitting}
                className="pr-10"
                {...field}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={submitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
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
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        />
        <FieldError errors={errors.password ? [errors.password] : undefined} />
      </Field>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      {onSwitchView && (
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => onSwitchView("register")}
            className="font-medium text-primary hover:underline"
          >
            Create one
          </button>
        </p>
      )}
    </form>
  );
}