'use client';

import { LayoutGrid, List, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { SortOption, ViewMode } from '../types';

interface SortAndViewProps {
  totalMatches: number;
  providerCount: number;
  sort: SortOption;
  view: ViewMode;
  onSortChange: (sort: SortOption) => void;
  onViewChange: (view: ViewMode) => void;
  onOpenMobileFilters?: () => void;
  activeFilterCount?: number;
}

export function SortAndView({
  totalMatches,
  providerCount,
  sort,
  view,
  onSortChange,
  onViewChange,
  onOpenMobileFilters,
  activeFilterCount = 0,
}: SortAndViewProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      {/* Results Count & Live Announcement */}
      <div className="flex items-center justify-between sm:justify-start">
        <div aria-live="polite" className="text-sm font-medium text-slate-700">
          <span className="font-bold text-slate-900">{totalMatches}</span>{' '}
          {totalMatches === 1 ? 'service' : 'services'} available across{' '}
          <span className="font-bold text-slate-900">{providerCount}</span>{' '}
          {providerCount === 1 ? 'provider' : 'providers'}
        </div>

        {/* Mobile Filter Button (Visible on screens < lg) */}
        {onOpenMobileFilters && (
          <button
            type="button"
            onClick={onOpenMobileFilters}
            aria-label="Open filter drawer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-teal-600" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-teal-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Sort Options and View Switcher */}
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <label htmlFor="service-sort-select" className="text-xs font-medium text-slate-500 sr-only sm:not-sr-only">
            Sort:
          </label>
          <select
            id="service-sort-select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-8 text-xs font-medium text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Provider Rating</option>
          </select>
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            aria-label="Grid layout"
            aria-pressed={view === 'grid'}
            className={`rounded-md p-1.5 transition-colors ${
              view === 'grid'
                ? 'bg-white text-teal-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange('list')}
            aria-label="List layout"
            aria-pressed={view === 'list'}
            className={`rounded-md p-1.5 transition-colors ${
              view === 'list'
                ? 'bg-white text-teal-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
