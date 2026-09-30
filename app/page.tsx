// app/page.tsx
//
// Home page composition.
//
// Sections (top to bottom):
//   Hero               — search, headline, status card, cravings, receipt stats
//   FeaturedRestaurants — top 4 by rating
//   MenuItemsShowcase   — 8 random dishes with direct add-to-cart
//   Testimonials        — social proof

import { Hero } from "@/components/home/Hero";
import { FeaturedRestaurants } from "@/components/home/FeaturedRestaurants";
import { MenuItemsShowcase } from "@/components/home/MenuItemsShowcase";
import { Testimonials } from "@/components/home/Testimonials";

export default function Home() {
  return (
    <main className="flex flex-col">
      <Hero />
      <FeaturedRestaurants />
      <MenuItemsShowcase />
      <Testimonials />
    </main>
  );
}