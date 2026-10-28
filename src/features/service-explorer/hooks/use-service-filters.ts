'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  Currency,
  FilterState,
  ServiceType,
  SortOption,
  ViewMode,
} from '../types';

export const DEFAULT_FILTER_STATE: FilterState = {
  search: '',
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
  sort: 'relevance',
  view: 'grid',
  page: 1,
};

export function useServiceFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 1. Parse current URL search params synchronously into FilterState
  const filters: FilterState = useMemo(() => {
    const q = searchParams.get('q') || '';
    const rawTypes = searchParams.get('type');
    const types = rawTypes
      ? (rawTypes.split(',').filter(Boolean) as ServiceType[])
      : [];
    const categoryId = searchParams.get('cat') || null;
    const subCategoryId = searchParams.get('subcat') || null;

    const rawProv = searchParams.get('prov');
    const providerIds = rawProv
      ? rawProv
          .split(',')
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id))
      : [];

    const country = searchParams.get('country') || null;
    const city = searchParams.get('city') || null;
    const currency = (searchParams.get('cur') as Currency | 'ALL') || 'ALL';

    const minPriceRaw = searchParams.get('min');
    const minPrice = minPriceRaw !== null && !isNaN(parseFloat(minPriceRaw)) ? parseFloat(minPriceRaw) : null;

    const maxPriceRaw = searchParams.get('max');
    const maxPrice = maxPriceRaw !== null && !isNaN(parseFloat(maxPriceRaw)) ? parseFloat(maxPriceRaw) : null;

    const testAtHome = searchParams.get('home') === 'true';

    const sort = (searchParams.get('sort') as SortOption) || 'relevance';
    const view = (searchParams.get('view') as ViewMode) || 'grid';

    const pageRaw = searchParams.get('page');
    const page = pageRaw ? Math.max(1, parseInt(pageRaw, 10) || 1) : 1;

    return {
      search: q,
      types,
      categoryId,
      subCategoryId,
      providerIds,
      country,
      city,
      currency,
      minPrice,
      maxPrice,
      testAtHome,
      sort,
      view,
      page,
    };
  }, [searchParams]);

  // 2. Helper to serialize FilterState into URLSearchParams string
  const updateUrl = useCallback(
    (newFilters: FilterState) => {
      const params = new URLSearchParams();

      if (newFilters.search.trim()) {
        params.set('q', newFilters.search.trim());
      }
      if (newFilters.types.length > 0) {
        params.set('type', newFilters.types.join(','));
      }
      if (newFilters.categoryId) {
        params.set('cat', newFilters.categoryId);
      }
      if (newFilters.subCategoryId) {
        params.set('subcat', newFilters.subCategoryId);
      }
      if (newFilters.providerIds.length > 0) {
        params.set('prov', newFilters.providerIds.join(','));
      }
      if (newFilters.country) {
        params.set('country', newFilters.country);
      }
      if (newFilters.city) {
        params.set('city', newFilters.city);
      }
      if (newFilters.currency && newFilters.currency !== 'ALL') {
        params.set('cur', newFilters.currency);
      }
      if (newFilters.minPrice !== null && !isNaN(newFilters.minPrice)) {
        params.set('min', newFilters.minPrice.toString());
      }
      if (newFilters.maxPrice !== null && !isNaN(newFilters.maxPrice)) {
        params.set('max', newFilters.maxPrice.toString());
      }
      if (newFilters.testAtHome) {
        params.set('home', 'true');
      }
      if (newFilters.sort !== 'relevance') {
        params.set('sort', newFilters.sort);
      }
      if (newFilters.view !== 'grid') {
        params.set('view', newFilters.view);
      }
      if (newFilters.page > 1) {
        params.set('page', newFilters.page.toString());
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [pathname, router]
  );

  // Filter mutation actions
  const setSearch = useCallback(
    (search: string) => {
      updateUrl({ ...filters, search, page: 1 });
    },
    [filters, updateUrl]
  );

  const toggleType = useCallback(
    (type: ServiceType) => {
      const exists = filters.types.includes(type);
      const nextTypes = exists
        ? filters.types.filter((t) => t !== type)
        : [...filters.types, type];
      updateUrl({ ...filters, types: nextTypes, page: 1 });
    },
    [filters, updateUrl]
  );

  const setCategory = useCallback(
    (categoryId: string | null) => {
      // If category is cleared or changed, reset subcategory
      updateUrl({
        ...filters,
        categoryId,
        subCategoryId: null,
        page: 1,
      });
    },
    [filters, updateUrl]
  );

  const setSubCategory = useCallback(
    (subCategoryId: string | null) => {
      updateUrl({ ...filters, subCategoryId, page: 1 });
    },
    [filters, updateUrl]
  );

  const toggleProvider = useCallback(
    (providerId: number) => {
      const exists = filters.providerIds.includes(providerId);
      const nextProv = exists
        ? filters.providerIds.filter((id) => id !== providerId)
        : [...filters.providerIds, providerId];
      updateUrl({ ...filters, providerIds: nextProv, page: 1 });
    },
    [filters, updateUrl]
  );

  const setLocation = useCallback(
    (country: string | null, city: string | null) => {
      // Auto-align currency when a country is selected to assist the user
      let nextCurrency = filters.currency;
      if (country === 'Thailand') nextCurrency = 'THB';
      else if (country === 'Nepal') nextCurrency = 'NPR';
      else if (country === 'India') nextCurrency = 'INR';

      updateUrl({
        ...filters,
        country,
        city,
        currency: nextCurrency,
        page: 1,
      });
    },
    [filters, updateUrl]
  );

  const setPriceRange = useCallback(
    (minPrice: number | null, maxPrice: number | null, currency?: Currency | 'ALL') => {
      updateUrl({
        ...filters,
        minPrice,
        maxPrice,
        currency: currency !== undefined ? currency : filters.currency,
        page: 1,
      });
    },
    [filters, updateUrl]
  );

  const toggleTestAtHome = useCallback(() => {
    updateUrl({ ...filters, testAtHome: !filters.testAtHome, page: 1 });
  }, [filters, updateUrl]);

  const setSort = useCallback(
    (sort: SortOption) => {
      updateUrl({ ...filters, sort, page: 1 });
    },
    [filters, updateUrl]
  );

  const setView = useCallback(
    (view: ViewMode) => {
      updateUrl({ ...filters, view });
    },
    [filters, updateUrl]
  );

  const setPage = useCallback(
    (page: number) => {
      updateUrl({ ...filters, page });
    },
    [filters, updateUrl]
  );

  const resetFilters = useCallback(() => {
    updateUrl({
      ...DEFAULT_FILTER_STATE,
      view: filters.view, // retain user view preference
    });
  }, [filters.view, updateUrl]);

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(filters.search.trim()) ||
      filters.types.length > 0 ||
      Boolean(filters.categoryId) ||
      Boolean(filters.subCategoryId) ||
      filters.providerIds.length > 0 ||
      Boolean(filters.country) ||
      Boolean(filters.city) ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.testAtHome
    );
  }, [filters]);

  return {
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
  };
}
