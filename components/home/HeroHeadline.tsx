// components/home/HeroHeadline.tsx
//
// Time-context line + big headline + subtext.

"use client";

import { useEffect, useState } from "react";
import {
  Coffee,
  Cookie,
  Moon,
  Soup,
  UtensilsCrossed,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Time-of-day helper
// ---------------------------------------------------------------------------
interface TimeContext {
  period: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function timeContext(date: Date): TimeContext {
  const h = date.getHours();
  if (h >= 5 && h < 11) return { period: "breakfast", Icon: Coffee };
  if (h >= 11 && h < 15) return { period: "lunch", Icon: UtensilsCrossed };
  if (h >= 15 && h < 18) return { period: "snack time", Icon: Cookie };
  if (h >= 18 && h < 22) return { period: "dinner", Icon: Soup };
  return { period: "a midnight snack", Icon: Moon };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function HeroHeadline() {
  const [context, setContext] = useState<TimeContext | null>(null);

  // Defer the time computation to after mount so SSR/CSR stay in sync.
  useEffect(() => {
    const id = setTimeout(() => setContext(timeContext(new Date())), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <div>
      {/* Time context */}
      {context && (
        <p className="mb-4 flex items-center gap-2 text-sm font-medium text-[#737373]">
          <context.Icon className="h-4 w-4" />
          It&apos;s nearly {context.period} in Hyderabad
        </p>
      )}

      {/* Headline */}
      <h1
        className="text-[2.75rem] font-black leading-[1.15] tracking-[-0.03em] sm:text-6xl lg:text-7xl"
        style={{ fontFamily: '"Bricolage Grotesque", "Inter", sans-serif' }}
      >
        Your cravings,
        <br />
        <span className="relative inline-block">
          <span
            className="relative z-10"
            style={{
              WebkitTextStroke: "1.5px #0A0A0A",
              color: "transparent",
            }}
          >
            delivered
          </span>
          <svg
            className="absolute -bottom-2 left-0 h-3 w-full text-[#0A0A0A]"
            viewBox="0 0 200 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 8C40 2 100 2 198 6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <br />
        in minutes.
      </h1>

      {/* Subtext */}
      <p className="mt-6 max-w-md text-lg text-[#737373]">
        Order from your favorite restaurants. Fresh food from 1,200+
        kitchens, delivered fast, right to your door.
      </p>
    </div>
  );
}