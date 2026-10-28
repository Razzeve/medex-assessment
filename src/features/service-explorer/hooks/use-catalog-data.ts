import { useQuery } from '@tanstack/react-query';
import { CatalogService, CatalogResponse } from '../services/catalog.service';

interface UseCatalogDataOptions {
  simulateError?: boolean;
}

export function useCatalogData({ simulateError = false }: UseCatalogDataOptions = {}) {
  return useQuery<CatalogResponse, Error>({
    queryKey: ['service-catalog', { simulateError }],
    queryFn: () => CatalogService.getCatalog(simulateError),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 15,
    retry: (failureCount) => {
      // Don't retry if user explicitly simulated an error
      if (simulateError) return false;
      return failureCount < 2;
    },
  });
}
