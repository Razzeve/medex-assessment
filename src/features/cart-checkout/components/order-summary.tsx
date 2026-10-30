import React, { useState } from "react";
import Link from "next/link";
import {
  Tag,
  ArrowRight,
  Info,
  X,
  Truck,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency, formatSubtotals } from "../utils/currency";
import {
  useCartSubtotals,
  useCartValidation,
  useSplitPackages,
  useTotalDeliveryFees,
} from "../store/selectors";
import { useCartStore } from "../store/use-cart-store";
import { calculateDiscount, validateCoupon } from "../utils/coupons";

export function OrderSummary() {
  const packages = useSplitPackages();
  const subtotals = useCartSubtotals();
  const deliveryFees = useTotalDeliveryFees();
  const { hasUnavailable, hasUnpriced, canCheckoutAny } = useCartValidation();

  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotalEntries = formatSubtotals(subtotals);
  const discounts = calculateDiscount(appliedCoupon, subtotals, deliveryFees);

  // Compute final totals per currency
  const currencies = Array.from(
    new Set([...Object.keys(subtotals), ...Object.keys(deliveryFees)])
  );

  const finalTotals: Record<string, number> = {};
  for (const cur of currencies) {
    const sub = subtotals[cur] || 0;
    const fee = deliveryFees[cur] || 0;
    const disc = discounts[cur] || 0;
    finalTotals[cur] = Math.max(0, sub + fee - disc);
  }

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const result = validateCoupon(couponInput);
    if (!result.valid || !result.coupon) {
      setCouponError(result.message);
      return;
    }
    applyCoupon(result.coupon);
    setCouponInput("");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs lg:sticky lg:top-20 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center justify-between">
          <span>Order Summary</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
            <Layers className="h-3 w-3" />
            {packages.length} Split {packages.length === 1 ? "Package" : "Packages"}
          </span>
        </h3>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Multi-provider settlement breakdown
        </p>
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Services Subtotal
        </div>
        {subtotalEntries.length > 0 ? (
          <div className="space-y-2">
            {subtotalEntries.map(({ currency, formatted }) => (
              <div key={currency} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">{currency} Services</span>
                <span className="font-semibold text-slate-900">{formatted}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">No priced services</div>
        )}
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-slate-400" />
            Fulfillment &amp; Sample Dispatch
          </span>
        </div>
        {currencies.map((cur) => {
          const fee = deliveryFees[cur] ?? 0;
          return (
            <div key={cur} className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">{cur} Fulfillment</span>
              {fee > 0 ? (
                <span className="font-semibold text-slate-900">
                  {formatCurrency(fee, cur)}
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Free
                </span>
              )}
            </div>
          );
        })}
      </div>

      {appliedCoupon && (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between text-xs font-bold text-teal-700 uppercase tracking-wider">
            <span>Promo Discount ({appliedCoupon.code})</span>
            <button
              type="button"
              onClick={removeCoupon}
              className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors"
              title="Remove promo code"
              aria-label="Remove promo code"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {Object.entries(discounts).map(([cur, amount]) => (
            <div key={cur} className="flex items-center justify-between text-sm text-teal-700 font-medium">
              <span>{cur} Savings</span>
              <span className="font-bold">- {formatCurrency(amount, cur)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-100 pt-4">
        <form onSubmit={handleApplyCoupon} className="space-y-2">
          <label htmlFor="coupon-code" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Tag className="h-3.5 w-3.5 text-teal-600" />
            Have a voucher or promotional code?
          </label>
          <div className="flex gap-2">
            <input
              id="coupon-code"
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="e.g. MEDEX10"
              className="flex-1 min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 uppercase placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              Apply
            </button>
          </div>
          {couponError && (
            <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
          )}
        </form>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Total Payable by Currency
        </div>
        <div className="space-y-2">
          {currencies.map((cur) => {
            const amount = finalTotals[cur] || 0;
            return (
              <div key={cur} className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{cur} Settlement:</span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900">
                  {formatCurrency(amount, cur)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-500 pt-1 leading-normal">
          * Each provider is billed in their local currency. Amounts are never cross-converted.
        </p>
      </div>

      <div className="space-y-3">
        {hasUnavailable && (
          <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            Please remove discontinued items before checking out.
          </p>
        )}
        {hasUnpriced && (
          <p className="text-xs text-amber-800 font-semibold bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
            Please select duration options for all wellness services.
          </p>
        )}

        <Link
          href={canCheckoutAny ? "/checkout" : "#"}
          aria-disabled={!canCheckoutAny}
          className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold shadow-md transition-all ${
            canCheckoutAny
              ? "bg-teal-600 text-white hover:bg-teal-700 shadow-teal-600/20 active:scale-[0.99]"
              : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
          }`}
        >
          <span>Proceed to Multi-Provider Checkout</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3.5 text-xs text-teal-900 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-teal-950">
          <Info className="h-4 w-4 text-teal-600 shrink-0" />
          <span>Why Separate Currency Subtotals?</span>
        </div>
        <p className="text-[11px] leading-relaxed text-teal-800">
          MedEx routes orders directly to accredited medical facilities across Thailand (THB),
          Nepal (NPR), and India (INR). To avoid opaque currency conversion spreads, each package is
          settled directly with the provider in their licensed jurisdiction.
        </p>
        <div className="pt-1 flex items-center gap-1 text-[10px] font-semibold text-teal-900">
          <ShieldCheck className="h-3 w-3 text-teal-600" />
          <span>Protected by Idempotent Gateway Retries</span>
        </div>
      </div>
    </div>
  );
}
