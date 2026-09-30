// components/restaurant/MenuList.tsx
//
// Displays a restaurant's menu with the UX patterns users expect from
// modern food-delivery apps:
//
//   1. TOOLBAR — search within the menu + "Veg only" toggle
//   2. CATEGORY NAV — sticky horizontal chip links that jump to sections
//   3. BESTSELLERS — top-rated items auto-surfaced in their own section
//   4. GROUPED SECTIONS — items grouped by category in dining order
//      (appetizer -> main -> side -> dessert -> beverage)
//   5. EMPTY STATES — two distinct states: "no menu at all" vs
//      "no matches for your filters" (with a one-click reset)
//
// The page only needs to pass the flat items array from the backend —
// all filter state is local to this component.

"use client";

import { useState } from "react";
import { Search, UtensilsCrossed, X, Flame } from "lucide-react";

import {
  CATEGORY_LABELS,
  type MenuItem,
  type MenuItemCategory,
} from "@/types/restaurant";

import { MenuCard, MenuCardSkeleton } from "./MenuCard";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MenuListProps {
  items: MenuItem[];
}

// ---------------------------------------------------------------------------
// Display order for categories
// ---------------------------------------------------------------------------
// The backend sorts alphabetically, but users expect a dining-flow order:
// starters -> mains -> sides -> desserts -> beverages.
// Only categories in this list will be shown — any unknown value is ignored.
const CATEGORY_ORDER: MenuItemCategory[] = [
  "appetizer",
  "main_course",
  "side",
  "dessert",
  "beverage",
];

// Bestseller thresholds — kept in sync with MenuCard's chip
const BESTSELLER_MIN_RATING = 4.2;
const BESTSELLER_MIN_COUNT = 50;

// ---------------------------------------------------------------------------
// Group items by category
// ---------------------------------------------------------------------------
// Returns a Map (not a plain object) because it preserves insertion order
// and is cleaner for iteration.
function groupByCategory(
  items: MenuItem[]
): Map<MenuItemCategory, MenuItem[]> {
  const map = new Map<MenuItemCategory, MenuItem[]>();

  for (const item of items) {
    const existing = map.get(item.category);
    if (existing) {
      existing.push(item);
    } else {
      map.set(item.category, [item]);
    }
  }

  return map;
}

// Shared chip style for the category nav
const CHIP_CLASS =
  "shrink-0 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MenuList({ items }: MenuListProps) {
  // Filter state is local — the page doesn't need to know about it
  const [vegOnly, setVegOnly] = useState(false);
  const [query, setQuery] = useState("");

  // Empty state #1 — restaurant has no menu at all
  if (items.length === 0) {
    return <EmptyMenu />;
  }

  // Apply filters: veg-only, then keyword (name / description / category)
  const q = query.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (vegOnly && !item.is_vegetarian) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q) ||
      CATEGORY_LABELS[item.category].toLowerCase().includes(q)
    );
  });

  // Empty state #2 — filters removed everything
  if (filtered.length === 0) {
    return (
      <NoFilterResults onReset={() => { setQuery(""); setVegOnly(false); }} />
    );
  }

  const grouped = groupByCategory(filtered);
  const visibleCategories = CATEGORY_ORDER.filter((cat) => grouped.has(cat));

  // Surface the best dishes in their own section (like Swiggy/Zomato)
  const bestsellers = filtered
    .filter(
      (i) =>
        Number(i.rating) >= BESTSELLER_MIN_RATING &&
        i.rating_count >= BESTSELLER_MIN_COUNT
    )
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------ */}
      {/* Toolbar — search + veg-only toggle                            */}
      {/* ------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search in menu */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in menu…"
            aria-label="Search in menu"
            className="w-full rounded-md border bg-background py-2 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Veg only toggle — chip style with the Indian veg square */}
        <button
          type="button"
          onClick={() => setVegOnly((v) => !v)}
          aria-pressed={vegOnly}
          className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:self-auto ${
            vegOnly
              ? "border-green-600 bg-green-50 text-green-700"
              : "bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-sm border-2 ${
              vegOnly ? "border-green-700" : "border-green-700/40"
            }`}
            aria-hidden="true"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                vegOnly ? "bg-green-700" : "bg-green-700/40"
              }`}
            />
          </span>
          Veg only
        </button>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Sticky category nav — tap a chip to jump to a section         */}
      {/* scroll-mt on the sections offsets this bar when jumping       */}
      {/* ------------------------------------------------------------ */}
      <nav
        aria-label="Menu categories"
        className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {bestsellers.length > 0 && (
            <a href="#menu-bestsellers" className={CHIP_CLASS}>
              🔥 Bestsellers
            </a>
          )}
          {visibleCategories.map((cat) => (
            <a key={cat} href={`#category-${cat}`} className={CHIP_CLASS}>
              {CATEGORY_LABELS[cat]}
            </a>
          ))}
        </div>
      </nav>

      {/* ------------------------------------------------------------ */}
      {/* Sections                                                      */}
      {/* ------------------------------------------------------------ */}
      <div className="space-y-10">
        {/* Bestsellers — auto-curated from rating + count */}
        {bestsellers.length > 0 && (
          <section
            id="menu-bestsellers"
            aria-labelledby="menu-bestsellers-heading"
            className="scroll-mt-16"
          >
            <header className="mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-600" aria-hidden="true" />
              <h2
                id="menu-bestsellers-heading"
                className="text-xl font-bold tracking-tight sm:text-2xl"
              >
                Bestsellers
              </h2>
              <span className="text-sm text-muted-foreground">
                ({bestsellers.length})
              </span>
            </header>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {bestsellers.map((item, i) => (
                <MenuCard key={item.id} item={item} priority={i < 2} />
              ))}
            </div>
          </section>
        )}

        {/* Category sections in dining order */}
        {visibleCategories.map((category, catIndex) => {
          const categoryItems = grouped.get(category) ?? [];
          const isFirstSection = catIndex === 0 && bestsellers.length === 0;

          return (
            <section
              key={category}
              id={`category-${category}`}
              aria-labelledby={`category-${category}-heading`}
              className="scroll-mt-16"
            >
              <header className="mb-4 flex items-center gap-3">
                <h2
                  id={`category-${category}-heading`}
                  className="text-xl font-bold tracking-tight sm:text-2xl"
                >
                  {CATEGORY_LABELS[category]}
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({categoryItems.length}{" "}
                  {categoryItems.length === 1 ? "item" : "items"})
                </span>
              </header>

              {/* Single column on mobile, 2 columns on larger screens */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {categoryItems.map((item, itemIndex) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    // Prioritize the first section's first row (LCP)
                    priority={isFirstSection && itemIndex < 2}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MenuListSkeleton — loading placeholder
// ---------------------------------------------------------------------------
// Reuses MenuCardSkeleton so skeletons and real cards never drift apart.
export function MenuListSkeleton({ categories = 3 }: { categories?: number }) {
  return (
    <div className="space-y-10">
      {Array.from({ length: categories }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="h-7 w-40 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <MenuCardSkeleton key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================================================
// EmptyMenu — the restaurant has no menu items at all
// ===========================================================================
function EmptyMenu() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No items available</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        This restaurant hasn&apos;t added any menu items yet. Please check
        back soon.
      </p>
    </div>
  );
}

// ===========================================================================
// NoFilterResults — items exist, but the current filters hide them all
// ===========================================================================
function NoFilterResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
      <Search className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
      <h3 className="text-lg font-semibold">No matching dishes</h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        Nothing in this menu matches your current search or filters.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="h-3.5 w-3.5" />
        Clear search &amp; filters
      </button>
    </div>
  );
}