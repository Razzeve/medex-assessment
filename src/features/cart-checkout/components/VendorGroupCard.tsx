import React from "react";
import Link from "next/link";
import {
  FlaskConical,
  Sparkles,
  Building2,
  ShieldCheck,
  Stethoscope,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { SplitPackage } from "../types";
import { CartItemRow } from "./CartItemRow";
import { formatCurrency, formatSubtotals } from "../utils/currency";

interface VendorGroupCardProps {
  packageData: SplitPackage;
  showCheckoutAction?: boolean;
}

export function VendorGroupCard({
  packageData,
  showCheckoutAction = true,
}: VendorGroupCardProps) {
  const {
    groupType,
    badgeLabel,
    providerName,
    estimatedTimeline,
    items,
    subtotals,
    deliveryFees,
    eligibleForCheckout,
    blockingReasons,
    hasUnpricedItems,
  } = packageData;

  const subtotalList = formatSubtotals(subtotals);

  const getGroupIcon = () => {
    switch (groupType) {
      case "lab_test":
        return <FlaskConical className="h-5 w-5 text-teal-600" />;
      case "wellness":
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      case "package":
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case "insurance":
        return <ShieldCheck className="h-5 w-5 text-emerald-600" />;
      default:
        return <Stethoscope className="h-5 w-5 text-slate-600" />;
    }
  };

  const getBadgeStyle = () => {
    switch (groupType) {
      case "lab_test":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "wellness":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "package":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "insurance":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
      aria-labelledby={`heading-${groupType}`}
    >
      {/* Group Header */}
      <div className="border-b border-slate-100 bg-slate-50/70 p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200">
            {getGroupIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 id={`heading-${groupType}`} className="font-bold text-slate-900 text-base">
                {badgeLabel}
              </h3>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getBadgeStyle()}`}
              >
                {groupType.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Provider: <span className="text-slate-800">{providerName}</span>
            </p>
          </div>
        </div>

        {/* Fulfillment Timeline */}
        <div className="mt-3 sm:mt-0 flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
          <Clock className="h-3.5 w-3.5 text-teal-600" />
          <span>{estimatedTimeline}</span>
        </div>
      </div>

      {/* Items List */}
      <div className="p-5 space-y-3">
        {items.map((item, idx) => (
          <CartItemRow key={item.id} item={item} itemIndex={idx} />
        ))}
      </div>

      {/* Blocking Warnings */}
      {blockingReasons.length > 0 && (
        <div className="mx-5 mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800">
              <span className="font-semibold">Action required before checkout:</span>
              <ul className="mt-1 list-disc list-inside space-y-0.5 font-medium">
                {blockingReasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Subtotal & Routing Footer */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Discrete Multi-Currency Breakdown */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Package Subtotal ({packageData.items.reduce((acc, i) => acc + (i.quantity || 1), 0)} items):
          </div>

          {subtotalList.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {subtotalList.map(({ currency, amount }) => {
                const deliveryFee = deliveryFees[currency] ?? 0;

                return (
                  <div
                    key={currency}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-2xs"
                  >
                    <span className="font-bold text-slate-900">
                      {formatCurrency(amount, currency)}
                    </span>
                    {deliveryFee > 0 ? (
                      <span className="text-[11px] text-slate-500">
                        (+ {formatCurrency(deliveryFee, currency)} collection)
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-600">
                        (Free dispatch)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs font-medium text-amber-700">
              {hasUnpricedItems ? "Price pending selection" : "No priced items"}
            </div>
          )}
        </div>

        {/* Action Button */}
        {showCheckoutAction && (
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            {eligibleForCheckout ? (
              <Link
                href={`/checkout?group=${groupType}`}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <span>Checkout This Package</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-xs font-medium text-slate-500 cursor-not-allowed"
                title="Resolve duration or remove discontinued items to checkout"
              >
                <span>Resolve Items to Checkout</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
