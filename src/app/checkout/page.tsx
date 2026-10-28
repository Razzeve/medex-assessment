import { Suspense } from "react";
import { Metadata } from "next";
import { CheckoutView } from "@/features/cart-checkout/components/CheckoutView";

export const metadata: Metadata = {
  title: "Multi-Provider Split Checkout | MedEx",
  description:
    "Direct settlement with medical providers across Thailand, Nepal, and India with discrete fulfillment routing and idempotency-backed retry.",
};

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="h-8 w-64 rounded bg-slate-200 animate-pulse mb-8" />
          <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      }
    >
      <CheckoutView />
    </Suspense>
  );
}
