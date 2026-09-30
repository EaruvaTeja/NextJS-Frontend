// components/profile/ProfileCard.tsx
//
// User info card with a shiny glass/waterdrop avatar.

"use client";

import { Card } from "@/components/ui/card";
import type { User } from "@/types/auth";

interface ProfileCardProps {
  user: User;
}

function getInitials(user: User): string {
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();
  if (first && last) return (first[0] + last[0]).toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  return (user.username?.slice(0, 2) || "U").toUpperCase();
}

function getDisplayName(user: User): string {
  const full = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return full || user.username;
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <Card className="p-5">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        {/* Black Diamond shine avatar */}
          <div
            className="
              relative flex h-16 w-16 shrink-0 items-center justify-center
              overflow-hidden rounded-2xl
              bg-[radial-gradient(circle_at_30%_20%,#3a3a3a_0%,#0a0a0a_45%,#000000_100%)]
              ring-1 ring-white/[0.12]
              shadow-[0_12px_30px_-10px_rgba(0,0,0,0.7),inset_0_2px_3px_rgba(255,255,255,0.35),inset_0_-8px_16px_rgba(0,0,0,0.7)]
            "
            aria-hidden="true"
          >
            {/* Reverse L-shaped shine at bottom-right */}
            <span className="pointer-events-none absolute bottom-0 right-0 h-[2px] w-full bg-white/40 blur-[1px]" />
            <span className="pointer-events-none absolute bottom-0 right-0 h-full w-[2px] bg-white/40 blur-[1px]" />

            {/* Small sparkle highlight */}
            <span className="pointer-events-none absolute right-2 top-1 h-1.5 w-1.5 rounded-full bg-white blur-[0.5px]" />
            <span className="pointer-events-none absolute bottom-1 left-1/2 h-[2px] w-9 -translate-x-1/2 rounded-full bg-white/50 blur-[1px]" />

            <span className="relative text-2xl font-black tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
    {getInitials(user)}
            </span>
          </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold leading-tight">
            {getDisplayName(user)}
          </h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            @{user.username}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 border-t" />

      {/* Info rows */}
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Email</span>
          <span className="truncate font-medium text-foreground">
            {user.email || "—"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Account</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
            Active
          </span>
        </div>
      </div>
    </Card>
  );
}