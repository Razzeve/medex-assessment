"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, X } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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

        {/* Checkout Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/cart"
                className="text-slate-400 hover:text-slate-700 transition-colors"
                aria-label="Return to cart"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Multi-Provider Split Checkout
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Direct settlement with medical providers across Thailand, Nepal, and India.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>Encrypted Medical Order Routing</span>
          </div>
        </div>

        {/* Stepper Flow */}
        <CheckoutStepper />

        {/* Dev Panel */}
        <DevPanel />
      </div>
    </div>
  );
}

