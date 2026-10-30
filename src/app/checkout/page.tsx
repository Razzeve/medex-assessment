import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CheckoutView } from "@/features/cart-checkout/components/CheckoutView";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Multi-Provider Split Checkout | MedEx",
  description:
    "Direct settlement with medical providers across Thailand, Nepal, and India with discrete fulfillment routing and idempotency-backed retry.",
};

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <PageHeader
            containerClassName="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
            title="Healthcare Cart & Split Fulfillment"
            description="Review multi-provider medical orders, fulfillment splits, delivery fees, and proceed through unified checkout."
            breadcrumbs={
              <Link
                href="/cart"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Cart</span>
              </Link>
            }
            actions={
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <span>Add More Services</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
            <div className="h-20 rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between">
              <div className="h-6 w-48 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-8 w-24 rounded-lg bg-slate-200 animate-pulse" />
            </div>
            <div className="h-96 rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="h-6 w-40 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-4 w-full rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-12 w-full rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-12 w-full rounded-lg bg-slate-200 animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <CheckoutView />
    </Suspense>
  );
}
