"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  RotateCcw,
  AlertCircle,
  X,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useCartStore } from "../store/useCartStore";
import { useCartTotalCount, useSplitPackages } from "../store/selectors";
import { VendorGroupCard } from "./VendorGroupCard";
import { OrderSummary } from "./OrderSummary";
import { EmptyCartState } from "./EmptyCartState";
import { GuestCartMergeBanner } from "./GuestCartMergeBanner";
import { DevPanel } from "./DevPanel";
import { CartSkeleton } from "./CartSkeleton";

export function CartView() {
  const cart = useCartStore((state) => state.cart);
  const isLoading = useCartStore((state) => state.isLoading);
  const error = useCartStore((state) => state.error);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const toast = useCartStore((state) => state.toastNotification);
  const clearNotification = useCartStore((state) => state.clearNotification);

  const packages = useSplitPackages();
  const totalItemCount = useCartTotalCount();

  useEffect(() => {
    // If cart is not yet initialized, load it
    if (!cart) {
      fetchCart();
    }
  }, [cart, fetchCart]);

  // Loading skeleton state
  if (isLoading && !cart) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader
          title="Healthcare Cart & Split Fulfillment"
          description="Review multi-provider medical orders, fulfillment splits, delivery fees, and proceed through unified checkout."
          actions={
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-teal-700 hover:border-teal-300 transition-colors"
            >
              <span>Add More Services</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <CartSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !cart) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to Load Healthcare Cart</h2>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <button
          type="button"
          onClick={() => fetchCart(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const isEmpty = !cart || cart.groups.length === 0 || cart.totalItems === 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-xl transition-all ${
            toast.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-slate-200 bg-white text-slate-800"
          }`}
          role="alert"
        >
          <div className="text-xs font-semibold">{toast.message}</div>
          <button
            type="button"
            onClick={clearNotification}
            className="rounded p-1 hover:bg-black/5 transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Standardized Unified Page Header */}
      <PageHeader
        title="Healthcare Cart & Split Fulfillment"
        description="Review multi-provider medical orders, fulfillment splits, delivery fees, and proceed through unified checkout."
        badge={
          <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
            {totalItemCount} {totalItemCount === 1 ? "Item" : "Items"}
          </span>
        }
        actions={
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-teal-700 hover:border-teal-300 transition-colors"
          >
            <span>Add More Services</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Guest Cart Merge Banner */}
        <GuestCartMergeBanner />

        {/* Main Content Area */}
        {isEmpty ? (
          <EmptyCartState />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            {/* Split Packages Column (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-4 w-4 text-teal-600" />
                  Split Fulfillment Groups ({packages.length})
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  Autonomous provider routing
                </span>
              </div>

              {packages.map((pkg) => (
                <VendorGroupCard key={pkg.id} packageData={pkg} />
              ))}
            </div>

            {/* Order Summary Sticky Column (4 Cols) */}
            <div className="lg:col-span-4">
              <OrderSummary />
            </div>
          </div>
        )}

        {/* Dev Panel */}
        <DevPanel />
      </div>
    </div>
  );
}
