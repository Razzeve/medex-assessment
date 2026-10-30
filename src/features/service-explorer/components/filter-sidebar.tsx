'use client';

import { useState, useMemo } from 'react';
import {
  Filter,
  RotateCcw,
  Search,
  Home,
} from 'lucide-react';
import {
  Category,
  CategoryChild,
  Provider,
  FilterState,
  FacetCounts,
  ServiceType,
  Currency,
} from '../types';

interface FilterSidebarProps {
  categories: Category[];
  providers: Provider[];
  filters: FilterState;
  facets: FacetCounts;
  onToggleType: (type: ServiceType) => void;
  onSetCategory: (categoryId: string | null) => void;
  onSetSubCategory: (subCategoryId: string | null) => void;
  onToggleProvider: (providerId: number) => void;
  onSetLocation: (country: string | null, city: string | null) => void;
  onSetPriceRange: (
    minPrice: number | null,
    maxPrice: number | null,
    currency?: Currency | 'ALL'
  ) => void;
  onToggleTestAtHome: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

const SERVICE_TYPE_CONFIG: { type: ServiceType; label: string }[] = [
  { type: 'package', label: 'Health Packages' },
  { type: 'lab_test', label: 'Lab Tests' },
  { type: 'wellness', label: 'Wellness Treatments' },
  { type: 'service', label: 'Clinical Services' },
  { type: 'insurance', label: 'Insurance' },
];

const COUNTRIES = [
  { name: 'Thailand', currency: 'THB' as Currency },
  { name: 'Nepal', currency: 'NPR' as Currency },
  { name: 'India', currency: 'INR' as Currency },
];

export function FilterSidebar({
  categories,
  providers,
  filters,
  facets,
  onToggleType,
  onSetCategory,
  onSetSubCategory,
  onToggleProvider,
  onSetLocation,
  onSetPriceRange,
  onToggleTestAtHome,
  onResetFilters,
  hasActiveFilters,
  className = 'sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pr-2 custom-scrollbar',
}: FilterSidebarProps) {
  // Provider search within sidebar
  const [providerSearch, setProviderSearch] = useState('');

  // Local price input state
  const [minPriceInput, setMinPriceInput] = useState(
    filters.minPrice !== null ? filters.minPrice.toString() : ''
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    filters.maxPrice !== null ? filters.maxPrice.toString() : ''
  );

  // Filtered providers for provider multi-select search
  const filteredProviders = useMemo(() => {
    if (!providerSearch.trim()) return providers;
    const term = providerSearch.toLowerCase().trim();
    return providers.filter((p) => p.name.toLowerCase().includes(term));
  }, [providers, providerSearch]);

  // Cities matching the selected country (or all cities if none selected)
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    for (const p of providers) {
      if (!filters.country || p.providerInformation.country.name === filters.country) {
        if (p.providerInformation.city?.name) {
          set.add(p.providerInformation.city.name);
        }
      }
    }
    return Array.from(set).sort();
  }, [providers, filters.country]);

  // Disambiguate duplicate category slugs (e.g. Ultrasound in package vs lab_test)
  const getCategoryDisplayTitle = (category: Category) => {
    const hasDuplicateSlug = categories.some(
      (c) => c.id !== category.id && c.slug === category.slug
    );
    if (hasDuplicateSlug) {
      const typeLabel =
        category.type === 'package'
          ? 'Package'
          : category.type === 'lab_test'
          ? 'Lab Test'
          : category.type;
      return `${category.title} (${typeLabel})`;
    }
    return category.title;
  };

  const applyPriceInputs = () => {
    const minVal = minPriceInput.trim() ? parseFloat(minPriceInput) : null;
    const maxVal = maxPriceInput.trim() ? parseFloat(maxPriceInput) : null;
    onSetPriceRange(
      minVal !== null && !isNaN(minVal) ? minVal : null,
      maxVal !== null && !isNaN(maxVal) ? maxVal : null
    );
  };

  const handleResetAll = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    setProviderSearch('');
    onResetFilters();
  };

  return (
    <aside
      aria-label="Service Catalog Filters"
      className={`flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-x-hidden ${className}`}
    >
      {/* Top Header with Prominent Reset All Filters */}
      <div className="sticky top-[-20px] z-20 -mx-5 -mt-5 bg-white px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Filter className="h-4 w-4 text-teal-600" />
          <span>Faceted Filters</span>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100 hover:text-teal-800 transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            title="Cleanses all search, location, currency, category, and price filters back to default"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset All Filters</span>
          </button>
        ) : (
          <span className="text-[11px] font-medium text-slate-400">All filters default</span>
        )}
      </div>

      {/* 1. Service Types (Multi-select) */}
      <section className="border-b border-slate-100 pb-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Service Type
        </h3>
        <div className="space-y-2">
          {SERVICE_TYPE_CONFIG.map(({ type, label }) => {
            const isChecked = filters.types.includes(type);
            const count = facets.types[type] || 0;
            const isDisabled = count === 0 && !isChecked;

            return (
              <label
                key={type}
                className={`flex items-center justify-between text-xs font-medium transition-colors ${
                  isDisabled
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer text-slate-700 hover:text-teal-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => onToggleType(type)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>{label}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    isChecked
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* 2. Category Hierarchy Tree */}
      <section className="border-b border-slate-100 pb-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Category
          </h3>
          {filters.categoryId && (
            <button
              type="button"
              onClick={() => onSetCategory(null)}
              className="text-[11px] font-medium text-teal-600 hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
          {categories
            .filter((c) => c.status === true)
            .map((cat) => {
              const isSelected = filters.categoryId === cat.id;
              const count = facets.categories[cat.id] || 0;
              const isDisabled = count === 0 && !isSelected;

              return (
                <div key={cat.id}>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSetCategory(isSelected ? null : cat.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-teal-50 text-teal-800 font-semibold ring-1 ring-teal-600/20'
                        : isDisabled
                        ? 'cursor-not-allowed opacity-40 text-slate-400'
                        : 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <span className="truncate pr-2">{getCategoryDisplayTitle(cat)}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[10px] ${
                        isSelected
                          ? 'bg-teal-100 text-teal-800 font-bold'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>

                  {/* Subcategories revealed when parent category is selected */}
                  {isSelected && cat.children && cat.children.length > 0 && (
                    <div className="ml-3 mt-1 space-y-1 border-l-2 border-teal-200 pl-2">
                      {cat.children.map((sub: CategoryChild) => {
                        const isSubSelected = filters.subCategoryId === sub.id;
                        const subCount = facets.subCategories[sub.id] || 0;
                        const isSubDisabled = subCount === 0 && !isSubSelected;

                        return (
                          <button
                            key={sub.id}
                            type="button"
                            disabled={isSubDisabled}
                            onClick={() =>
                              onSetSubCategory(isSubSelected ? null : sub.id)
                            }
                            className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-[11px] transition-colors ${
                              isSubSelected
                                ? 'bg-teal-600 text-white font-semibold shadow-xs'
                                : isSubDisabled
                                ? 'cursor-not-allowed opacity-40 text-slate-400'
                                : 'text-slate-600 hover:bg-slate-100 cursor-pointer'
                            }`}
                          >
                            <span className="truncate">{sub.title}</span>
                            <span
                              className={`rounded px-1 text-[9px] ${
                                isSubSelected
                                  ? 'bg-teal-700 text-white'
                                  : 'bg-slate-200/60 text-slate-600'
                              }`}
                            >
                              {subCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </section>

      {/* 3. Location (Country & City) */}
      <section className="border-b border-slate-100 pb-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Location
          </h3>
          {(filters.country || filters.city || (filters.currency !== 'ALL' && COUNTRIES.some(c => c.currency === filters.currency))) && (
            <button
              type="button"
              onClick={() => onSetLocation(null, null)}
              className="text-[11px] font-medium text-teal-600 hover:underline cursor-pointer"
            >
              Reset Location
            </button>
          )}
        </div>

        {/* Country Selector */}
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          {COUNTRIES.map((c) => {
            const isCountryActive =
              filters.country === c.name ||
              (!filters.country && filters.currency === c.currency);
            const countryCount = facets.countries[c.name] || 0;
            const isDisabled = countryCount === 0 && !isCountryActive;

            const disabledReason = isDisabled
              ? filters.currency !== 'ALL' && filters.currency !== c.currency
                ? `Filtered out by active currency (${filters.currency}). Reset or switch currency to view ${c.name}.`
                : filters.city
                ? `Filtered out by active city filter (${filters.city}).`
                : 'No services match active filters.'
              : undefined;

            return (
              <button
                key={c.name}
                type="button"
                disabled={isDisabled}
                title={disabledReason || (isCountryActive ? `Click to deselect ${c.name}` : `Filter by ${c.name}`)}
                onClick={() =>
                  onSetLocation(isCountryActive ? null : c.name, null)
                }
                className={`rounded-lg py-2 px-1 text-center text-xs font-medium transition-all ${
                  isCountryActive
                    ? 'bg-teal-600 text-white shadow-xs font-semibold ring-2 ring-teal-600/30'
                    : isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border border-slate-200'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 cursor-pointer'
                }`}
              >
                <div className="truncate font-semibold">{c.name}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    isCountryActive ? 'text-teal-100 font-semibold' : 'text-slate-400'
                  }`}
                >
                  ({countryCount})
                </div>
              </button>
            );
          })}
        </div>

        {/* Currency Mismatch Clarification Banner */}
        {filters.currency !== 'ALL' &&
          COUNTRIES.some(
            (c) => c.currency !== filters.currency && (facets.countries[c.name] || 0) === 0
          ) && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/90 p-2 text-[11px] text-amber-800 flex items-start gap-1.5">
              <span className="shrink-0 font-bold">ℹ</span>
              <span>
                Locations with (0) are hidden by the active currency filter ({filters.currency}).{' '}
                <button
                  type="button"
                  onClick={() => onSetLocation(null, null)}
                  className="font-semibold underline hover:text-amber-950 inline cursor-pointer"
                >
                  Clear to see all countries
                </button>
              </span>
            </div>
          )}

        {/* City Filter */}
        {availableCities.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-slate-500 mb-1">
              {filters.country ? `Cities in ${filters.country}:` : 'All Cities:'}
            </div>
            <div className="flex flex-wrap gap-1">
              {availableCities.map((city) => {
                const isCityActive = filters.city === city;
                const cityCount = facets.cities[city] || 0;
                const isDisabled = cityCount === 0 && !isCityActive;

                return (
                  <button
                    key={city}
                    type="button"
                    disabled={isDisabled}
                    onClick={() =>
                      onSetLocation(
                        filters.country,
                        isCityActive ? null : city
                      )
                    }
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      isCityActive
                        ? 'bg-teal-600 text-white shadow-xs font-semibold'
                        : isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <span>{city}</span>
                    <span
                      className={`ml-1 text-[10px] ${
                        isCityActive ? 'text-teal-100' : 'text-slate-400'
                      }`}
                    >
                      {cityCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 4. Price Range & Multi-Currency Architecture */}
      <section className="border-b border-slate-100 pb-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Price Range
          </h3>
          {(filters.minPrice !== null || filters.maxPrice !== null) && (
            <button
              type="button"
              onClick={() => {
                setMinPriceInput('');
                setMaxPriceInput('');
                onSetPriceRange(null, null);
              }}
              className="text-[11px] font-medium text-teal-600 hover:underline cursor-pointer"
            >
              Clear Price
            </button>
          )}
        </div>

        <p className="mb-3 text-[11px] text-slate-500">
          MedEx prevents silent currency conversions. Filter in provider&apos;s native currency:
        </p>

        {/* Currency Switcher */}
        <div className="mb-3 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
          {(['ALL', 'THB', 'NPR', 'INR'] as const).map((curr) => (
            <button
              key={curr}
              type="button"
              onClick={() =>
                onSetPriceRange(filters.minPrice, filters.maxPrice, curr)
              }
              className={`flex-1 rounded-md py-1 text-center transition-colors cursor-pointer ${
                filters.currency === curr
                  ? 'bg-white text-teal-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>

        {/* Min - Max Inputs */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[11px] font-semibold text-slate-400">
              Min
            </span>
            <input
              type="number"
              placeholder="0"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <span className="text-slate-400">-</span>

          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[11px] font-semibold text-slate-400">
              Max
            </span>
            <input
              type="number"
              placeholder="5000"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={applyPriceInputs}
          className="mt-2.5 w-full rounded-lg bg-teal-600 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 transition-colors cursor-pointer"
        >
          Apply Price Filter
        </button>

        {/* Quick story preset: "under 5,000 THB" */}
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => {
              setMinPriceInput('0');
              setMaxPriceInput('5000');
              onSetPriceRange(0, 5000, 'THB');
            }}
            className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
          >
            Story: Under 5,000 THB
          </button>
        </div>
      </section>

      {/* 5. Providers Searchable Multi-Select */}
      <section className="border-b border-slate-100 pb-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Provider / Hospital
          </h3>
          {filters.providerIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                for (const id of filters.providerIds) {
                  onToggleProvider(id);
                }
              }}
              className="text-[11px] font-medium text-teal-600 hover:underline cursor-pointer"
            >
              Clear ({filters.providerIds.length})
            </button>
          )}
        </div>

        {/* Inline Provider Search */}
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search hospitals..."
            value={providerSearch}
            onChange={(e) => setProviderSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
          {filteredProviders.map((p) => {
            const isChecked = filters.providerIds.includes(p.id);
            const count = facets.providers[p.id] || 0;
            const isDisabled = count === 0 && !isChecked;

            return (
              <label
                key={p.id}
                className={`flex items-center justify-between text-xs font-medium transition-colors ${
                  isDisabled
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer text-slate-700 hover:text-teal-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => onToggleProvider(p.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 shrink-0 cursor-pointer"
                  />
                  <span className="truncate">{p.name}</span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] shrink-0 ${
                    isChecked
                      ? 'bg-teal-50 text-teal-700 font-bold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* 6. Home Test Availability Toggle */}
      <section>
        <label className="flex cursor-pointer items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Available at Home
              </div>
              <div className="text-[10px] text-slate-500">
                Sample collection at doorstep
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {facets.testAtHome}
            </span>
            <input
              type="checkbox"
              checked={filters.testAtHome}
              onChange={onToggleTestAtHome}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
          </div>
        </label>
      </section>
    </aside>
  );
}
