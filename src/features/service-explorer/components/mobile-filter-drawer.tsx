'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, RotateCcw } from 'lucide-react';
import {
  Category,
  Provider,
  FilterState,
  ServiceType,
  Currency,
  EnrichedService,
} from '../types';
import { FilterSidebar } from './filter-sidebar';
import { calculateFacetCounts } from '../utils/facets';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  providers: Provider[];
  services: EnrichedService[];
  currentFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  categories,
  providers,
  services,
  currentFilters,
  onApplyFilters,
}: MobileFilterDrawerProps) {
  const [pendingFilters, setPendingFilters] = useState<FilterState>(currentFilters);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setPendingFilters(currentFilters);
    }
  }

  // Prevent body scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Compute live facets and result count for pending selection
  const pendingFacets = useMemo(() => {
    return calculateFacetCounts(services, pendingFilters);
  }, [services, pendingFilters]);

  const pendingCount = pendingFacets.totalVisibleMatches;

  // Handlers for pending filter changes
  const handleToggleType = (type: ServiceType) => {
    const exists = pendingFilters.types.includes(type);
    const nextTypes = exists
      ? pendingFilters.types.filter((t) => t !== type)
      : [...pendingFilters.types, type];
    setPendingFilters({ ...pendingFilters, types: nextTypes });
  };

  const handleSetCategory = (categoryId: string | null) => {
    setPendingFilters({
      ...pendingFilters,
      categoryId,
      subCategoryId: null,
    });
  };

  const handleSetSubCategory = (subCategoryId: string | null) => {
    setPendingFilters({ ...pendingFilters, subCategoryId });
  };

  const handleToggleProvider = (providerId: number) => {
    const exists = pendingFilters.providerIds.includes(providerId);
    const nextProv = exists
      ? pendingFilters.providerIds.filter((id) => id !== providerId)
      : [...pendingFilters.providerIds, providerId];
    setPendingFilters({ ...pendingFilters, providerIds: nextProv });
  };

  const handleSetLocation = (country: string | null, city: string | null) => {
    // 1. Explicit clear or reset to All
    if (!country && !city) {
      setPendingFilters({
        ...pendingFilters,
        country: null,
        city: null,
        currency: 'ALL',
      });
      return;
    }

    // 2. Toggle behavior: clicking active country toggles it off
    const isCountryActive =
      country &&
      (pendingFilters.country === country ||
        (!pendingFilters.country &&
          ((country === 'Thailand' && pendingFilters.currency === 'THB') ||
            (country === 'Nepal' && pendingFilters.currency === 'NPR') ||
            (country === 'India' && pendingFilters.currency === 'INR'))));

    if (isCountryActive && !city) {
      setPendingFilters({
        ...pendingFilters,
        country: null,
        city: null,
        currency: 'ALL',
      });
      return;
    }

    // City toggle
    let nextCity = city;
    if (city && pendingFilters.city === city) {
      nextCity = null;
    }

    let nextCurrency = pendingFilters.currency;
    if (country === 'Thailand') nextCurrency = 'THB';
    else if (country === 'Nepal') nextCurrency = 'NPR';
    else if (country === 'India') nextCurrency = 'INR';
    else if (!country) nextCurrency = 'ALL';

    setPendingFilters({
      ...pendingFilters,
      country,
      city: nextCity,
      currency: nextCurrency,
    });
  };

  const handleSetPriceRange = (
    minPrice: number | null,
    maxPrice: number | null,
    currency?: Currency | 'ALL'
  ) => {
    setPendingFilters({
      ...pendingFilters,
      minPrice,
      maxPrice,
      currency: currency !== undefined ? currency : pendingFilters.currency,
    });
  };

  const handleToggleTestAtHome = () => {
    setPendingFilters({
      ...pendingFilters,
      testAtHome: !pendingFilters.testAtHome,
    });
  };

  const handleReset = () => {
    setPendingFilters({
      ...pendingFilters,
      types: [],
      categoryId: null,
      subCategoryId: null,
      providerIds: [],
      country: null,
      city: null,
      currency: 'ALL',
      minPrice: null,
      maxPrice: null,
      testAtHome: false,
    });
  };

  const handleApply = () => {
    onApplyFilters(pendingFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filter-title"
      className="fixed inset-0 z-50 flex lg:hidden"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="mobile-filter-title" className="text-base font-bold text-slate-900">
            Filters
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset All</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters drawer"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <FilterSidebar
            categories={categories}
            providers={providers}
            filters={pendingFilters}
            facets={pendingFacets}
            onToggleType={handleToggleType}
            onSetCategory={handleSetCategory}
            onSetSubCategory={handleSetSubCategory}
            onToggleProvider={handleToggleProvider}
            onSetLocation={handleSetLocation}
            onSetPriceRange={handleSetPriceRange}
            onToggleTestAtHome={handleToggleTestAtHome}
            onResetFilters={handleReset}
            hasActiveFilters={true}
            className="border-0 shadow-none p-0 static h-auto overflow-visible pr-0"
          />
        </div>

        <div className="border-t border-slate-200 bg-white p-4 shadow-lg">
          <button
            type="button"
            onClick={handleApply}
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-700 transition-colors focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
          >
            Show {pendingCount} {pendingCount === 1 ? 'result' : 'results'}
          </button>
        </div>
      </div>
    </div>
  );
}
