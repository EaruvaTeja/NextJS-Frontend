// app/profile/page.tsx
//
// Profile page with 3 tabs:
//   - Details    : edit name
//   - Orders     : last 5 orders (links to full /orders)
//   - Addresses  : placeholder
//
// Layout:
//   Desktop: [user card] [tab content]
//   Mobile:  stacked

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileDetailsForm } from "@/components/profile/ProfileDetailsForm";
import { AddressList } from "@/components/address/AddressList";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  OrderList,
  OrderListSkeleton,
  OrderEmptyState,
} from "@/components/order/OrderList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";


// ===========================================================================
// OUTER — Suspense boundary for useSearchParams
// ===========================================================================
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

// ===========================================================================
// INNER — reads ?tab= from URL, uses auth + orders hooks
// ===========================================================================
type TabKey = "details" | "orders" | "addresses";

function ProfileContent() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  // Read initial tab from URL (?tab=addresses etc.)
  const tabParam = searchParams.get("tab");
  const initialTab: TabKey =
    tabParam === "addresses" || tabParam === "orders" || tabParam === "details"
      ? tabParam
      : "details";

  const [tab, setTab] = useState<TabKey>(initialTab);

  // If auth is still loading
  if (authLoading || !user) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "My Account" },
        ]}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          My Account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal info, orders and addresses
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left: user card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ProfileCard user={user} />
        </aside>

        {/* Right: tabs */}
        <main>
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as TabKey)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-5">
              <ProfileDetailsForm user={user} />
            </TabsContent>

            <TabsContent value="orders" className="mt-5">
              <OrdersTab />
            </TabsContent>

            <TabsContent value="addresses" className="mt-5">
              <AddressList />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// ===========================================================================
// Loading skeleton (also used as Suspense fallback)
// ===========================================================================
function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

// ===========================================================================
// OrdersTab — recent 5 orders + link to full page
// ===========================================================================
function OrdersTab() {
  const { orders, isLoading, error } = useOrders();

  if (isLoading) {
    return <OrderListSkeleton count={3} />;
  }

  if (error) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Could not load your orders. Please try again later.
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return <OrderEmptyState />;
  }

  const recent = orders.slice(0, 5);
  const hasMore = orders.length > recent.length;

  return (
    <div className="space-y-4">
      <OrderList orders={recent} />

      {hasMore && (
        <Link
          href="/orders"
          className="
            group flex w-full items-center justify-center gap-1.5 rounded-xl
            border border-dashed border-zinc-300 bg-zinc-50/40
            px-4 py-3 text-sm font-semibold text-primary
            transition-colors hover:border-primary/40 hover:bg-primary/5
          "
        >
          View all {orders.length} orders
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}