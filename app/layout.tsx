// app/layout.tsx
//
// Root layout. Wraps the entire app in:
//   - <Providers> (Auth context + toaster)
//   - <Navbar> (always visible)
//   - <main> (page content)
//
// Note: metadata is exported as a Next.js convention.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { RouteLoadingBar } from "@/components/layout/RouteLoadingBar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

// Import NProgress's base styles from node_modules.
// Any global CSS file in a client component is fine in App Router.
import "nprogress/nprogress.css";

import { Providers } from "@/providers";
import { Navbar } from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swiggy Clone",
  description: "Food delivery app built with Next.js and Django",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
            <Suspense fallback={null}>
              <RouteLoadingBar />
            </Suspense>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
        </Providers>
      </body>
    </html>
  );
}