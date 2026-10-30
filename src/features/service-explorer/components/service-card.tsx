'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  Home,
  Clock,
  Sparkles,
  CheckCircle2,
  Check,
  Building2,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { useCartStore } from '@/features/cart-checkout/store/useCartStore';
import { EnrichedService, ViewMode, WellnessCalculatedOption } from '../types';
import { formatPrice } from '../utils/pricing';

interface ServiceCardProps {
  service: EnrichedService;
  viewMode?: ViewMode;
  showProviderHeader?: boolean;
}

export function ServiceCard({
  service,
  viewMode = 'grid',
  showProviderHeader = false,
}: ServiceCardProps) {
  const isWellness = service.type === 'wellness';
  const wellnessOptions = service.calculatedPrice.wellnessOptions || [];

  // Local state for wellness duration selection
  const [selectedDuration, setSelectedDuration] = useState<number | undefined>(
    service.calculatedPrice.minDuration || wellnessOptions[0]?.durationInMinutes
  );

  // Cart integration
  const addItem = useCartStore((state) => state.addItem);
  const [addedState, setAddedState] = useState(false);

  const activeWellnessOption: WellnessCalculatedOption | undefined = isWellness
    ? wellnessOptions.find((opt) => opt.durationInMinutes === selectedDuration) || wellnessOptions[0]
    : undefined;

  const displayOriginalPrice = isWellness
    ? activeWellnessOption?.originalPrice || service.calculatedPrice.originalPrice
    : service.calculatedPrice.originalPrice;

  const displayFinalPrice = isWellness
    ? activeWellnessOption?.finalPrice || service.calculatedPrice.finalPrice
    : service.calculatedPrice.finalPrice;

  const displayDiscountAmount = isWellness
    ? activeWellnessOption?.discountAmount || service.calculatedPrice.discountAmount
    : service.calculatedPrice.discountAmount;

  const currency = service.calculatedPrice.currency;
  const hasDiscount = displayDiscountAmount > 0;
  const provider = service.provider;

  // Service type labels & colors
  const typeBadgeColors: Record<string, string> = {
    package: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    lab_test: 'bg-sky-50 text-sky-700 border-sky-200',
    wellness: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    service: 'bg-amber-50 text-amber-700 border-amber-200',
    insurance: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const typeLabels: Record<string, string> = {
    package: 'Package',
    lab_test: 'Lab Test',
    wellness: 'Wellness',
    service: 'Clinical Service',
    insurance: 'Insurance',
  };

  const isList = viewMode === 'list';

  const handleBookService = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      serviceId: service.id,
      title: service.title,
      type: service.type,
      currency,
      price: displayFinalPrice,
      providerId: provider.id,
      providerName: provider.name,
      categoryTitle: service.category?.title,
      selectedWellnessPricingId: activeWellnessOption?.id,
      selectedWellnessPricing: activeWellnessOption
        ? {
            id: activeWellnessOption.id,
            durationInMinutes: activeWellnessOption.durationInMinutes,
            amount_after_service_charge: activeWellnessOption.finalPrice,
          }
        : undefined,
      wellnessPricing: isWellness
        ? wellnessOptions.map((opt) => ({
            id: opt.id,
            durationInMinutes: opt.durationInMinutes,
            amount_after_service_charge: opt.finalPrice,
          }))
        : undefined,
    });

    setAddedState(true);
    setTimeout(() => {
      setAddedState(false);
    }, 2500);
  };

  return (
    <div
      className={`group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-teal-500 hover:shadow-md ${
        isList ? 'md:flex-row md:items-center md:gap-6' : ''
      }`}
    >
      <div className={`flex-1 ${isList ? 'md:max-w-xl' : ''}`}>
        {/* Optional Provider Header if displayed standalone */}
        {showProviderHeader && (
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium truncate">
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{provider.name}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500">
                {provider.providerInformation.city.name}
              </span>
            </div>
          </div>
        )}

        {/* Badges: Type & Category */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
              typeBadgeColors[service.type] || 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {typeLabels[service.type] || service.type}
          </span>

          {service.category && (
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              {service.category.title}
              {service.subCategory && ` / ${service.subCategory.title}`}
            </span>
          )}

          {service.testAtHome && (
            <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
              <Home className="h-3 w-3" />
              Home Test
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2.5 text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
          {service.title}
        </h3>

        {/* Wellness duration selector pills */}
        {isWellness && wellnessOptions.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Select session duration:</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {wellnessOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedDuration(opt.durationInMinutes)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    selectedDuration === opt.durationInMinutes
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.durationInMinutes} mins
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pricing & Booking Column - Redesigned to guarantee zero squishing */}
      <div
        className={`mt-4 border-t border-slate-100 pt-3 ${
          isList
            ? 'md:mt-0 md:border-t-0 md:pt-0 md:flex md:flex-col md:items-end md:justify-center md:pl-6 md:border-l md:border-slate-100 md:shrink-0 md:w-56'
            : 'flex flex-col justify-between'
        }`}
      >
        <div className={isList ? 'md:text-right w-full' : 'w-full'}>
          {/* Top row of footer: Original price strikethrough & Special Offer pill tag */}
          <div className="flex flex-wrap items-center gap-1.5 min-h-[22px] mb-1">
            {isWellness && (
              <span className="text-[11px] font-medium text-slate-500">From</span>
            )}
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(displayOriginalPrice, currency)}
              </span>
            )}
            {hasDiscount && (
              <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                <Sparkles className="h-2.5 w-2.5" />
                Special Offer
              </span>
            )}
          </div>

          {/* Distinct row: Main bold formatted price */}
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              {displayFinalPrice === 0 && displayOriginalPrice === 0
                ? 'Free'
                : formatPrice(displayFinalPrice, currency)}
            </span>
            {isWellness && selectedDuration && (
              <span className="text-xs text-slate-500 font-medium">
                / {selectedDuration}m
              </span>
            )}
          </div>
        </div>

        {/* Full-width Book Service CTA with responsive protection and feedback */}
        <div className="mt-3 w-full">
          <button
            type="button"
            onClick={handleBookService}
            className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 px-3 text-xs font-semibold shadow-xs transition-all duration-200 focus:outline-none focus:ring-2 whitespace-nowrap cursor-pointer ${
              addedState
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500/30 ring-1 ring-emerald-600'
                : 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 focus:ring-teal-500/30'
            }`}
          >
            {addedState ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Added ✓</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Book Service</span>
              </>
            )}
          </button>

          {addedState && (
            <div className="mt-1.5 flex items-center justify-center animate-in fade-in slide-in-from-top-1 duration-200">
              <Link
                href="/cart"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 hover:underline"
              >
                <span>View Cart</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
