import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CartView } from "@/features/cart-checkout/components/CartView";
import { CartSkeleton } from "@/features/cart-checkout/components/CartSkeleton";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Healthcare Cart & Split Packages | MedEx",
  description:
    "Multi-provider healthcare cart routing medications, diagnostics, and appointments with individual delivery fee calculations and settlement.",
};

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <PageHeader
            title="Healthcare Cart & Split Fulfillment"
            description="Review multi-provider medical orders, fulfillment splits, delivery fees, and proceed through unified checkout."
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
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <CartSkeleton />
          </div>
        </div>
      }
    >
      <CartView />
    </Suspense>
  );
}
