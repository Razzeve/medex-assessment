import React from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, RotateCcw } from "lucide-react";
import { useCartStore } from "../store/useCartStore";

export function EmptyCartState() {
  const fetchCart = useCartStore((state) => state.fetchCart);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 shadow-inner">
        <ShoppingBag className="h-8 w-8" />
      </div>

      <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
        Your Healthcare Cart is Empty
      </h3>
      <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
        You haven&apos;t added any clinic check-ups, diagnostic lab tests, or wellness appointments to
        your cart yet.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <span>Browse Medical Services</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={() => fetchCart(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <RotateCcw className="h-4 w-4 text-slate-500" />
          <span>Reload Sample Assessment Cart</span>
        </button>
      </div>
    </div>
  );
}
