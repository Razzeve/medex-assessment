import {
  CartGroup,
  CartItem,
  Currency,
  FulfillmentType,
  ServerCartResponse,
  ServiceType,
  SplitPackage,
} from "../types";
import { addMoney } from "./currency";

/**
 * Standard fulfillment fee configuration per service category and currency.
 */
export const FULFILLMENT_CONFIG: Record<
  ServiceType,
  {
    fulfillmentType: FulfillmentType;
    badgeLabel: string;
    timeline: string;
    fees: Partial<Record<Currency, number>>;
    freeThreshold?: Partial<Record<Currency, number>>;
  }
> = {
  lab_test: {
    fulfillmentType: "lab_sample_collection",
    badgeLabel: "Home Lab Collection",
    timeline: "Phlebotomist Home Dispatch (Next Morning 07:00 - 11:00 AM)",
    fees: { THB: 120, NPR: 250, INR: 150 },
    freeThreshold: { THB: 3000, NPR: 10000, INR: 2000 },
  },
  wellness: {
    fulfillmentType: "wellness_appointment",
    badgeLabel: "Spa & Wellness Appointment",
    timeline: "Instant Spa Facility Slot Confirmation",
    fees: { THB: 0, NPR: 0, INR: 0 },
  },
  package: {
    fulfillmentType: "clinic_visit",
    badgeLabel: "Hospital / Clinic Health Check",
    timeline: "Priority Clinic Arrival Pass & Pre-Assessment Slot",
    fees: { THB: 0, NPR: 0, INR: 0 },
  },
  service: {
    fulfillmentType: "direct_service",
    badgeLabel: "Clinical Consultation & Vaccine",
    timeline: "Immediate Clinic Check-in Schedule",
    fees: { THB: 0, NPR: 0, INR: 0 },
  },
  insurance: {
    fulfillmentType: "digital_telehealth",
    badgeLabel: "Digital Health Cover",
    timeline: "Instant Policy Dispatch to Patient Email",
    fees: { THB: 0, NPR: 0, INR: 0 },
  },
  unknown: {
    fulfillmentType: "direct_service",
    badgeLabel: "Unavailable / Legacy Service",
    timeline: "Provider Service Suspended",
    fees: { THB: 0, NPR: 0, INR: 0 },
  },
};

/**
 * Check if a cart item has an empty or missing product definition (provider removed service).
 */
export function isItemUnavailable(item: CartItem): boolean {
  if (!item || !item.product) return true;
  const { product } = item;
  return !product.title || Object.keys(product).length <= 1;
}

/**
 * Check if a cart item requires wellness duration selection.
 */
export function isItemWellnessUnpriced(item: CartItem): boolean {
  if (isItemUnavailable(item)) return false;
  const isWellness = item.product.type === "wellness";
  if (!isWellness) return false;

  // If a duration has already been chosen and attached
  if (item.selectedWellnessPricingId || item.selectedWellnessPricing) {
    return false;
  }

  // If base price is null or priceUnknown is true
  return item.product.price === null || item.product.priceUnknown === true;
}

/**
 * Resolve the effective unit price of an item.
 * Returns null if the price is unknown (e.g. unselected wellness or unavailable).
 */
export function getItemUnitPrice(item: CartItem): number | null {
  if (isItemUnavailable(item)) return null;

  if (item.selectedWellnessPricing) {
    return item.selectedWellnessPricing.amount_after_service_charge;
  }

  if (item.selectedWellnessPricingId && item.product.wellnessPricing) {
    const option = item.product.wellnessPricing.find((o) => o.id === item.selectedWellnessPricingId);
    if (option) return option.amount_after_service_charge;
  }

  if (item.product.price !== null && item.product.price !== undefined && !isNaN(item.product.price)) {
    return item.product.price;
  }

  return null;
}

/**
 * Recalculate subtotals and counts for a group of cart items.
 * Currency amounts are never cross-converted or summed together.
 */
