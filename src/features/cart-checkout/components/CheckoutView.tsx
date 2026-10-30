"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useCartStore } from "../store/useCartStore";
import { CheckoutStepper } from "./CheckoutStepper";
import { DevPanel } from "./DevPanel";

export function CheckoutView() {
  const cart = useCartStore((state) => state.cart);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const toast = useCartStore((state) => state.toastNotification);
  const clearNotification = useCartStore((state) => state.clearNotification);

  useEffect(() => {
    if (!cart) {
      fetchCart();
    }
  }, [cart, fetchCart]);

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
        containerClassName="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
        title="Healthcare Cart & Split Fulfillment"
        badge={
          <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
            Split Settlement
          </span>
        }
        description="Review multi-provider medical orders, fulfillment splits, delivery fees, and proceed through unified checkout."
        breadcrumbs={
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Cart</span>
          </Link>
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Encrypted &amp; Idempotent</span>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-teal-700 hover:border-teal-300 transition-colors"
            >
              <span>Add More Services</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Stepper Wizard Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <CheckoutStepper />
        </div>

        {/* Developer panel for simulated errors */}
        <DevPanel />
      </div>
    </div>
  );
}
