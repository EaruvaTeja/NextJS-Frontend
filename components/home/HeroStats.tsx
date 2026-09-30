// components/home/HeroStats.tsx
//
// The "receipt strip" — 4 stats styled like a torn order ticket.
//
// Purely decorative. Static content for now.

const STATS = [
  { value: "18 min", label: "average delivery" },
  { value: "1,200+", label: "restaurants nearby" },
  { value: "4.6", label: "average rating" },
  { value: "70+", label: "cuisines to explore" },
];

export function HeroStats() {
  return (
    <div className="relative mt-10 sm:mt-12">
      {/* Torn top edge — decorative circles cut out of the strip */}
      <div
        className="pointer-events-none absolute -top-[1px] left-0 right-0 h-[14px] bg-repeat-x"
        style={{
          backgroundImage:
            "radial-gradient(circle at 7px 7px, white 7px, transparent 7.5px)",
          backgroundSize: "24px 14px",
          backgroundPosition: "top",
        }}
        aria-hidden="true"
      />

      {/* The strip itself */}
      <div
        className="
          flex flex-col divide-y divide-dashed divide-[#E5E5E5]
          rounded-b-[20px] bg-[#F5F5F4] px-6 py-2
          sm:flex-row sm:divide-x sm:divide-y-0 sm:px-2
        "
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="
              flex flex-1 items-baseline justify-between gap-3 px-4 py-4
              sm:flex-col sm:items-start sm:justify-start sm:gap-1
            "
          >
            <span className="font-mono text-xl font-bold text-[#0A0A0A] sm:text-2xl">
              {stat.value}
            </span>
            <span className="text-xs text-[#737373]">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}