export function calculateGroupMetrics(items: CartItem[]): {
  itemCount: number;
  unpricedItems: number;
  subtotals: Record<string, number>;
} {
  let itemCount = 0;
  let unpricedItems = 0;
  const subtotals: Record<string, number> = {};

  for (const item of items) {
    itemCount += item.quantity || 1;
    const unitPrice = getItemUnitPrice(item);

    if (unitPrice === null) {
      unpricedItems += 1;
      continue;
    }

    const currency = item.product.currency || "THB";
    const lineTotal = unitPrice * (item.quantity || 1);
    subtotals[currency] = addMoney(subtotals[currency] || 0, lineTotal);
  }

  return { itemCount, unpricedItems, subtotals };
}

/**
 * Calculate discrete delivery and fulfillment fees for a group based on its currency subtotals.
 */
export function calculateDeliveryFees(
  type: ServiceType,
  subtotals: Record<string, number>
): Record<string, number> {
  const config = FULFILLMENT_CONFIG[type] || FULFILLMENT_CONFIG.unknown;
  const fees: Record<string, number> = {};

  for (const [currency, subtotal] of Object.entries(subtotals)) {
    const cur = currency as Currency;
    const standardFee = config.fees[cur] ?? 0;
    const threshold = config.freeThreshold?.[cur];

    if (standardFee === 0) {
      fees[currency] = 0;
    } else if (threshold !== undefined && subtotal >= threshold) {
      fees[currency] = 0; // Free delivery threshold reached!
    } else {
      fees[currency] = standardFee;
    }
  }

  return fees;
}

/**
 * Partitions a CartGroup into a structured SplitPackage for UI rendering and checkout routing.
 */
export function createSplitPackage(group: CartGroup): SplitPackage {
  const config = FULFILLMENT_CONFIG[group.type] || FULFILLMENT_CONFIG.unknown;
  const { itemCount, unpricedItems, subtotals } = calculateGroupMetrics(group.items);

  const deliveryFees = calculateDeliveryFees(group.type, subtotals);
  const totalAmounts: Record<string, number> = {};

  for (const [currency, subtotal] of Object.entries(subtotals)) {
    const fee = deliveryFees[currency] || 0;
    totalAmounts[currency] = addMoney(subtotal, fee);
  }

  const hasUnavailableItems = group.items.some(isItemUnavailable);
  const hasUnpricedItems = unpricedItems > 0;

  const blockingReasons: string[] = [];
  if (hasUnavailableItems) {
    blockingReasons.push("Contains discontinued items that must be removed");
  }
  if (hasUnpricedItems) {
    blockingReasons.push("Requires duration selection for wellness services");
  }
  if (group.type === "unknown") {
    blockingReasons.push("Unsupported package category");
  }
  if (group.items.length === 0) {
    blockingReasons.push("No items in package");
  }

  const eligibleForCheckout = blockingReasons.length === 0 && itemCount > 0;

  // Extract primary provider name if uniform, else general title
  const providerNames = Array.from(
    new Set(group.items.map((i) => i.product.providerName).filter(Boolean))
  );
  const providerName =
    providerNames.length === 1
      ? (providerNames[0] as string)
      : providerNames.length > 1
      ? `${providerNames[0]} + ${providerNames.length - 1} other`
      : "MedEx Partner Clinic";

  return {
    id: `package-${group.type}`,
    groupType: group.type,
    fulfillmentType: config.fulfillmentType,
    providerName,
    title: config.badgeLabel,
    badgeLabel: config.badgeLabel,
    estimatedTimeline: config.timeline,
    items: group.items,
    subtotals,
    deliveryFees,
    totalAmounts,
    hasUnpricedItems,
    hasUnavailableItems,
    eligibleForCheckout,
    blockingReasons,
  };
}

/**
 * Re-evaluate an entire ServerCartResponse, recomputing group metrics and total item count.
 */
export function normalizeServerCart(cart: ServerCartResponse): ServerCartResponse {
  let totalItems = 0;
  const updatedGroups = cart.groups.map((group) => {
    const { itemCount, unpricedItems, subtotals } = calculateGroupMetrics(group.items);
    totalItems += itemCount;
    return {
      ...group,
      itemCount,
      unpricedItems,
      subtotals,
    };
  });

  return {
    groups: updatedGroups,
    totalItems,
  };
}
