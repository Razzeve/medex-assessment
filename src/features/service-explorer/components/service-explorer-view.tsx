'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { useCartStore } from '@/features/cart-checkout/store/use-cart-store';
import { useCatalogData } from '../hooks/use-catalog-data';
import { useServiceFilters } from '../hooks/use-service-filters';
import { calculateFacetCounts, groupAndSortServices } from '../utils/facets';
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

  // Cart store notification hook
  const toast = useCartStore((state) => state.toastNotification);
  const clearNotification = useCartStore((state) => state.clearNotification);

  // On-demand API Failure simulation: supports ?error=true query parameter or manual dev state
  const searchParams = useSearchParams();
  const querySimulateError = searchParams?.get('error') === 'true';
  const [manualSimulateError, setManualSimulateError] = useState(false);
  const simulateError = querySimulateError || manualSimulateError;

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCatalogData({ simulateError });

  const services = data?.services;

  // 1. Calculate live facet counts across visible services
  const facets = useMemo(() => {
    if (!services) {
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
    return calculateFacetCounts(services, filters);
  }, [services, filters]);

  // 2. Group and sort services by provider
  const providerGroups = useMemo(() => {
    if (!services) return [];
    return groupAndSortServices(services, filters);
  }, [services, filters]);

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
    if (filters.currency && filters.currency !== 'ALL') count++;
    if (filters.minPrice !== null || filters.maxPrice !== null) count++;
    if (filters.testAtHome) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-xl transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
            toast.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-slate-200 bg-white text-slate-800'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
            <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
            <Link
              href="/cart"
              className="ml-2 inline-flex items-center gap-1 rounded-md bg-teal-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-2xs whitespace-nowrap"
            >
              <span>View Cart</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <button
            type="button"
            onClick={clearNotification}
            className="rounded p-1 hover:bg-black/5 transition-colors cursor-pointer text-slate-500 hover:text-slate-700"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <PageHeader
        title="Service Explorer & Healthcare Catalog"
        description="Discover and schedule specialized healthcare services, lab tests, and doctor consultations with real-time filtering and live availability."
        actions={
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Availability</span>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <SearchBar
            value={filters.search}
            onChange={setSearch}
            placeholder="Search by package name, test, provider, or category (e.g. Health Check, Riverside)..."
          />
        </div>

        {isLoading ? (
          <ServiceExplorerSkeleton />
        ) : isError ? (
          <ErrorState
            error={error}
            onRetry={() => refetch()}
            isRetrying={isFetching}
            isSimulatedError={simulateError}
            onResetSimulatedError={() => {
              setManualSimulateError(false);
              setTimeout(() => refetch(), 50);
            }}
          />
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="hidden lg:block lg:w-80 shrink-0">
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
                className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pr-2 custom-scrollbar"
              />
            </div>

            <main className="flex-1 min-w-0 space-y-6">
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
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
    </div>
  );
}
