// components/home/HeroCravings.tsx
//
// Horizontal scrolling rail of craving chips.
//
// Click a chip -> router.push('/restaurants?q=<name>')
//
// Uses the same navigational pattern as the search bar so it feels
// consistent — every action ends up on the restaurants page.

"use client";

import { useRouter } from "next/navigation";
import {
  Cookie,
  Croissant,
  Drumstick,
  Fish,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Utensils,
  UtensilsCrossed,
} from "lucide-react";

interface Craving {
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const CRAVINGS: Craving[] = [
  { name: "Biryani", Icon: UtensilsCrossed },
  { name: "Pizza", Icon: Pizza },
  { name: "Dosa", Icon: Croissant },
  { name: "Ramen", Icon: Soup },
  { name: "Burgers", Icon: Sandwich },
  { name: "Tacos", Icon: Utensils },
  { name: "Sushi", Icon: Fish },
  { name: "Salads", Icon: Salad },
  { name: "Momos", Icon: Drumstick },
  { name: "Desserts", Icon: Cookie },
];

export function HeroCravings() {
  const router = useRouter();

  function handleCraving(name: string) {
    router.push(`/restaurants?q=${encodeURIComponent(name)}`);
  }

  return (
    // Negative horizontal margins + padding let the rail bleed to the
    // screen edges on mobile while keeping the container padding.
    // The `pt-2` at the inner div is REQUIRED — overflow-x:auto forces
    // overflow-y to clip too, so without top padding the hover lift
    // + shadow on each chip would get cut off.
    <div className="relative mt-12 -mx-6 px-6 sm:mt-14 lg:-mx-8 lg:px-8">
      <div
        className="
          flex gap-3 overflow-x-auto pb-3 pt-2
          [scrollbar-width:none] [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {CRAVINGS.map(({ name, Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => handleCraving(name)}
            className="
              flex shrink-0 items-center gap-2 rounded-full border
              border-[#E5E5E5] bg-white px-5 py-3 text-sm font-semibold
              text-[#0A0A0A] transition-all
              hover:-translate-y-0.5 hover:border-[#0A0A0A]/40 hover:shadow-md
              cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/30
            "
          >
            <Icon className="h-4 w-4" />
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}