import React, { useState } from "react";
import {
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
  Clock,
  AlertCircle,
  FlaskConical,
  Sparkles,
  Building2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { CartItem } from "../types";
import { formatCurrency } from "../utils/currency";
import {
  getItemUnitPrice,
  isItemUnavailable,
  isItemWellnessUnpriced,
} from "../utils/split-engine";
import { useCartStore } from "../store/use-cart-store";

interface CartItemRowProps {
  item: CartItem;
  itemIndex: number;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updateWellnessDuration = useCartStore((state) => state.updateWellnessDuration);
  const removeItem = useCartStore((state) => state.removeItem);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [imgError, setImgError] = useState(false);

  const unavailable = isItemUnavailable(item);
  const wellnessNeedsDuration = isItemWellnessUnpriced(item);
  const unitPrice = getItemUnitPrice(item);

  // 1. Unavailable Item Render
  if (unavailable) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50/80 p-4 transition-all">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
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
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-100 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
          aria-label="Remove discontinued service"
        >
          <Trash2 className="h-4 w-4" />
          <span>Remove Item</span>
        </button>
      </div>
    );
  }

  const { product } = item;
  const currency = product.currency || "THB";
  const lineTotal = unitPrice !== null ? unitPrice * item.quantity : null;

  const handleDecrement = () => {
    if (item.quantity <= 1) {
      // Prompt confirmation before removing
      setShowConfirmDelete(true);
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const getFallbackIcon = () => {
    switch (product.type) {
      case "lab_test":
        return <FlaskConical className="h-6 w-6 text-teal-600" />;
      case "wellness":
        return <Sparkles className="h-6 w-6 text-purple-600" />;
      case "package":
        return <Building2 className="h-6 w-6 text-blue-600" />;
      case "insurance":
        return <ShieldCheck className="h-6 w-6 text-emerald-600" />;
      default:
        return <Stethoscope className="h-6 w-6 text-slate-600" />;
    }
  };

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 shadow-2xs">
      {/* Top Details Row: Thumbnail + Info + Pricing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Item Image / Fallback Icon */}
          {product.imageUrl && !imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.imageUrl}
              alt={product.title || "Service"}
              onError={() => setImgError(true)}
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
            />
          ) : (
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              {getFallbackIcon()}
            </div>
          )}

          {/* Title & Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-semibold text-slate-900 break-words">
                {product.title || "Medical Offering"}
              </h4>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                {product.type?.replace("_", " ")}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              {product.providerName || "Authorized MedEx Clinic"}
            </p>
          </div>
        </div>

        {/* Pricing / Duration Column */}
        <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0">
          {unitPrice !== null ? (
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900">
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
            <div className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
              <Clock className="h-3.5 w-3.5" />
              <span>Duration required</span>
            </div>
          )}
        </div>
      </div>

      {/* Wellness Duration Selection Requirement */}
      {product.type === "wellness" && product.wellnessPricing && (
        <div
          className={`rounded-xl p-3.5 ${
            wellnessNeedsDuration
              ? "bg-amber-50/70 border border-amber-200"
              : "bg-slate-50 border border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-teal-600" />
              Treatment Duration &amp; Session Rate:
            </span>
            {wellnessNeedsDuration && (
              <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Select option to price
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
                  className={`flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all text-left ${
                    isSelected
                      ? "border-2 border-teal-600 bg-teal-50 text-teal-900 shadow-2xs font-semibold"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full border ${
                        isSelected ? "border-teal-600 bg-teal-600" : "border-slate-400 bg-white"
                      }`}
                    />
                    <span>{option.durationInMinutes} Mins Session</span>
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

      {/* Confirmation Banner for Deletion (Accessible & Clean) */}
      {showConfirmDelete ? (
        <div
          role="alert"
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 p-3.5"
        >
          <div className="flex items-center gap-2 text-xs text-rose-900 font-semibold">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Remove &ldquo;{product.title || "item"}&rdquo; from cart?</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-rose-700 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <span>Yes, Remove</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        /* Item Controls: Stepper (Touch Target >= 44x44px) + Delete Button */
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-500 font-medium">Quantity:</span>
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={handleDecrement}
                className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label={`Decrease quantity of ${product.title || "item"}`}
                title={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
              >
                {item.quantity === 1 ? (
                  <Trash2 className="h-4 w-4 text-rose-500" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
              </button>
              <span
                className="w-9 text-center text-sm font-bold text-slate-900"
                aria-live="polite"
              >
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label={`Increase quantity of ${product.title || "item"}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
            aria-label={`Remove ${product.title || "item"} from cart`}
          >
            <Trash2 className="h-4 w-4" />
            <span>Remove</span>
          </button>
        </div>
      )}
    </div>
  );
}
