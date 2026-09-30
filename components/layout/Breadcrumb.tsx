// components/layout/Breadcrumb.tsx
//
// Reusable breadcrumb navigation.
//
// Usage:
//   <Breadcrumb
//     items={[
//       { label: "Home", href: "/" },
//       { label: "Restaurants", href: "/restaurants" },
//       { label: "Bawarchi" },  // no href => current page
//     ]}
//   />
//
// Renders:
//   Home / Restaurants / Bawarchi
//   ^        ^           ^
//   link     link        (not a link — current page, muted)

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string; // omit for the current (last) item
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  // show a Home icon before the first item (default: true)
  showHomeIcon?: boolean;
}

export function Breadcrumb({ items, showHomeIcon = true }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {/* Home icon — only before the first item */}
              {isFirst && showHomeIcon && (
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
              )}

              {/* Item text — link if href provided, plain text otherwise */}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground hover:underline transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="font-medium text-foreground"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}

              {/* Separator — not after the last item */}
              {!isLast && (
                <ChevronRight
                  className="h-3.5 w-3.5 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}