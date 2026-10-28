import React from "react";
import { Trash2, Plus, Minus, AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { CartItem } from "../types";
import { formatCurrency } from "../utils/currency";
import {
  getItemUnitPrice,
  isItemUnavailable,
  isItemWellnessUnpriced,
} from "../utils/split-engine";
import { useCartStore } from "../store/useCartStore";

interface CartItemRowProps {
  item: CartItem;
  itemIndex: number;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updateWellnessDuration = useCartStore((state) => state.updateWellnessDuration);
  const removeItem = useCartStore((state) => state.removeItem);

  const unavailable = isItemUnavailable(item);
  const wellnessNeedsDuration = isItemWellnessUnpriced(item);
  const unitPrice = getItemUnitPrice(item);

  // 1. Unavailable Item Render
  if (unavailable) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50/80 p-4 transition-all">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-rose-900 text-sm">Discontinued Provider Service</span>
              <span className="rounded bg-rose-200 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 uppercase">
                Unavailable
              </span>
            </div>
            <p className="mt-1 text-xs text-rose-700 leading-relaxed">
              This provider has delisted or altered this offering. It cannot be checked out and must be removed to continue.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => removeItem(item.id)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
          aria-label="Remove discontinued service"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Remove Item</span>
        </button>
      </div>
    );
  }

  const { product } = item;
  const currency = product.currency || "THB";
  const lineTotal = unitPrice !== null ? unitPrice * item.quantity : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title & Provider */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-slate-900 truncate">
              {product.title || "Medical Offering"}
            </h4>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase">
              {product.type}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {product.providerName || "Authorized MedEx Clinic"}
          </p>
        </div>

        {/* Pricing / Duration Column */}
        <div className="text-left sm:text-right">
          {unitPrice !== null ? (
            <div>
              <div className="text-sm font-bold text-slate-900">
                {formatCurrency(unitPrice, currency)}
                <span className="text-xs font-normal text-slate-500"> / unit</span>
              </div>
              {item.quantity > 1 && lineTotal !== null && (
                <div className="text-xs text-slate-500 font-medium">
                  Total: {formatCurrency(lineTotal, currency)}
                </div>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 border border-amber-200">
              <Clock className="h-3.5 w-3.5" />
              <span>Duration required</span>
            </div>
          )}
        </div>
      </div>

      {/* Wellness Duration Selection Requirement */}
      {product.type === "wellness" && product.wellnessPricing && (
        <div className={`mt-1 rounded-lg p-3 ${wellnessNeedsDuration ? "bg-amber-50/70 border border-amber-200" : "bg-slate-50 border border-slate-200"}`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-teal-600" />
              Treatment Duration & Final Price:
            </span>
            {wellnessNeedsDuration && (
              <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Select duration to price
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {product.wellnessPricing.map((option) => {
              const isSelected =
                item.selectedWellnessPricingId === option.id ||
                item.selectedWellnessPricing?.id === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateWellnessDuration(item.id, option.id)}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-all text-left ${
                    isSelected
                      ? "border-2 border-teal-600 bg-teal-50 text-teal-900 shadow-xs"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full border ${isSelected ? "border-teal-600 bg-teal-600" : "border-slate-400 bg-white"}`} />
                    <span>{option.durationInMinutes} Minutes Session</span>
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(option.amount_after_service_charge, currency)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Item Controls: Quantity + Remove */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Quantity:</span>
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-1 focus:ring-teal-500"
              aria-label={`Decrease quantity of ${product.title || "item"}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-bold text-slate-800" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition-colors focus:outline-none focus:ring-1 focus:ring-teal-500"
              aria-label={`Increase quantity of ${product.title || "item"}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => removeItem(item.id)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors focus:outline-none focus:underline"
          aria-label={`Remove ${product.title || "item"} from cart`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
}
