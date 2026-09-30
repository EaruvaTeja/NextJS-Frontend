// components/home/HeroBackdrop.tsx
//
// The "HUNGRY" brand mark.
//
// Desktop:  huge, faint, horizontal — behind the content (absolute top)
// Mobile:   same faint style, rotated 90° clockwise, on the right side
//
// The mobile version uses `writing-mode: vertical-rl` — the correct CSS
// way to rotate Latin text. No transform tricks, no overflow issues.

export function HeroBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 hidden select-none overflow-hidden md:block"
      aria-hidden="true"
    >
      <span
        className="block translate-y-[-6%] text-center font-black leading-none"
        style={{
          fontSize: "clamp(7rem, 24vw, 22rem)",
          fontFamily: '"Bricolage Grotesque", "Inter", sans-serif',
          color: "transparent",
          WebkitTextStroke: "1px rgba(10,10,10,0.05)",
        }}
      >
        HUNGRY
      </span>
    </div>
  );
}

export function HeroMobileBrand() {
  return (
    <div
      className="
        pointer-events-none absolute right-4 top-0 z-0
        flex h-full items-start justify-end
        pr-2 pt-24
        select-none md:hidden
      "
      aria-hidden="true"
    >
      <span
        className="block font-black leading-none"
        style={{
          fontFamily: '"Bricolage Grotesque", "Inter", sans-serif',
          fontSize: "clamp(6rem, 12vw, 9rem)",
          color: "transparent",
          WebkitTextStroke: "1px rgba(10,10,10,0.1)",
          writingMode: "vertical-rl",
          letterSpacing: "0.05em",
        }}
      >
        HUNGRY
      </span>
    </div>
  );
}