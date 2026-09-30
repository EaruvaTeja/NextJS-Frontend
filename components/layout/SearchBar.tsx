// components/layout/SearchBar.tsx
//
// Search input with a suggestions dropdown.
//
// Behavior:
//   - Empty + focused -> shows popular searches
//   - Typing          -> filters popular searches live
//   - No matches      -> "Press Enter to search '<query>'"
//   - Enter or click  -> onSubmit(query)
//
// Used in Navbar (compact) and Hero (default). Suggestion list is
// client-only — no backend call.

"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { POPULAR_SEARCHES, MAX_SUGGESTIONS } from "@/lib/search-suggestions";

interface SearchBarProps {
  size?: "md" | "lg";
  placeholder?: string;
  defaultValue?: string;
  onSubmit?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
  /** Show the suggestions dropdown. Defaults to true. */
  showSuggestions?: boolean;
}

// ---------------------------------------------------------------------------
// Popular searches (also act as autocomplete suggestions)
// ---------------------------------------------------------------------------
// search items added via the import "@/lib/search-suggestions"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SearchBar({
  size = "md",
  placeholder = "Search for restaurants, cuisines, or dishes…",
  defaultValue = "",
  onSubmit,
  className = "",
  autoFocus = false,
  showSuggestions = true,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLg = size === "lg";

  // ---------------------------------------------------------------------
  // Filter popular searches based on the typed query
  // ---------------------------------------------------------------------
  const trimmed = value.trim().toLowerCase();
  const matches = trimmed
    ? POPULAR_SEARCHES.filter((s) => s.toLowerCase().includes(trimmed)).slice(
        0,
        MAX_SUGGESTIONS
      )
    : POPULAR_SEARCHES.slice(0, MAX_SUGGESTIONS);

  const hasMatches = matches.length > 0;
  const showList = showSuggestions && isOpen;

  // ---------------------------------------------------------------------
  // Close on click outside
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
    onSubmit?.(q);
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
    }
  }

  function handleClear() {
    setValue("");
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      {/* ----------------------- Trigger box ----------------------- */}
      <div
        className={`
          flex w-full items-center gap-2 rounded-xl border border-zinc-200
          bg-white transition-all
          focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15
          ${isLg ? "px-4 py-3" : "px-3 py-2"}
        `}
      >
        <button
          type="button"
          onClick={() => submit(value)}
          aria-label="Search"
          className="shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-primary"
        >
          <Search className={isLg ? "h-5 w-5" : "h-4 w-4"} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className={`
            min-w-0 flex-1 bg-transparent text-foreground
            placeholder:text-muted-foreground/70
            focus:outline-none
            ${isLg ? "text-base" : "text-sm"}
          `}
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="shrink-0 cursor-pointer rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground"
          >
            <X className={isLg ? "h-4 w-4" : "h-3.5 w-3.5"} />
          </button>
        )}
      </div>

      {/* ----------------------- Suggestions ----------------------- */}
      {showList && (
        <div
          className="
            absolute left-0 right-0 top-full z-[100] mt-2
            overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl
          "
        >
          {/* Header */}
          <div className="flex items-center gap-1.5 border-b border-zinc-100 px-3.5 py-2">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {trimmed ? "Suggestions" : "Popular searches"}
            </p>
          </div>

          {/* Suggestion list */}
          <div className="max-h-[60vh] overflow-y-auto p-1.5">
            {hasMatches ? (
              matches.map((s, i) => {
                const isHighlighted = i === highlightedIndex;
                return (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => {
                      // Prevent the input from losing focus before click
                      e.preventDefault();
                      submit(s);
                    }}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={`
                      flex w-full items-center gap-2.5 rounded-lg px-3 py-2
                      text-left transition-colors cursor-pointer
                      ${
                        isHighlighted
                          ? "bg-primary/5 text-primary"
                          : "text-foreground hover:bg-zinc-50"
                      }
                    `}
                  >
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{s}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No direct matches.
                </p>
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
        </div>
      )}
    </div>
  );
}