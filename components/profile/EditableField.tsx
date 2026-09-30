// components/profile/EditableField.tsx
//
// Single profile field with a Change / Update flow.
//
// Update button:
//   - No background
//   - Deep navy-blue text
//   - Subtle hover (light blue tint)
//   - Pressed feedback on click

"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Pencil } from "lucide-react";

import { Label } from "@/components/ui/label";

interface EditableFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  isDirty?: boolean;
  type?: "text" | "email";
  placeholder?: string;
  maxLength?: number;
  locked?: boolean;
  hint?: string;
  validate?: (value: string) => string | null;
}

export function EditableField({
  id,
  label,
  value,
  onChange,
  isDirty = false,
  type = "text",
  placeholder,
  maxLength,
  locked = false,
  hint,
  validate,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click outside -> cancel editing
  useEffect(() => {
    if (!isEditing) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setDraft("");
        setError(null);
        setIsEditing(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing]);

  function startEditing() {
    // Seed draft from the current value at the moment of clicking Change
    setDraft(value);
    setError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft("");
    setError(null);
    setIsEditing(false);
  }

  function commit() {
    const trimmed = draft.trim();
    if (validate) {
      const validationError = validate(trimmed);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    onChange(trimmed);
    setError(null);
    setDraft("");
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  }

  // -------------------------------------------------------------------------
  // Locked
  // -------------------------------------------------------------------------
  if (locked) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className="flex items-center gap-1.5">
          {label}
          <Lock className="h-3 w-3 text-muted-foreground/70" />
        </Label>
        <div className="flex h-10 items-center rounded-md border border-zinc-200 bg-muted/40 px-3 text-sm text-muted-foreground">
          {value}
        </div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Editable
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {label}
        {isDirty && (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500"
            title="Unsaved change"
            aria-label="Unsaved change"
          />
        )}
      </Label>

      <div
        className={`
          flex h-10 items-center gap-2 rounded-md border bg-background
          px-3 transition-colors
          ${
            error
              ? "border-red-400"
              : isEditing
              ? "border-zinc-300"
              : "border-zinc-200 hover:border-zinc-300"
          }
        `}
      >
        {isEditing ? (
          <>
            <input
              ref={inputRef}
              id={id}
              type={type}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              autoFocus
              autoComplete="off"
              aria-invalid={!!error}
              className="
                h-full min-w-0 flex-1 bg-transparent text-sm text-foreground
                placeholder:text-muted-foreground/60
                outline-none
              "
            />
            <button
              type="button"
              onClick={commit}
              className="
                shrink-0 rounded-md bg-transparent px-2.5 py-1
                text-[11px] font-bold uppercase tracking-wide
                text-blue-900
                transition-all duration-150
                hover:bg-blue-50 hover:text-blue-950
                active:scale-95 active:bg-blue-100
                cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300
              "
            >
              Update
            </button>
          </>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {value || (
                <span className="text-muted-foreground/60">—</span>
              )}
            </span>
            <button
              type="button"
              onClick={startEditing}
              className="
                group inline-flex shrink-0 items-center gap-1 rounded-md
                px-1.5 py-0.5 text-[11px] font-medium
                text-muted-foreground/80
                transition-all duration-150
                hover:bg-primary/8 hover:text-primary
                active:scale-95
                cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
              "
            >
              <Pencil className="h-3 w-3 transition-transform group-hover:-rotate-12" />
              Change
            </button>
          </>
        )}
      </div>

      {error ? (
        <p className="flex items-start gap-1.5 text-[11px] font-medium text-red-600">
          <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}