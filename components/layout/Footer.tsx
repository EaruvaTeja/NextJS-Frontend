// components/layout/Footer.tsx
//
// Global footer — shown on every page.
//
// Social icons use inline SVGs (not lucide-react brand icons, which
// are being progressively removed for trademark reasons).

"use client";

import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Link groups
// ---------------------------------------------------------------------------
interface FooterLink {
  label: string;
  href: string;
}

const COMPANY_LINKS: FooterLink[] = [
  { label: "About Us", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Team", href: "#" },
  { label: "Blog", href: "#" },
];

const HELP_LINKS: FooterLink[] = [
  { label: "Contact Us", href: "#" },
  { label: "Help Center", href: "#" },
  { label: "Report an Issue", href: "#" },
  { label: "Partner with Us", href: "#" },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: "Terms & Conditions", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Cookie Policy", href: "#" },
  { label: "Refund Policy", href: "#" },
];

// ---------------------------------------------------------------------------
// Inline SVG social icons (24x24 viewBox, currentColor)
// ---------------------------------------------------------------------------
interface IconProps {
  className?: string;
}

const InstagramIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TwitterIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const FacebookIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedinIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const YoutubeIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-1.92 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const SOCIALS = [
  { label: "Instagram", Icon: InstagramIcon },
  { label: "Twitter", Icon: TwitterIcon },
  { label: "Facebook", Icon: FacebookIcon },
  { label: "LinkedIn", Icon: LinkedinIcon },
  { label: "YouTube", Icon: YoutubeIcon },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Footer() {
  function comingSoon(what: string) {
    toast.info(`${what} coming soon!`);
  }

  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Top: brand + link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-12">
          {/* Brand block */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-black tracking-tight"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
                <UtensilsCrossed className="h-5 w-5" />
              </span>
              <span className="text-lg">Swiggy Clone</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Fresh food from your favorite restaurants, delivered fast to
              your doorstep. Order anytime, anywhere.
            </p>

            {/* App store buttons (placeholders) */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => comingSoon("Android app")}
                className="
                  inline-flex items-center gap-2 rounded-lg border border-zinc-300
                  bg-white px-3 py-2 text-left text-[11px] font-medium
                  transition-colors hover:border-zinc-400 hover:bg-zinc-50
                  cursor-pointer
                "
              >
                <span className="text-xl leading-none">▶</span>
                <span>
                  <span className="block text-[9px] uppercase tracking-wide text-muted-foreground">
                    Get it on
                  </span>
                  <span className="block font-semibold text-foreground">
                    Google Play
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => comingSoon("iOS app")}
                className="
                  inline-flex items-center gap-2 rounded-lg border border-zinc-300
                  bg-white px-3 py-2 text-left text-[11px] font-medium
                  transition-colors hover:border-zinc-400 hover:bg-zinc-50
                  cursor-pointer
                "
              >
                <span className="text-xl leading-none"></span>
                <span>
                  <span className="block text-[9px] uppercase tracking-wide text-muted-foreground">
                    Download on
                  </span>
                  <span className="block font-semibold text-foreground">
                    App Store
                  </span>
                </span>
              </button>
            </div>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      comingSoon(link.label);
                    }}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Help
            </h3>
            <ul className="mt-4 space-y-2.5">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      comingSoon(link.label);
                    }}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      comingSoon(link.label);
                    }}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Swiggy Clone. All rights reserved.
          </p>

          <div className="flex items-center gap-1.5">
            {SOCIALS.map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => comingSoon(label)}
                aria-label={label}
                className="
                  flex h-8 w-8 items-center justify-center rounded-full
                  text-muted-foreground transition-colors
                  hover:bg-white hover:text-foreground
                  cursor-pointer
                "
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}