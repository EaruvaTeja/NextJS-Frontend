// components/home/StatsStrip.tsx
//
// 4-column stat strip — trust builder.
// Static content. Pure server component (no "use client").

import { Utensils, Users, Star, Clock } from "lucide-react";

const STATS = [
  { Icon: Utensils, value: "500+",  label: "Restaurants" },
  { Icon: Users,    value: "50K+",  label: "Happy orders" },
  { Icon: Star,     value: "4.8★",  label: "Average rating" },
  { Icon: Clock,    value: "25 min", label: "Avg. delivery" },
];

export function StatsStrip() {
  return (
    <section className="border-y border-zinc-100 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 divide-x divide-zinc-100 sm:grid-cols-4">
          {STATS.map(({ Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 py-6 text-center sm:py-8"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
                {value}
              </p>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}