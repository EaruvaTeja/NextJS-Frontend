// components/layout/Navbar.tsx
//
// Top navigation bar.
//
// Desktop layout:
//   [Logo]  [LocationPicker compact]  [SearchBar]  [Cart] [User]
//
// Mobile layout:
//   [Logo]  [Cart] [Hamburger]
//   Drawer shows: LocationPicker + SearchBar + Menu items

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  User,
  UtensilsCrossed,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useCart } from "@/hooks/useCart";
import { LocationPicker } from "@/components/layout/LocationPicker";
import { SearchBar } from "@/components/layout/SearchBar";

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { itemCount } = useCart();
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showBadge = itemCount > 0;
  const badgeText = itemCount > 99 ? "99+" : String(itemCount);

  async function handleLogout() {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    toast.success("Logged out");
    router.push("/");
  }

  function handleSearch(q: string) {
    router.push(`/restaurants?q=${encodeURIComponent(q)}`);
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        {/* ---------------------------------------------------------- */}
        {/* LEFT — Logo                                                 */}
        {/* ---------------------------------------------------------- */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 font-bold tracking-tight cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white transition-transform group-hover:scale-105">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span className="hidden text-lg font-black tracking-tight text-black sm:inline">
            Swiggy
          </span>
        </Link>

        {/* ---------------------------------------------------------- */}
        {/* CENTER-LEFT — LocationPicker (desktop)                      */}
        {/* ---------------------------------------------------------- */}
        <div className="hidden md:block">
          <LocationPicker variant="compact" className="w-44" />
        </div>

        {/* ---------------------------------------------------------- */}
        {/* CENTER — SearchBar (desktop)                                */}
        {/* ---------------------------------------------------------- */}
        <div className="hidden flex-1 md:flex md:max-w-md lg:max-w-lg">
          <SearchBar
            size="md"
            placeholder="Search restaurants, cuisines…"
            onSubmit={handleSearch}
          />
        </div>

        {/* ---------------------------------------------------------- */}
        {/* RIGHT — Actions                                             */}
        {/* ---------------------------------------------------------- */}
        <div className="flex shrink-0 items-center gap-1.5">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-9 w-20 animate-pulse rounded-full bg-zinc-200" />
              <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-200" />
            </div>
          ) : isAuthenticated ? (
            <>
              {/* Cart */}
              <Link
                href="/cart"
                aria-label={
                  showBadge
                    ? `Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`
                    : "Cart, empty"
                }
                className="relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black cursor-pointer"
              >
                <span className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {showBadge && (
                    <span
                      className="
                        absolute -right-2 -top-2 z-10
                        flex h-[18px] min-w-[18px] items-center justify-center
                        rounded-full bg-red-600 px-1
                        text-[10px] font-bold leading-none text-white
                        ring-2 ring-white
                      "
                    >
                      {badgeText}
                    </span>
                  )}
                </span>
                <span className="hidden lg:inline">Cart</span>
              </Link>

              {/* User dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  aria-expanded={isDropdownOpen}
                  className={`flex items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 transition-all cursor-pointer ${
                    isDropdownOpen
                      ? "border-black bg-zinc-100"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                    {user?.username ? (
                      user.username.charAt(0).toUpperCase()
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="hidden max-w-[100px] truncate text-xs font-semibold text-black sm:inline">
                    {user?.username || "Account"}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <>
                    {/* Click-away layer */}
                    <button
                      type="button"
                      aria-label="Close menu"
                      onClick={() => setIsDropdownOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />

                    <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl">
                      <div className="border-b border-zinc-100 px-4 py-2.5">
                        <p className="text-[11px] text-zinc-500">
                          Signed in as
                        </p>
                        <p className="truncate text-sm font-semibold text-black">
                          {user?.email || user?.username}
                        </p>
                      </div>

                      <div className="p-1.5">
                        <Link
                          href="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-black cursor-pointer"
                        >
                          <User className="h-4 w-4 text-zinc-500" />
                          <span>My Profile</span>
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-black cursor-pointer"
                        >
                          <Package className="h-4 w-4 text-zinc-500" />
                          <span>My Orders</span>
                        </Link>
                      </div>

                      <div className="border-t border-zinc-100 p-1.5">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="rounded-full px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => openAuthModal("register")}
                className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-zinc-800 active:scale-[0.98] cursor-pointer"
              >
                Sign up
              </button>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="ml-1 rounded-lg bg-zinc-100 p-2 text-black hover:bg-zinc-200 transition-colors cursor-pointer md:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* MOBILE DRAWER                                                */}
      {/* ---------------------------------------------------------- */}
      {isMobileMenuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 pb-5 pt-3 md:hidden">
          {/* Location + Search */}
          <div className="space-y-2.5">
            <LocationPicker />
            <SearchBar
              size="md"
              placeholder="Search restaurants, cuisines…"
              onSubmit={handleSearch}
            />
          </div>

          {/* Menu items */}
          <div className="mt-4 space-y-1 border-t pt-4">
            {isAuthenticated ? (
              <>
                <div className="mb-2 flex items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-black">
                      {user?.username}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>

                <Link
                  href="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <Package className="h-4 w-4" />
                  <span>My Orders</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal("login");
                  }}
                  className="w-full rounded-lg border border-zinc-300 py-2.5 text-sm font-bold text-black hover:bg-zinc-100 cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal("register");
                  }}
                  className="w-full rounded-lg bg-black py-2.5 text-sm font-bold text-white shadow-md hover:bg-zinc-800 cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}