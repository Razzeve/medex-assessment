import { Suspense } from "react";
import { Metadata } from "next";
import { CartView } from "@/features/cart-checkout/components/CartView";

export const metadata: Metadata = {
  title: "Healthcare Cart & Split Packages | MedEx",
  description:
    "Multi-provider healthcare cart routing medications, diagnostics, and appointments with individual delivery fee calculations and settlement.",
};

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="h-8 w-48 rounded bg-slate-200 animate-pulse mb-8" />
          <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      }
    >
      <CartView />
    </Suspense>
  );
}
