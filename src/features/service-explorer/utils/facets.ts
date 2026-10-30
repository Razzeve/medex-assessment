import {
  EnrichedService,
  FilterState,
  FacetCounts,
  ProviderGroup,
} from '../types';

/**
 * Checks whether an enriched service matches active filter criteria,
 * optionally skipping one dimension for faceted counts calculation.
 */
export function matchesFilterCriteria(
  service: EnrichedService,
  filters: FilterState,
  skipDimension?: keyof FilterState
): boolean {
  // 1. Free-text search (matches title, provider name, category title, subcategory title)
  if (skipDimension !== 'search' && filters.search.trim()) {
    const term = filters.search.toLowerCase().trim();
    const titleMatch = service.title.toLowerCase().includes(term);
    const providerMatch =
      service.provider.name.toLowerCase().includes(term) ||
      service.provider.providerInformation.companyName.toLowerCase().includes(term);
    const categoryMatch = service.category?.title.toLowerCase().includes(term);
    const subCategoryMatch = service.subCategory?.title.toLowerCase().includes(term);

    if (!titleMatch && !providerMatch && !categoryMatch && !subCategoryMatch) {
      return false;
    }
  }

  // 2. Service Type (multi-select)
  if (skipDimension !== 'types' && filters.types.length > 0) {
    if (!filters.types.includes(service.type)) {
      return false;
    }
  }

  // 3. Category ID (tree top-level)
  if (skipDimension !== 'categoryId' && filters.categoryId) {
    if (service.categoryId !== filters.categoryId) {
      return false;
    }
  }

  // 4. SubCategory ID (tree leaf level)
  if (skipDimension !== 'subCategoryId' && filters.subCategoryId) {
    if (service.subCategoryId !== filters.subCategoryId) {
      return false;
    }
  }

  // 5. Provider IDs (multi-select)
  if (skipDimension !== 'providerIds' && filters.providerIds.length > 0) {
    if (!filters.providerIds.includes(service.userId)) {
      return false;
    }
  }

  // 6. Country
  if (skipDimension !== 'country' && filters.country) {
    if (service.provider.providerInformation.country.name !== filters.country) {
      return false;
    }
  }

  // 7. City
  if (skipDimension !== 'city' && filters.city) {
    if (service.provider.providerInformation.city.name !== filters.city) {
      return false;
    }
  }

  // 8. Currency & Price Range
  const serviceCurrency = service.calculatedPrice.currency;
  const price = service.calculatedPrice.finalPrice;

  if (skipDimension !== 'minPrice' && skipDimension !== 'maxPrice') {
    // If a currency is explicitly selected, only show services matching that currency
    if (filters.currency !== 'ALL' && serviceCurrency !== filters.currency) {
      return false;
    }

    if (filters.minPrice !== null && price < filters.minPrice) {
      return false;
    }

    if (filters.maxPrice !== null && price > filters.maxPrice) {
      return false;
    }
  }

  // 9. Home Test Availability
  if (skipDimension !== 'testAtHome' && filters.testAtHome) {
    if (!service.testAtHome) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates live facet counts for all filter dimensions using disjunctive faceted search.
 * This guarantees counts show how many results would be obtained if that filter option were chosen.
 */
export function calculateFacetCounts(
  allServices: EnrichedService[],
  filters: FilterState
): FacetCounts {
  const counts: FacetCounts = {
    types: {
      package: 0,
      lab_test: 0,
      wellness: 0,
      service: 0,
      insurance: 0,
    },
    categories: {},
    subCategories: {},
    providers: {},
    countries: {},
    cities: {},
    testAtHome: 0,
    totalVisibleMatches: 0,
  };

  for (const s of allServices) {
    // Check if service matches when types filter is omitted
    if (matchesFilterCriteria(s, filters, 'types')) {
      if (counts.types[s.type] !== undefined) {
        counts.types[s.type]++;
      }
    }

    // Check if service matches when category filter is omitted
    if (matchesFilterCriteria(s, filters, 'categoryId')) {
      if (s.categoryId) {
        counts.categories[s.categoryId] = (counts.categories[s.categoryId] || 0) + 1;
      }
    }

    // Check if service matches when subCategory filter is omitted
    if (matchesFilterCriteria(s, filters, 'subCategoryId')) {
      if (s.subCategoryId) {
        counts.subCategories[s.subCategoryId] =
          (counts.subCategories[s.subCategoryId] || 0) + 1;
      }
    }

    // Check if service matches when providerIds filter is omitted
    if (matchesFilterCriteria(s, filters, 'providerIds')) {
      counts.providers[s.userId] = (counts.providers[s.userId] || 0) + 1;
    }

    // Check if service matches when country filter is omitted
    if (matchesFilterCriteria(s, filters, 'country')) {
      const countryName = s.provider.providerInformation.country.name;
      counts.countries[countryName] = (counts.countries[countryName] || 0) + 1;
    }

    // Check if service matches when city filter is omitted
    if (matchesFilterCriteria(s, filters, 'city')) {
      const cityName = s.provider.providerInformation.city.name;
      counts.cities[cityName] = (counts.cities[cityName] || 0) + 1;
    }

    // Check if service matches all filters including testAtHome
    if (matchesFilterCriteria(s, filters, 'testAtHome')) {
      if (s.testAtHome) {
        counts.testAtHome++;
      }
    }

    // Overall match check
    if (matchesFilterCriteria(s, filters)) {
      counts.totalVisibleMatches++;
    }
  }

  return counts;
}

/**
 * Calculates search and quality relevance score for a service.
 */
export function calculateRelevanceScore(service: EnrichedService, searchTerm: string): number {
  let score = 0;
  const term = searchTerm.toLowerCase().trim();

  if (term) {
    const title = service.title.toLowerCase();
    const providerName = service.provider.name.toLowerCase();
    const catTitle = service.category?.title.toLowerCase() || '';

    if (title === term) {
      score += 150;
    } else if (title.startsWith(term)) {
      score += 90;
    } else if (title.includes(term)) {
      score += 40;
    }

    if (providerName.includes(term)) {
      score += 25;
    }

    if (catTitle.includes(term)) {
      score += 20;
    }
  }

  // Weight by provider reputation
  const rating = service.provider.providerInformation.rating || 3.0;
  const reviewCount = service.provider.providerInformation.reviewCount || 0;
  score += rating * 4;
  score += Math.log10(reviewCount + 1) * 3;

  return score;
}

/**
 * Groups and sorts matching services by provider according to MedEx specs:
 * "Results grouped by provider. Each provider card shows the provider and its rating,
 * with a sensible state when there is no rating yet. It shows at most 3 of that provider's
 * matching services, plus a clear way to see the rest. That count must reflect the active filters."
 */
export function groupAndSortServices(
  services: EnrichedService[],
  filters: FilterState
): ProviderGroup[] {
  // 1. Filter services
  const matching = services.filter((s) => matchesFilterCriteria(s, filters));

  // 2. Group by provider ID
  const map = new Map<number, { provider: EnrichedService['provider']; services: EnrichedService[] }>();

  for (const item of matching) {
    const entry = map.get(item.userId);
    if (entry) {
      entry.services.push(item);
    } else {
      map.set(item.userId, {
        provider: item.provider,
        services: [item],
      });
    }
  }

  // 3. Sort services within each group
  const sortOption = filters.sort;
  for (const group of map.values()) {
    group.services.sort((a, b) => {
      switch (sortOption) {
        case 'price_asc':
          return a.calculatedPrice.finalPrice - b.calculatedPrice.finalPrice;
        case 'price_desc':
          return b.calculatedPrice.finalPrice - a.calculatedPrice.finalPrice;
        case 'rating':
          return (
            (b.provider.providerInformation.rating || 0) -
            (a.provider.providerInformation.rating || 0)
          );
        case 'relevance':
        default:
          return (
            calculateRelevanceScore(b, filters.search) -
            calculateRelevanceScore(a, filters.search)
          );
      }
    });
  }

  // 4. Convert to ProviderGroup list
  const groups: ProviderGroup[] = Array.from(map.values()).map((g) => ({
    provider: g.provider,
    services: g.services,
    totalMatchingServices: g.services.length,
  }));

  // 5. Sort provider groups
  groups.sort((a, b) => {
    switch (sortOption) {
      case 'rating': {
        const ratingA = a.provider.providerInformation.rating ?? -1;
        const ratingB = b.provider.providerInformation.rating ?? -1;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (
          (b.provider.providerInformation.reviewCount || 0) -
          (a.provider.providerInformation.reviewCount || 0)
        );
      }
      case 'price_asc': {
        const minPriceA = a.services[0]?.calculatedPrice.finalPrice ?? Infinity;
        const minPriceB = b.services[0]?.calculatedPrice.finalPrice ?? Infinity;
        return minPriceA - minPriceB;
      }
      case 'price_desc': {
        const maxPriceA = a.services[0]?.calculatedPrice.finalPrice ?? -Infinity;
        const maxPriceB = b.services[0]?.calculatedPrice.finalPrice ?? -Infinity;
        return maxPriceB - maxPriceA;
      }
      case 'relevance':
      default: {
        const topScoreA = a.services[0]
          ? calculateRelevanceScore(a.services[0], filters.search)
          : 0;
        const topScoreB = b.services[0]
          ? calculateRelevanceScore(b.services[0], filters.search)
          : 0;
        return topScoreB - topScoreA;
      }
    }
  });

  return groups;
}
