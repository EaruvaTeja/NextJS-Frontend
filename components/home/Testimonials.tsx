// components/home/Testimonials.tsx
//
// Social proof — 3 customer quotes with star ratings.
// Avatars are black circles with white initials (no per-person colors).

import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  city: string;
  rating: number;
  text: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Priya S.",
    city: "Hyderabad",
    rating: 5,
    text: "Fastest delivery I've experienced. The biryani arrived hot and the packaging was spotless. Swiggy Clone is now my default.",
    initials: "PS",
  },
  {
    name: "Rahul K.",
    city: "Bangalore",
    rating: 5,
    text: "Live order tracking is a game changer. I knew exactly when the food would arrive — no calling, no waiting, no guessing.",
    initials: "RK",
  },
  {
    name: "Anjali M.",
    city: "Mumbai",
    rating: 4,
    text: "Great restaurant selection and honest pricing. The coupon at checkout saved me ₹150 on my first order. Will order again.",
    initials: "AM",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-zinc-300"
          }`}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="bg-zinc-50">
      <div className="container mx-auto px-4 py-14 sm:py-20">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
            Real stories
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.02em] sm:text-4xl">
            Loved by 50,000+ customers
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            What people are saying about their Swiggy Clone experience
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="
                relative flex flex-col rounded-2xl border border-zinc-200
                bg-white p-6 shadow-sm transition-shadow hover:shadow-md
              "
            >
              <Quote className="absolute right-5 top-5 h-6 w-6 text-zinc-100" />

              <Stars rating={t.rating} />

              <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-700">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="mt-5 flex items-center gap-3 border-t pt-5">
                {/* Black glass avatar */}
                <div
                  className="
                    flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                    bg-zinc-900 text-xs font-bold text-white
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-4px_8px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.08)]
                  "
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-zinc-900">
                    {t.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{t.city}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}