'use client';

import { SearchX, RotateCcw, DollarSign, MapPin, X } from 'lucide-react';
import { FilterState } from '../types';

interface EmptyStateProps {
  filters: FilterState;
  onResetFilters: () => void;
  onClearPriceFilter?: () => void;
  onClearSearch?: () => void;
  onClearLocation?: () => void;
}

export function EmptyState({
  filters,
  onResetFilters,
  onClearPriceFilter,
  onClearSearch,
  onClearLocation,
}: EmptyStateProps) {
  const hasPrice = filters.minPrice !== null || filters.maxPrice !== null;
  const hasSearch = Boolean(filters.search.trim());
  const hasLocation = Boolean(filters.city || filters.country);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12 shadow-xs">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
        <SearchX className="h-8 w-8" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
        No healthcare services matched your criteria
      </h3>

      <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
        {hasSearch && hasPrice
          ? `No services matching "${filters.search}" were found within your price threshold. Try loosening filters or broadening your location.`
          : hasSearch
          ? `We couldn't find any services matching "${filters.search}". Check for typos or try broader keywords.`
          : hasPrice
          ? 'The selected price range is too narrow for available services in this location.'
          : 'None of our active catalog services match all the filters you currently have selected.'}
      </p>

      {/* Suggested quick fixes per assessment requirements */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {hasPrice && onClearPriceFilter && (
          <button
            type="button"
            onClick={onClearPriceFilter}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <DollarSign className="h-3.5 w-3.5 text-teal-600" />
            <span>Remove price filter</span>
          </button>
        )}

        {hasSearch && onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-teal-600" />
            <span>Clear &ldquo;{filters.search}&rdquo; query</span>
          </button>
        )}

        {hasLocation && onClearLocation && (
          <button
            type="button"
            onClick={onClearLocation}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <MapPin className="h-3.5 w-3.5 text-teal-600" />
            <span>Expand to all regions</span>
          </button>
        )}

        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset all filters</span>
        </button>
      </div>
    </div>
  );
}
