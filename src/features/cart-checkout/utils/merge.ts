import {
  CartGroup,
  CartItem,
  CartProduct,
  GuestCartItem,
  GuestCartMergeChange,
  MergeCartResponse,
  ServerCartResponse,
  ServiceType,
} from "../types";
import { normalizeServerCart } from "./split-engine";

/**
 * Merges a guestCart into the logged-in user's serverCart against the provider catalog.
 * Follows the 4 specific edge case behaviors in Task 2 dataset:
 * 1. Overlapping product: Combines guest quantity with server quantity (2 + 3 = 5).
 * 2. New product: Adds item to the corresponding group using catalog metadata.
 * 3. Wellness duration resolution: Inherits guest's duration choice, pricing the unpriced server item.
 * 4. Stale/Discontinued product: Flags the missing item with a clear explanation without corrupting cart.
 */
export function mergeGuestCartIntoServerCart(
  serverCart: ServerCartResponse,
  guestCartItems: GuestCartItem[],
  catalog: CartProduct[]
): MergeCartResponse {
  const changes: GuestCartMergeChange[] = [];

  // Deep clone serverCart to avoid in-place mutation
  const clonedGroups: CartGroup[] = serverCart.groups.map((group) => ({
    ...group,
    subtotals: { ...group.subtotals },
    items: group.items.map((item) => ({
      ...item,
      product: { ...item.product },
    })),
  }));

  const catalogMap = new Map<string, CartProduct>();
  for (const item of catalog) {
    if (item.id) catalogMap.set(item.id, item);
  }

  for (const guestItem of guestCartItems) {
    // 1. Look for existing item in serverCart
    let existingItem: CartItem | null = null;
    let parentGroup: CartGroup | null = null;

    for (const group of clonedGroups) {
      const match = group.items.find((i) => i.productId === guestItem.productId);
      if (match) {
        existingItem = match;
        parentGroup = group;
        break;
      }
    }

    // 2. If existing item found in server cart
    if (existingItem && parentGroup) {
      const title = existingItem.product.title || "Selected Service";

      // If guest item has wellness duration selection and server item lacks it
      if (guestItem.wellnessPricingId) {
        const option = existingItem.product.wellnessPricing?.find(
          (o) => o.id === guestItem.wellnessPricingId
        );
        if (option) {
          existingItem.selectedWellnessPricingId = option.id;
          existingItem.selectedWellnessPricing = option;
          changes.push({
            type: "wellness_duration_selected",
            productId: guestItem.productId,
            title,
            description: `Configured ${option.durationInMinutes}-minute duration (${option.amount_after_service_charge} ${existingItem.product.currency}) from guest selection`,
          });

          // If the guest specified a higher quantity than in the cart, adopt it
          if (guestItem.quantity > (existingItem.quantity || 1)) {
            existingItem.quantity = guestItem.quantity;
          }
          continue;
        }
      }

      // Quantity merge for standard overlapping products
      const oldQty = existingItem.quantity || 1;
      const addedQty = guestItem.quantity || 1;
      const newQty = oldQty + addedQty;
      existingItem.quantity = newQty;

      changes.push({
        type: "quantity_updated",
        productId: guestItem.productId,
        title,
        description: `Merged ${addedQty} guest units into existing ${oldQty} units (new total: ${newQty})`,
      });
      continue;
    }

    // 3. Item not in server cart - check catalog
    const catalogProduct = catalogMap.get(guestItem.productId);
    if (!catalogProduct) {
      // Case 4: Item is discontinued or not found in catalog
      changes.push({
        type: "discontinued_item",
        productId: guestItem.productId,
        title: "Discontinued Service",
        description: `Product ID (${guestItem.productId.slice(0, 8)}...) is no longer active in the provider catalog and could not be merged`,
      });
      continue;
    }

    // Case 2: New valid item from catalog
    const serviceType: ServiceType = catalogProduct.type || "service";
    let targetGroup = clonedGroups.find((g) => g.type === serviceType);

    if (!targetGroup) {
      targetGroup = {
        type: serviceType,
        itemCount: 0,
        unpricedItems: 0,
        subtotals: {},
        items: [],
      };
      clonedGroups.push(targetGroup);
    }

    const newItem: CartItem = {
      id: `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: catalogProduct.id as string,
      quantity: guestItem.quantity || 1,
      product: { ...catalogProduct },
    };

    if (guestItem.wellnessPricingId && catalogProduct.wellnessPricing) {
      const option = catalogProduct.wellnessPricing.find((o) => o.id === guestItem.wellnessPricingId);
      if (option) {
        newItem.selectedWellnessPricingId = option.id;
        newItem.selectedWellnessPricing = option;
      }
    }

    targetGroup.items.push(newItem);

    changes.push({
      type: "item_added",
      productId: catalogProduct.id as string,
      title: catalogProduct.title || "New Service",
      description: `Added ${newItem.quantity}x ${catalogProduct.title} (${catalogProduct.currency} ${catalogProduct.price ?? "Duration-based"}) to cart`,
    });
  }

  // Recalculate group counts and subtotals across all groups
  const normalized = normalizeServerCart({
    groups: clonedGroups,
    totalItems: 0,
  });

  return {
    cart: normalized,
    changes,
  };
}
