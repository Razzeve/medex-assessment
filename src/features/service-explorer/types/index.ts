export type Currency = 'THB' | 'NPR' | 'INR';

export type ServiceType = 'package' | 'lab_test' | 'wellness' | 'service' | 'insurance';

export type DiscountType = 'percent' | 'amount';

export type ServiceChargeType = 'percent' | 'amount';

export interface WellnessPricingOption {
  id: string;
  durationInMinutes: number;
  price: string;
  discount: string;
  discountType: DiscountType;
  serviceCharge: string;
  serviceChargeType: ServiceChargeType;
}

export interface CategoryChild {
  id: string;
  title: string;
  slug: string;
  type: ServiceType;
  position: number;
  status: boolean;
  parentId: string;
}

export interface Category {
  id: string;
  title: string;
  slug: string;
  type: ServiceType;
  position: number;
  status: boolean;
  parentId: string | null;
  children: CategoryChild[];
}

export interface ProviderCity {
  id: string;
  name: string;
  slug: string;
}

export interface ProviderCountry {
  id: number;
  name: string;
  alphaCode: string;
}

export interface ProviderInformation {
  companyName: string;
  slug: string;
  types: ServiceType[];
  currency: Currency;
  city: ProviderCity;
  country: ProviderCountry;
  rating: number | null;
  reviewCount: number | null;
}

export interface Provider {
  id: number;
  name: string;
  username: string;
  status: 'active' | 'inactive' | string;
  providerInformation: ProviderInformation;
}

export interface RawService {
  id: string;
  title: string;
  slug: string;
  type: ServiceType;
  userId: number; // Foreign key to Provider.id
  categoryId: string | null;
  subCategoryId: string | null;
  price: string | null;
  discount: string | null;
  discountType: DiscountType | null;
  serviceCharge: string | null;
  serviceChargeType: ServiceChargeType | null;
  status: boolean;
  testAtHome: boolean;
  homeTestCharge: string | null;
  wellnessPricing: WellnessPricingOption[];
  createdAt: string;
}

export interface CatalogRawData {
  _readme?: string;
  categories: Category[];
  providers: Provider[];
  services: RawService[];
}

export interface WellnessCalculatedOption {
  id: string;
  durationInMinutes: number;
  originalPrice: number;
  discountAmount: number;
  serviceChargeAmount: number;
  finalPrice: number;
}

export interface CalculatedPrice {
  isWellness: boolean;
  currency: Currency;
  originalPrice: number;
  discountAmount: number;
  serviceChargeAmount: number;
  finalPrice: number;
  wellnessOptions?: WellnessCalculatedOption[];
  minDuration?: number;
}

export interface EnrichedService extends RawService {
  provider: Provider;
  category?: Category;
  subCategory?: CategoryChild;
  calculatedPrice: CalculatedPrice;
  isVisible: boolean;
}

export interface ProviderGroup {
  provider: Provider;
  services: EnrichedService[];
  totalMatchingServices: number;
}

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating';
export type ViewMode = 'grid' | 'list';

export interface FilterState {
  search: string;
  types: ServiceType[];
  categoryId: string | null;
  subCategoryId: string | null;
  providerIds: number[];
  country: string | null;
  city: string | null;
  currency: Currency | 'ALL';
  minPrice: number | null;
  maxPrice: number | null;
  testAtHome: boolean;
  sort: SortOption;
  view: ViewMode;
  page: number;
}

export interface FacetCounts {
  types: Record<ServiceType, number>;
  categories: Record<string, number>;
  subCategories: Record<string, number>;
  providers: Record<number, number>;
  countries: Record<string, number>;
  cities: Record<string, number>;
  testAtHome: number;
  totalVisibleMatches: number;
}
