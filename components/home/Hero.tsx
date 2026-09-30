// components/home/Hero.tsx
//
// Home page hero — composed from focused sub-components.
//
// Layout:
//   [HeroBackdrop]         (decorative desktop HUNGRY, absolute behind)
//   [HeroMobileBrand]      (rotated HUNGRY, right side, mobile only)
//
//   Content (z-10):
//     [HeroSearch]         (command-bar search with suggestions)
//     [HeroHeadline] + [HeroStatusCard]  (2 columns on lg, stacked on mobile)
//     [HeroCravings]       (horizontal scroll chips → /restaurants?q=...)
//     [HeroStats]          (receipt-strip stats)
//
// All data comes from contexts. No raw fetch. No localStorage hacks.

"use client";

import { HeroBackdrop, HeroMobileBrand } from "./HeroBackdrop";
import { HeroHeadline } from "./HeroHeadline";
import { HeroSearch } from "./HeroSearch";
import { HeroStatusCard } from "./HeroStatusCard";
import { HeroCravings } from "./HeroCravings";
import { HeroStats } from "./HeroStats";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-white font-sans text-[#0A0A0A]">
      {/* Decorative layers — behind everything */}
      <HeroBackdrop />
      <HeroMobileBrand />

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-8 pb-16 lg:px-8">
        {/* Search bar */}
        <HeroSearch />

        {/* Headline + Status Card */}
        <div className="mt-14 flex flex-col items-start gap-12 sm:mt-20 lg:flex-row lg:items-start lg:gap-10">
          <div className="w-full lg:w-[54%]">
            <HeroHeadline />
          </div>

          <div className="w-full lg:w-[46%]">
            <HeroStatusCard />
          </div>
        </div>

        {/* Cravings rail */}
        <HeroCravings />

        {/* Stats strip */}
        <HeroStats />
      </div>
    </section>
  );
}