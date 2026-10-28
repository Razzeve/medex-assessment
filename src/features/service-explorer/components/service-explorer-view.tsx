'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Bug,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useCatalogData } from '../hooks/use-catalog-data';
import { useServiceFilters } from '../hooks/use-service-filters';
import { calculateFacetCounts, groupAndSortServices } from '../utils/facets';
import { FilterState } from '../types';
import { SearchBar } from './search-bar';
import { FilterSidebar } from './filter-sidebar';
import { SortAndView } from './sort-and-view';
import { ProviderGroupCard } from './provider-group-card';
import { ServiceExplorerSkeleton } from './service-explorer-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { MobileFilterDrawer } from './mobile-filter-drawer';

const PROVIDERS_PER_PAGE = 8;

export function ServiceExplorerView() {
  const {
    filters,
    setSearch,
    toggleType,
    setCategory,
    setSubCategory,
    toggleProvider,
    setLocation,
    setPriceRange,
    toggleTestAtHome,
    setSort,
    setView,
    setPage,
    resetFilters,
    updateUrl,
    hasActiveFilters,
  } = useServiceFilters();

  // On-demand API Failure simulation for assessment evaluation
  const [simulateError, setSimulateError] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [, startTransition] = useTransition();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCatalogData({ simulateError });

  // 1. Calculate live facet counts across all 2,853 visible services
  const facets = useMemo(() => {
    if (!data?.services) {
      return {
        types: { package: 0, lab_test: 0, wellness: 0, service: 0, insurance: 0 },
        categories: {},
        subCategories: {},
        providers: {},
        countries: {},
        cities: {},
        testAtHome: 0,
        totalVisibleMatches: 0,
      };
    }
    return calculateFacetCounts(data.services, filters);
  }, [data?.services, filters]);

  // 2. Group and sort services by provider
  const providerGroups = useMemo(() => {
    if (!data?.services) return [];
    return groupAndSortServices(data.services, filters);
  }, [data?.services, filters]);

  // 3. Paginate provider groups
  const totalProviderGroups = providerGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalProviderGroups / PROVIDERS_PER_PAGE));
  const currentPage = Math.min(filters.page, totalPages);

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * PROVIDERS_PER_PAGE;
    return providerGroups.slice(startIndex, startIndex + PROVIDERS_PER_PAGE);
  }, [providerGroups, currentPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    count += filters.types.length;
    if (filters.categoryId) count++;
    if (filters.subCategoryId) count++;
    count += filters.providerIds.length;
    if (filters.country) count++;
    if (filters.city) count++;
    if (filters.minPrice !== null || filters.maxPrice !== null) count++;
    if (filters.testAtHome) count++;
    return count;
  }, [filters]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Assessment Context Banner */}
      <div className="mb-6 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-teal-50/50 to-slate-50 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100/80 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
              <Sparkles className="h-3 w-3" />
              Task 1: Service Explorer &amp; Live Faceted Discovery
            </div>
            <p className="mt-1.5 text-xs text-slate-600 max-w-2xl">
              Target Story: &ldquo;I need a full-body check-up near Bangkok, under 5,000 THB, and I&apos;d like to compare a few hospitals side by side.&rdquo;
            </p>
          </div>

          {/* Test On-Demand API Error Toggle per Brief */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSimulateError(!simulateError);
                startTransition(() => {
                  refetch();
                });
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                simulateError
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bug className="h-3.5 w-3.5" />
              <span>{simulateError ? 'Turn Off Simulated Error' : 'Simulate API Failure'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={filters.search}
          onChange={setSearch}
          placeholder="Search by package name, test, provider, or category (e.g. Health Check, Riverside)..."
        />
      </div>

      {/* Loading Skeleton State */}
      {isLoading ? (
        <ServiceExplorerSkeleton />
      ) : isError ? (
        <ErrorState
          error={error}
          onRetry={() => refetch()}
          isRetrying={isFetching}
          isSimulatedError={simulateError}
          onResetSimulatedError={() => {
            setSimulateError(false);
            setTimeout(() => refetch(), 50);
          }}
        />
      ) : (
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:w-80 shrink-0">
            <div className="sticky top-20">
              <FilterSidebar
                categories={data?.categories || []}
                providers={data?.providers || []}
                filters={filters}
                facets={facets}
                onToggleType={toggleType}
                onSetCategory={setCategory}
                onSetSubCategory={setSubCategory}
                onToggleProvider={toggleProvider}
                onSetLocation={setLocation}
                onSetPriceRange={setPriceRange}
                onToggleTestAtHome={toggleTestAtHome}
                onResetFilters={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </div>

          {/* Results Column */}
          <main className="flex-1 space-y-6">
            {/* Sort & View Controls */}
            <SortAndView
              totalMatches={facets.totalVisibleMatches}
              providerCount={totalProviderGroups}
              sort={filters.sort}
              view={filters.view}
              onSortChange={setSort}
              onViewChange={setView}
              onOpenMobileFilters={() => setIsMobileDrawerOpen(true)}
              activeFilterCount={activeFilterCount}
            />

            {/* Results Content */}
            {totalProviderGroups === 0 ? (
              <EmptyState
                filters={filters}
                onResetFilters={resetFilters}
                onClearPriceFilter={() => setPriceRange(null, null)}
                onClearSearch={() => setSearch('')}
                onClearLocation={() => setLocation(null, null)}
              />
            ) : (
              <div className="space-y-6">
                {paginatedGroups.map((group) => (
                  <ProviderGroupCard
                    key={group.provider.id}
                    group={group}
                    viewMode={filters.view}
                  />
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <nav
                    aria-label="Provider catalog pagination"
                    className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 rounded-xl shadow-xs"
                  >
                    <div className="text-xs text-slate-500">
                      Showing{' '}
                      <span className="font-semibold text-slate-900">
                        {(currentPage - 1) * PROVIDERS_PER_PAGE + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-slate-900">
                        {Math.min(currentPage * PROVIDERS_PER_PAGE, totalProviderGroups)}
                      </span>{' '}
                      of{' '}
                      <span className="font-semibold text-slate-900">{totalProviderGroups}</span>{' '}
                      providers
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(currentPage - 1)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Prev</span>
                      </button>

                      <span className="px-2 text-xs font-medium text-slate-600">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage(currentPage + 1)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </nav>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* Mobile Filters Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        categories={data?.categories || []}
        providers={data?.providers || []}
        services={data?.services || []}
        currentFilters={filters}
        onApplyFilters={(applied) => updateUrl(applied)}
      />
    </div>
  );
}
