import React from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import { useCartStore } from "../store/use-cart-store";

export function EmptyCartState() {
  const fetchCart = useCartStore((state) => state.fetchCart);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-14 text-center shadow-xs">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-600 shadow-inner ring-8 ring-teal-50/50">
        <ShoppingBag className="h-10 w-10" />
      </div>

      <h3 className="mt-6 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
        Your Healthcare Cart is Empty
      </h3>
      <p className="mt-2.5 max-w-md text-sm text-slate-500 leading-relaxed">
        You haven&apos;t added any clinic check-ups, diagnostic lab tests, or wellness appointments to
        your cart yet. Explore our network of accredited providers across Thailand, Nepal, and India.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <Link
          href="/services"
          className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <span>Explore Services</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={() => fetchCart(true)}
          className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <RotateCcw className="h-4 w-4 text-slate-500" />
          <span>Reload Sample Assessment Cart</span>
        </button>
      </div>

      <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-600 border border-slate-200">
        <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
        <span>Direct Provider Settlement • Local Currency Guarantee • Idempotent Routing</span>
      </div>
    </div>
  );
}
