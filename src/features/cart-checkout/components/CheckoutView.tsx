"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  X,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Truck,
  Layers,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useCartStore } from "../store/useCartStore";
import { useSplitPackages } from "../store/selectors";
import { CheckoutStepper } from "./CheckoutStepper";
import { DevPanel } from "./DevPanel";
import { formatCurrency } from "../utils/currency";
import { calculateDiscount } from "../utils/coupons";

export function CheckoutView() {
  const searchParams = useSearchParams();
  const selectedGroupParam = searchParams.get("group");

  const cart = useCartStore((state) => state.cart);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const toast = useCartStore((state) => state.toastNotification);
  const clearNotification = useCartStore((state) => state.clearNotification);
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);

  const packages = useSplitPackages();
  const [mobileSummaryExpanded, setMobileSummaryExpanded] = useState(false);

  useEffect(() => {
    if (!cart) {
      fetchCart();
    }
  }, [cart, fetchCart]);

  // Isolate package if group query param is present
  const activePackage = selectedGroupParam
    ? packages.find((p) => p.groupType === selectedGroupParam)
    : null;

  // Active checkout packages (either the isolated one or all)
  const checkoutPackages = activePackage
    ? [activePackage]
    : selectedGroupParam
    ? [] // Group specified but not found
    : packages;

  // Compute subtotals and fees for active checkout scope
  const activeSubtotals: Record<string, number> = {};
  const activeDeliveryFees: Record<string, number> = {};

  for (const pkg of checkoutPackages) {
    for (const [cur, amount] of Object.entries(pkg.subtotals)) {
      activeSubtotals[cur] = (activeSubtotals[cur] || 0) + amount;
    }
    for (const [cur, fee] of Object.entries(pkg.deliveryFees)) {
      activeDeliveryFees[cur] = (activeDeliveryFees[cur] || 0) + fee;
    }
  }

  const discounts = calculateDiscount(
    appliedCoupon,
    activeSubtotals,
    activeDeliveryFees
  );

  const currencies = Array.from(
    new Set([...Object.keys(activeSubtotals), ...Object.keys(activeDeliveryFees)])
  );

  const finalTotals: Record<string, number> = {};
  for (const cur of currencies) {
    const sub = activeSubtotals[cur] || 0;
    const fee = activeDeliveryFees[cur] || 0;
    const disc = discounts[cur] || 0;
    finalTotals[cur] = Math.max(0, sub + fee - disc);
  }

  const totalItemCount = checkoutPackages.reduce(
    (acc, p) => acc + p.items.reduce((sum, i) => sum + (i.quantity || 1), 0),
    0
  );

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
            className="min-h-[44px] min-w-[44px] -m-2 flex items-center justify-center rounded p-1 hover:bg-black/5 transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Standardized Unified Page Header with Dynamic Breadcrumbs & Title */}
      <PageHeader
        title={
          activePackage
            ? `Checking out: ${activePackage.title}`
            : "Multi-Provider Split Checkout"
        }
        badge={
          activePackage ? (
            <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
              Isolated Group Checkout
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
              Unified Settlement ({packages.length} Packages)
            </span>
          )
        }
        description={
          activePackage
            ? `Direct settlement with ${activePackage.providerName} for ${activePackage.title}. Other packages in your cart remain untouched.`
            : "Review multi-provider medical orders, fulfillment splits, delivery fees, and proceed through unified checkout."
        }
        breadcrumbs={
          <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
            <Link
              href="/cart"
              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-teal-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Cart</span>
            </Link>
            {activePackage && (
              <>
                <span className="text-slate-300">/</span>
                <Link
                  href="/checkout"
                  className="font-semibold text-slate-600 hover:text-teal-700 transition-colors"
                >
                  All Packages
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">
                  Checking out: {activePackage.title}
                </span>
              </>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {activePackage && (
              <Link
                href="/checkout"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-teal-300 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-800 shadow-2xs hover:bg-teal-100 transition-colors"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Checkout All Packages</span>
              </Link>
            )}

            <div className="hidden md:inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Encrypted &amp; Idempotent</span>
            </div>

            <Link
              href="/services"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-teal-700 hover:border-teal-300 transition-colors"
            >
              <span>Add More Services</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Mobile Accordion Summary Bar (< lg) */}
        {checkoutPackages.length > 0 && (
          <div className="block lg:hidden mb-6 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileSummaryExpanded(!mobileSummaryExpanded)}
              className="w-full min-h-[48px] p-4 flex items-center justify-between text-left bg-slate-50/80 hover:bg-slate-100/70 transition-colors"
              aria-expanded={mobileSummaryExpanded}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-900">
                  Order Summary ({totalItemCount} items)
                </span>
                <span className="text-xs font-bold text-teal-700">
                  {currencies.map((cur) => formatCurrency(finalTotals[cur] || 0, cur)).join(" • ")}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                <span>{mobileSummaryExpanded ? "Hide" : "Show"}</span>
                {mobileSummaryExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {/* Expanded Accordion Body */}
            {mobileSummaryExpanded && (
              <div className="p-4 border-t border-slate-200 space-y-3 text-xs animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Packages in this Checkout:
                  </span>
                  {checkoutPackages.map((pkg) => (
                    <div key={pkg.id} className="flex justify-between text-slate-700 font-medium">
                      <span>{pkg.badgeLabel} ({pkg.providerName})</span>
                      <span className="font-bold text-slate-900">
                        {Object.entries(pkg.subtotals)
                          .map(([cur, amt]) => formatCurrency(amt, cur))
                          .join(", ")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Fulfillment / Collection:</span>
                    <span className="font-semibold text-slate-800">
                      {currencies.map((cur) => {
                        const fee = activeDeliveryFees[cur] ?? 0;
                        return fee > 0 ? formatCurrency(fee, cur) : "Free";
                      }).join(", ")}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-teal-700 font-semibold">
                      <span>Promo Discount ({appliedCoupon.code}):</span>
                      <span>
                        - {Object.entries(discounts)
                          .map(([cur, amt]) => formatCurrency(amt, cur))
                          .join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-100 pt-1.5">
                    <span>Total Settlement:</span>
                    <span className="text-teal-700">
                      {currencies.map((cur) => formatCurrency(finalTotals[cur] || 0, cur)).join(" • ")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Two-Column Checkout Layout (Desktop: Form on Left 8 Cols, Summary on Right 4 Cols) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Checkout Form Column (Takes full width on mobile, 8/12 on desktop) */}
          <div className="w-full lg:w-8/12">
            <CheckoutStepper />
          </div>

          {/* Desktop Sticky Order Summary Column (Sticky on desktop, hidden on mobile in favor of accordion) */}
          <div className="hidden lg:block lg:w-4/12 sticky top-20 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center justify-between">
                  <span>Checkout Overview</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                    <Layers className="h-3 w-3" />
                    {checkoutPackages.length} {checkoutPackages.length === 1 ? "Package" : "Packages"}
                  </span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 font-medium">
                  {activePackage ? "Isolated provider checkout" : "Unified multi-provider checkout"}
                </p>
              </div>

              {/* Package Breakdown */}
              <div className="space-y-3 border-t border-slate-100 pt-4 text-xs">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                  Fulfillment Packages:
                </span>
                <div className="space-y-2">
                  {checkoutPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{pkg.title}</span>
                        <span className="text-slate-600 font-semibold">
                          {pkg.items.reduce((s, i) => s + (i.quantity || 1), 0)} items
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Provider: {pkg.providerName}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-slate-700">
                        <span className="text-[11px]">Subtotal:</span>
                        <span className="font-bold text-slate-900">
                          {Object.entries(pkg.subtotals)
                            .map(([cur, amt]) => formatCurrency(amt, cur))
                            .join(", ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Fees */}
              <div className="space-y-2 border-t border-slate-100 pt-4 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                  <span className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" />
                    Dispatch / Collection Fees
                  </span>
                </div>
                {currencies.map((cur) => {
                  const fee = activeDeliveryFees[cur] ?? 0;
                  return (
                    <div key={cur} className="flex justify-between text-slate-700 text-xs">
                      <span>{cur} Dispatch:</span>
                      <span className="font-semibold text-slate-900">
                        {fee > 0 ? formatCurrency(fee, cur) : "Free"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Discounts */}
              {appliedCoupon && (
                <div className="space-y-2 border-t border-slate-100 pt-4 text-xs text-teal-700">
                  <div className="flex justify-between font-bold uppercase tracking-wider text-[10px]">
                    <span>Promo Savings ({appliedCoupon.code})</span>
                  </div>
                  {Object.entries(discounts).map(([cur, amt]) => (
                    <div key={cur} className="flex justify-between font-medium">
                      <span>{cur} Discount:</span>
                      <span className="font-bold">- {formatCurrency(amt, cur)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Final Settlement Total */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Settlement Amount
                </div>
                <div className="space-y-1.5">
                  {currencies.map((cur) => {
                    const amount = finalTotals[cur] || 0;
                    return (
                      <div key={cur} className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{cur}:</span>
                        <span className="text-base font-extrabold text-slate-900">
                          {formatCurrency(amount, cur)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 pt-1 leading-normal">
                  * Direct provider billing in local currency. Protected by idempotency tokens.
                </p>
              </div>

              {/* Trust & Security Badge */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-medium leading-tight">
                  Zero conversion spread. 256-bit encrypted checkout with reload recovery safety.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Developer simulation panel */}
        <DevPanel />
      </div>
    </div>
  );
}
