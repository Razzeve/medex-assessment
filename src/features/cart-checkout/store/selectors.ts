import { useMemo } from "react";
import { useCartStore } from "./useCartStore";
import { createSplitPackage } from "../utils/split-engine";
import { SplitPackage } from "../types";
import { addMoney } from "../utils/currency";

export function useSplitPackages(): SplitPackage[] {
  const groups = useCartStore((state) => state.cart?.groups);
  return useMemo(() => {
    if (!groups) return [];
    return groups.map(createSplitPackage);
  }, [groups]);
}

export function useCartTotalCount(): number {
  return useCartStore((state) => state.cart?.totalItems ?? 0);
}

export function useCartSubtotals(): Record<string, number> {
  const groups = useCartStore((state) => state.cart?.groups);
  return useMemo(() => {
    const totals: Record<string, number> = {};
    if (!groups) return totals;
    for (const group of groups) {
      for (const [cur, amount] of Object.entries(group.subtotals)) {
        totals[cur] = addMoney(totals[cur] || 0, amount);
      }
    }
    return totals;
  }, [groups]);
}

export function useTotalDeliveryFees(): Record<string, number> {
  const packages = useSplitPackages();
  return useMemo(() => {
    const fees: Record<string, number> = {};
    for (const pkg of packages) {
      for (const [cur, fee] of Object.entries(pkg.deliveryFees)) {
        fees[cur] = addMoney(fees[cur] || 0, fee);
      }
    }
    return fees;
  }, [packages]);
}

export function useCartValidation(): {
  hasUnavailable: boolean;
  hasUnpriced: boolean;
  canCheckoutAny: boolean;
  canCheckoutAll: boolean;
} {
  const packages = useSplitPackages();
  return useMemo(() => {
    const hasUnavailable = packages.some((p) => p.hasUnavailableItems);
    const hasUnpriced = packages.some((p) => p.hasUnpricedItems);
    const eligiblePackages = packages.filter((p) => p.eligibleForCheckout);

    return {
      hasUnavailable,
      hasUnpriced,
      canCheckoutAny: eligiblePackages.length > 0,
      canCheckoutAll: eligiblePackages.length > 0 && !hasUnavailable && !hasUnpriced,
    };
  }, [packages]);
}
