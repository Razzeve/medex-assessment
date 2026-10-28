import {
  Category,
  CategoryChild,
  Provider,
  RawService,
  EnrichedService,
} from '../types';
import { calculateServicePrice } from '../utils/pricing';

export interface CatalogResponse {
  categories: Category[];
  providers: Provider[];
  services: EnrichedService[];
}

export class CatalogService {
  private static async handleFetch<T>(url: string, simulateError?: boolean): Promise<T> {
    const fetchUrl = simulateError
      ? `${url}${url.includes('?') ? '&' : '?'}simulateError=true`
      : url;

    const res = await fetch(fetchUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        errorBody.error || `HTTP error ${res.status}: Failed to fetch from ${url}`
      );
    }

    return res.json();
  }

  static async getCategories(simulateError?: boolean): Promise<Category[]> {
    return this.handleFetch<Category[]>('/api/category/active', simulateError);
  }

  static async getProviders(simulateError?: boolean): Promise<Provider[]> {
    return this.handleFetch<Provider[]>('/api/providers', simulateError);
  }

  static async getServices(simulateError?: boolean): Promise<RawService[]> {
    return this.handleFetch<RawService[]>('/api/service', simulateError);
  }

  /**
   * Fetches all entities, checks business visibility rules, resolves relations,
   * and computes price models for every visible service.
   *
   * MedEx Visibility Rule:
   * A service is visible only if:
   * 1. service.status === true
   * 2. provider.status === "active"
   * 3. category (if present) has status: true
   */
  static async getCatalog(simulateError?: boolean): Promise<CatalogResponse> {
    const [categories, providers, rawServices] = await Promise.all([
      this.getCategories(simulateError),
      this.getProviders(simulateError),
      this.getServices(simulateError),
    ]);

    // Build lookups
    const providerMap = new Map<number, Provider>();
    for (const provider of providers) {
      providerMap.set(provider.id, provider);
    }

    const categoryMap = new Map<string, Category>();
    const subCategoryMap = new Map<string, CategoryChild>();
    for (const cat of categories) {
      categoryMap.set(cat.id, cat);
      if (cat.children && Array.isArray(cat.children)) {
        for (const child of cat.children) {
          subCategoryMap.set(child.id, child);
        }
      }
    }

    // Process and enrich services
    const enrichedServices: EnrichedService[] = [];

    for (const raw of rawServices) {
      // 1. Service own status
      if (raw.status !== true) {
        continue;
      }

      // 2. Provider must exist and be 'active'
      const provider = providerMap.get(raw.userId);
      if (!provider || provider.status !== 'active') {
        continue;
      }

      // 3. Category (if present) must have status === true
      let category: Category | undefined = undefined;
      if (raw.categoryId) {
        category = categoryMap.get(raw.categoryId);
        if (!category || category.status !== true) {
          continue;
        }
      }

      let subCategory: CategoryChild | undefined = undefined;
      if (raw.subCategoryId) {
        subCategory = subCategoryMap.get(raw.subCategoryId);
      }

      const calculatedPrice = calculateServicePrice(raw, provider.providerInformation.currency);

      enrichedServices.push({
        ...raw,
        provider,
        category,
        subCategory,
        calculatedPrice,
        isVisible: true,
      });
    }

    return {
      categories,
      providers,
      services: enrichedServices,
    };
  }
}
