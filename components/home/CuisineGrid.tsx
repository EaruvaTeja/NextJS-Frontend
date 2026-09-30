// components/home/CuisineGrid.tsx
//
// "What's on your mind?" — bento-style cuisine tiles.
//
// Each tile: full-bleed gradient, big emoji bottom-right, label bottom-left.
// Click -> /restaurants?cuisine=<value>
// (Note: the cuisine filter uses the same search endpoint for now.)

import Link from "next/link";

interface Cuisine {
  label: string;
  value: string;
  emoji: string;
  gradient: string;
}

const CUISINES: Cuisine[] = [
  { label: "Biryani",   value: "indian",   emoji: "🍛", gradient: "from-orange-400 via-red-400 to-rose-500" },
  { label: "Pizza",     value: "italian",  emoji: "🍕", gradient: "from-red-400 via-orange-400 to-amber-400" },
  { label: "Chinese",   value: "chinese",  emoji: "🥡", gradient: "from-rose-500 via-pink-500 to-red-500" },
  { label: "Burgers",   value: "american", emoji: "🍔", gradient: "from-amber-400 via-orange-400 to-red-400" },
  { label: "Sushi",     value: "japanese", emoji: "🍣", gradient: "from-pink-400 via-rose-400 to-red-400" },
  { label: "Mexican",   value: "mexican",  emoji: "🌮", gradient: "from-lime-400 via-yellow-400 to-orange-400" },
  { label: "Thai",      value: "thai",     emoji: "🍜", gradient: "from-purple-400 via-pink-400 to-rose-400" },
  { label: "Desserts",  value: "dessert",  emoji: "🍰", gradient: "from-pink-400 via-rose-300 to-orange-300" },
];

export function CuisineGrid() {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-14 sm:py-20">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
              Explore
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.02em] sm:text-4xl">
              What&apos;s on your mind?
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Pick a cuisine and start exploring
            </p>
          </div>
          <Link
            href="/restaurants"
            className="shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            See all →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {CUISINES.map((c) => (
            <CuisineCard key={c.value} cuisine={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CuisineCard({ cuisine }: { cuisine: Cuisine }) {
  return (
    <Link
      href={`/restaurants?cuisine=${encodeURIComponent(cuisine.value)}`}
      className="
        group relative flex aspect-[5/4] flex-col justify-between overflow-hidden
        rounded-2xl bg-gradient-to-br p-4 shadow-md transition-all duration-300
        hover:-translate-y-1 hover:shadow-2xl
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
      "
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${cuisine.gradient} transition-transform duration-500 group-hover:scale-110`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

      <span
        className="
          absolute -bottom-4 -right-2 text-8xl leading-none drop-shadow-lg
          transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-6
          sm:text-9xl
        "
        aria-hidden="true"
      >
        {cuisine.emoji}
      </span>

      <div className="relative z-10 flex items-start justify-between">
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
          Explore
        </span>
      </div>

      <div className="relative z-10">
        <p className="text-lg font-bold leading-tight text-white drop-shadow-md sm:text-xl">
          {cuisine.label}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-white/80">
          Order now
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </p>
      </div>
    </Link>
  );
}
