// components/home/HeroSearch.tsx
//
// Hero search bar — command-bar aesthetic with a suggestions dropdown.
//
// Behavior:
//   - Empty + focused -> popular searches
//   - Typing          -> filters populars live
//   - No matches      -> "Press Enter to search 'X'"
//   - Enter / click   -> router.push('/restaurants?q=...')
//   - Keyboard nav    -> ↑ / ↓ to highlight, Enter to submit
//
// Styling matches the original Hero command bar (monospace labels,
// glassy backdrop blur, black-tinted border).

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, X } from "lucide-react";

import {
  POPULAR_SEARCHES,
  MAX_SUGGESTIONS,
} from "@/lib/search-suggestions";

export function HeroSearch() {
  const router = useRouter();

  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------
  // Filter populars
  // ---------------------------------------------------------------------
  const trimmed = value.trim().toLowerCase();
  const matches = trimmed
    ? POPULAR_SEARCHES.filter((s) =>
        s.toLowerCase().includes(trimmed)
      ).slice(0, MAX_SUGGESTIONS)
    : POPULAR_SEARCHES.slice(0, MAX_SUGGESTIONS);

  const hasMatches = matches.length > 0;

  // ---------------------------------------------------------------------
  // Click outside -> close dropdown
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;
    function onDown(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

  // ---------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------
  function submit(query: string) {
    const q = query.trim();
    if (!q) return;
    setIsOpen(false);
    router.push(`/restaurants?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && matches[highlightedIndex]) {
        submit(matches[highlightedIndex]);
      } else {
        submit(value);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function handleClear() {
    setValue("");
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <div className="relative z-20 w-full" ref={wrapperRef}>
      {/* ------------------------ Command bar ------------------------ */}
      <div
        className={`
          flex w-full items-center gap-1.5 rounded-2xl border
          bg-white/55 p-2 font-mono backdrop-blur-xl backdrop-saturate-150
          transition-all
          ${
            isFocused
              ? "border-[#0A0A0A]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_20px_50px_-15px_rgba(0,0,0,0.25)]"
              : "border-[#0A0A0A]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_12px_35px_-18px_rgba(0,0,0,0.18)]"
          }
        `}
      >
        <div className="flex flex-1 items-center gap-1 px-3 py-2">
          <span className="shrink-0 text-xs text-[#0A0A0A]/40">
            search:
          </span>
          <Search className="h-3.5 w-3.5 shrink-0 text-[#0A0A0A]/60" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              setIsOpen(true);
              setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="dishes, restaurants, cuisines"
            autoComplete="off"
            className="
              w-full min-w-0 bg-transparent text-sm text-[#0A0A0A]
              outline-none placeholder:text-[#0A0A0A]/35
            "
          />

          {/* Blinking cursor accent */}
          {isFocused && !value && (
            <span className="h-4 w-[2px] shrink-0 animate-pulse bg-[#0A0A0A]/70" />
          )}

          {/* Clear */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="shrink-0 cursor-pointer rounded-full p-0.5 text-[#0A0A0A]/50 transition-colors hover:bg-black/10 hover:text-[#0A0A0A]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ------------------------ Suggestions ------------------------ */}
      {isOpen && (
        <div
          className="
            absolute left-0 right-0 top-full z-40 mt-2
            max-h-72 overflow-y-auto rounded-2xl border border-[#0A0A0A]/15
            bg-white/95 p-2 font-sans shadow-xl backdrop-blur-xl
          "
        >
          {/* Header */}
          <div className="flex items-center gap-1.5 px-3 pb-1 pt-1">
            <TrendingUp className="h-3 w-3 text-[#737373]" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
              {trimmed ? "Suggestions" : "Popular searches"}
            </p>
          </div>

          {/* List or empty */}
          {hasMatches ? (
            matches.map((s, i) => {
              const isHighlighted = i === highlightedIndex;
              return (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    submit(s);
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={`
                    flex w-full items-center gap-3 rounded-xl px-3 py-2.5
                    text-left text-sm transition-colors cursor-pointer
                    ${
                      isHighlighted
                        ? "bg-primary/5 text-primary"
                        : "text-[#0A0A0A] hover:bg-[#F5F5F4]"
                    }
                  `}
                >
                  <Search className="h-3.5 w-3.5 shrink-0 text-[#737373]" />
                  <span className="truncate">{s}</span>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-[#737373]">No direct matches.</p>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  submit(value);
                }}
                className="
                  mt-2 inline-flex items-center gap-1.5 rounded-md
                  bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary
                  transition-colors hover:bg-primary/10 cursor-pointer
                "
              >
                <Search className="h-3 w-3" />
                Press Enter to search &ldquo;{value}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}