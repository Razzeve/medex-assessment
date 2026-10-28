import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchesFilterCriteria,
  calculateFacetCounts,
  groupAndSortServices,
} from '../utils/facets';
import { EnrichedService, FilterState, Provider, Category } from '../types';

const mockProviderBangkok: Provider = {
  id: 48,
  name: 'Riverside International Hospital',
  username: 'riverside',
  status: 'active',
  providerInformation: {
    companyName: 'Riverside International Hospital',
    slug: 'riverside',
    types: ['package', 'lab_test'],
    currency: 'THB',
    city: { id: 'c1', name: 'Bangkok', slug: 'bangkok' },
    country: { id: 219, name: 'Thailand', alphaCode: 'TH' },
    rating: 4.7,
    reviewCount: 1200,
  },
};

const mockProviderKathmandu: Provider = {
  id: 52,
  name: 'Himalayan Medical Center',
  username: 'himalayan',
  status: 'active',
  providerInformation: {
    companyName: 'Himalayan Medical Center',
    slug: 'himalayan',
    types: ['package'],
    currency: 'NPR',
    city: { id: 'c2', name: 'Kathmandu', slug: 'kathmandu' },
    country: { id: 100, name: 'Nepal', alphaCode: 'NP' },
    rating: 4.5,
    reviewCount: 350,
  },
};

const mockCategoryUltrasoundPkg: Category = {
  id: 'cat-ultra-pkg',
  title: 'Ultrasound',
  slug: 'ultrasound',
  type: 'package',
  position: 1,
  status: true,
  parentId: null,
  children: [],
};

const mockCategoryUltrasoundLab: Category = {
  id: 'cat-ultra-lab',
  title: 'Ultrasound',
  slug: 'ultrasound', // Shared slug!
  type: 'lab_test',
  position: 2,
  status: true,
  parentId: null,
  children: [],
};

const mockServices: EnrichedService[] = [
  {
    id: 's1',
    title: 'Executive Health Check',
    slug: 'executive-health-check',
    type: 'package',
    userId: 48,
    categoryId: 'cat-ultra-pkg',
    subCategoryId: null,
    price: '4000.00',
    discount: '0.00',
    discountType: 'amount',
    serviceCharge: '0.00',
    serviceChargeType: 'amount',
    status: true,
    testAtHome: false,
    homeTestCharge: null,
    wellnessPricing: [],
    createdAt: '2025-01-01',
    provider: mockProviderBangkok,
    category: mockCategoryUltrasoundPkg,
    calculatedPrice: {
      isWellness: false,
      currency: 'THB',
      originalPrice: 4000,
      discountAmount: 0,
      serviceChargeAmount: 0,
      finalPrice: 4000,
    },
    isVisible: true,
  },
  {
    id: 's2',
    title: 'Liver Ultrasound Scan',
    slug: 'liver-ultrasound-scan',
    type: 'lab_test',
    userId: 48,
    categoryId: 'cat-ultra-lab',
    subCategoryId: null,
    price: '2500.00',
    discount: '0.00',
    discountType: 'amount',
    serviceCharge: '0.00',
    serviceChargeType: 'amount',
    status: true,
    testAtHome: true,
    homeTestCharge: '200.00',
    wellnessPricing: [],
    createdAt: '2025-01-01',
    provider: mockProviderBangkok,
    category: mockCategoryUltrasoundLab,
    calculatedPrice: {
      isWellness: false,
      currency: 'THB',
      originalPrice: 2500,
      discountAmount: 0,
      serviceChargeAmount: 0,
      finalPrice: 2500,
    },
    isVisible: true,
  },
  {
    id: 's3',
    title: 'Full Body Checkup Nepal',
    slug: 'full-body-checkup-nepal',
    type: 'package',
    userId: 52,
    categoryId: 'cat-ultra-pkg',
    subCategoryId: null,
    price: '3500.00',
    discount: '0.00',
    discountType: 'amount',
    serviceCharge: '0.00',
    serviceChargeType: 'amount',
    status: true,
    testAtHome: false,
    homeTestCharge: null,
    wellnessPricing: [],
    createdAt: '2025-01-01',
    provider: mockProviderKathmandu,
    category: mockCategoryUltrasoundPkg,
    calculatedPrice: {
      isWellness: false,
      currency: 'NPR',
      originalPrice: 3500,
      discountAmount: 0,
      serviceChargeAmount: 0,
      finalPrice: 3500,
    },
    isVisible: true,
  },
];

const baseFilters: FilterState = {
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

test('Facets - Disjunctive faceting with city filter', () => {
  // With Bangkok active, how many lab_test and package services are available?
  const filters: FilterState = { ...baseFilters, city: 'Bangkok' };
  const facets = calculateFacetCounts(mockServices, filters);

  assert.strictEqual(facets.types.package, 1);
  assert.strictEqual(facets.types.lab_test, 1);
  assert.strictEqual(facets.cities['Bangkok'], 2);
  assert.strictEqual(facets.countries['Thailand'], 2);
  assert.strictEqual(facets.countries['Nepal'] || 0, 0); // Disables Nepal when Bangkok is selected
});

test('Facets - Disambiguation of categories sharing the ultrasound slug', () => {
  // Filter by the lab_test Ultrasound category ID specifically
  const filters: FilterState = { ...baseFilters, categoryId: 'cat-ultra-lab' };
  const facets = calculateFacetCounts(mockServices, filters);

  assert.strictEqual(facets.totalVisibleMatches, 1);
  assert.strictEqual(facets.types.lab_test, 1);
  assert.strictEqual(facets.types.package, 0); // Only 1 service matches cat-ultra-lab
});

test('Facets - Multi-currency price isolation (never mix THB and NPR)', () => {
  // User filters Under 5000 in THB
  const filters: FilterState = {
    ...baseFilters,
    currency: 'THB',
    maxPrice: 5000,
  };
  const facets = calculateFacetCounts(mockServices, filters);

  // NPR service (s3: 3500 NPR) must NOT be counted under THB price filter
  assert.strictEqual(facets.totalVisibleMatches, 2);
});

test('Grouping - Services grouped by provider with correct active filter count', () => {
  const groups = groupAndSortServices(mockServices, baseFilters);

  assert.strictEqual(groups.length, 2);
  const riverside = groups.find((g) => g.provider.id === 48);
  assert.strictEqual(riverside?.totalMatchingServices, 2);
  assert.strictEqual(riverside?.services.length, 2);

  const himalayan = groups.find((g) => g.provider.id === 52);
  assert.strictEqual(himalayan?.totalMatchingServices, 1);
});
