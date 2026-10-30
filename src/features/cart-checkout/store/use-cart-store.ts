import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AddCartItemPayload,
  CartItem,
  CheckoutOrder,
  CouponDiscount,
  DevSimulationSettings,
  GuestCartItem,
  GuestCartMergeChange,
  PaymentMethod,
  PatientDetails,
  ServerCartResponse,
  ServiceType,
  SplitPackage,
} from "../types";
import { ApiOptions, CartApiService } from "../services/cart.service";
import { normalizeServerCart } from "../utils/split-engine";
import { calculateDiscount } from "../utils/coupons";

interface CheckoutSessionState {
  isCheckingOut: boolean;
  checkoutErrors: Record<string, string>; // groupType -> error message
  idempotencyKeys: Record<string, string>; // groupType -> idempotencyKey
  completedOrderIds: string[]; // list of completed orderIds
}

interface CartStoreState {
  // Data State
  cart: ServerCartResponse | null;
  guestCart: GuestCartItem[];
  isLoading: boolean;
  error: string | null;
  lastChanges: GuestCartMergeChange[] | null;

  // Coupon State
  appliedCoupon: CouponDiscount | null;

  // Order & Checkout State (Reload Safe)
  orders: Record<string, CheckoutOrder>; // orderId -> CheckoutOrder
  checkoutSession: CheckoutSessionState;

  // Optimistic tracking & concurrency safety
  pendingLineUpdates: Record<string, number>; // lineId -> sequence
  confirmedQuantities: Record<string, number>; // lineId -> last known server quantity
  toastNotification: { id: string; message: string; type: "success" | "error" | "info" } | null;

  // Dev simulation settings
  devSettings: DevSimulationSettings;

  // Actions
  fetchCart: (forceReset?: boolean) => Promise<void>;
  addItem: (payload: AddCartItemPayload) => Promise<void>;
  updateQuantity: (lineId: string, targetQuantity: number) => Promise<void>;
  updateWellnessDuration: (lineId: string, wellnessPricingId: string) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  applyCoupon: (coupon: CouponDiscount) => void;
  removeCoupon: () => void;
  clearNotification: () => void;
  setDevSettings: (settings: Partial<DevSimulationSettings>) => void;
  resetAll: () => Promise<void>;

  // Checkout Actions
  checkoutGroup: (
    pkg: SplitPackage,
    paymentMethod: PaymentMethod,
    patientDetails: PatientDetails,
    customIdempotencyKey?: string
  ) => Promise<CheckoutOrder>;
  checkoutAll: (
    packages: SplitPackage[],
    paymentMethod: PaymentMethod,
    patientDetails: PatientDetails
  ) => Promise<{ succeeded: CheckoutOrder[]; failed: { groupType: ServiceType; error: string }[] }>;
  retryFailedGroupCheckout: (
    pkg: SplitPackage,
    paymentMethod: PaymentMethod,
    patientDetails: PatientDetails
  ) => Promise<CheckoutOrder>;
  clearCompletedOrder: (orderId: string) => void;
}

const DEFAULT_DEV_SETTINGS: DevSimulationSettings = {
  latencyMs: 150,
  failNextCheckout: false,
  failPartialSecondGroup: false,
  failNextQuantity: false,
  failNextMerge: false,
  simulateOffline: false,
};

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      cart: null,
      guestCart: [],
      isLoading: false,
      error: null,
      lastChanges: null,
      appliedCoupon: null,
      orders: {},
      checkoutSession: {
        isCheckingOut: false,
        checkoutErrors: {},
        idempotencyKeys: {},
        completedOrderIds: [],
      },
      pendingLineUpdates: {},
      confirmedQuantities: {},
      toastNotification: null,
      devSettings: DEFAULT_DEV_SETTINGS,

      fetchCart: async (forceReset = false) => {
        set({ isLoading: true, error: null });
        try {
          const { devSettings } = get();
          if (devSettings.simulateOffline) {
            throw new Error("Device is offline. Check your network connection.");
          }

          const data = await CartApiService.getCart({
            reset: forceReset,
            latency: devSettings.latencyMs,
          });

          // Seed confirmed quantities map
          const confirmed: Record<string, number> = {};
          for (const group of data.cart.groups) {
            for (const item of group.items) {
              confirmed[item.id] = item.quantity;
            }
          }

          set({
            cart: data.cart,
            guestCart: data.guestCart || [],
            confirmedQuantities: confirmed,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to load cart";
          set({
            isLoading: false,
            error: message,
          });
        }
      },

      addItem: async (payload: AddCartItemPayload) => {
        let { cart } = get();

        // If cart is not yet loaded into store, fetch or initialize it
        if (!cart) {
          try {
            const data = await CartApiService.getCart({ latency: 0 });
            cart = data.cart;
          } catch {
            cart = { groups: [], totalItems: 0 };
          }
        }

        const groupType: ServiceType = payload.type || "service";
        const quantityToAdd = payload.quantity && payload.quantity > 0 ? payload.quantity : 1;

        // Clone current groups deeply enough to mutate safely
        const groups = cart.groups.map((g) => ({
          ...g,
          items: [...g.items],
        }));

        let targetGroup = groups.find((g) => g.type === groupType);

        if (!targetGroup) {
          targetGroup = {
            type: groupType,
            itemCount: 0,
            unpricedItems: 0,
            subtotals: {},
            items: [],
          };
          groups.push(targetGroup);
        }

        // Check if item already exists in the group
        const existingItemIndex = targetGroup.items.findIndex(
          (item) =>
            item.productId === String(payload.serviceId) &&
            (!payload.selectedWellnessPricingId ||
              item.selectedWellnessPricingId === payload.selectedWellnessPricingId)
        );

        let finalLineId: string;

        if (existingItemIndex >= 0) {
          const existingItem = targetGroup.items[existingItemIndex];
          const newQty = existingItem.quantity + quantityToAdd;
          targetGroup.items[existingItemIndex] = {
            ...existingItem,
            quantity: newQty,
          };
          finalLineId = existingItem.id;
        } else {
          finalLineId = `line_${payload.serviceId}_${Date.now()}`;
          const newItem: CartItem = {
            id: finalLineId,
            productId: String(payload.serviceId),
            quantity: quantityToAdd,
            product: {
              id: String(payload.serviceId),
              title: payload.title,
              type: groupType,
              currency: payload.currency,
              providerId: payload.providerId,
              providerName: payload.providerName,
              price: payload.price,
              wellnessPricing: payload.wellnessPricing,
              imageUrl: payload.imageUrl,
              description: payload.categoryTitle,
            },
            selectedWellnessPricingId: payload.selectedWellnessPricingId,
            selectedWellnessPricing: payload.selectedWellnessPricing,
          };
          targetGroup.items.push(newItem);
        }

        const normalized = normalizeServerCart({
          groups,
          totalItems: 0,
        });

        set((state) => ({
          cart: normalized,
          confirmedQuantities: {
            ...state.confirmedQuantities,
            [finalLineId]:
              (state.confirmedQuantities[finalLineId] || 0) + quantityToAdd,
          },
          toastNotification: {
            id: `add-${Date.now()}`,
            message: `"${payload.title}" added to your cart!`,
            type: "success",
          },
        }));

        // Background server sync
        try {
          const { devSettings } = get();
          if (!devSettings.simulateOffline) {
            await CartApiService.addItem(payload, { latency: devSettings.latencyMs });
          }
        } catch {
          // Background cart sync failed; client store updated optimistically
        }
      },

      updateQuantity: async (lineId: string, targetQuantity: number) => {
        const { cart, confirmedQuantities, devSettings, pendingLineUpdates } = get();
        if (!cart) return;

        // If target quantity is 0 or less, cleanly remove item
        if (targetQuantity <= 0) {
          await get().removeItem(lineId);
          return;
        }

        const nextQuantity = Math.max(1, targetQuantity);
        const seq = (pendingLineUpdates[lineId] || 0) + 1;

        // Find current quantity for rollback reference
        let previousQuantity = confirmedQuantities[lineId];
        for (const g of cart.groups) {
          const found = g.items.find((i) => i.id === lineId);
          if (found) {
            if (previousQuantity === undefined) {
              previousQuantity = found.quantity;
            }
            break;
          }
        }

        // 1. Optimistic Update in Store immediately
        const optimisticGroups = cart.groups.map((group) => {
          const itemMatch = group.items.find((i) => i.id === lineId);
          if (!itemMatch) return group;

          const updatedItems = group.items.map((i) =>
            i.id === lineId ? { ...i, quantity: nextQuantity } : i
          );
          return {
            ...group,
            items: updatedItems,
          };
        });

        const normalized = normalizeServerCart({
          groups: optimisticGroups,
          totalItems: 0,
        });

        set({
          cart: normalized,
          pendingLineUpdates: { ...pendingLineUpdates, [lineId]: seq },
        });

        // 2. Dispatch API Call
        try {
          if (devSettings.simulateOffline) {
            throw new Error("Device offline: unable to sync quantity with server");
          }

          const options: ApiOptions = { latency: devSettings.latencyMs };
          if (devSettings.failNextQuantity) {
            options.failStatus = 409;
            // auto reset flag once triggered
            set({ devSettings: { ...devSettings, failNextQuantity: false } });
          }

          await CartApiService.updateQuantity(lineId, nextQuantity, options);

          // Verify if this is still the latest sequence
          const currentSeq = get().pendingLineUpdates[lineId];
          if (currentSeq === seq) {
            // Commit confirmed quantity
            set((state) => ({
              confirmedQuantities: {
                ...state.confirmedQuantities,
                [lineId]: nextQuantity,
              },
            }));
          }
        } catch (err: unknown) {
          // 3. Rollback on Failure
          const rollbackQty = previousQuantity || 1;
          const currentCart = get().cart;
          const errMessage = err instanceof Error ? err.message : "Conflict";
          if (currentCart) {
            const rolledBackGroups = currentCart.groups.map((group) => {
              const updatedItems = group.items.map((i) =>
                i.id === lineId ? { ...i, quantity: rollbackQty } : i
              );
              return { ...group, items: updatedItems };
            });

            set({
              cart: normalizeServerCart({ groups: rolledBackGroups, totalItems: 0 }),
              toastNotification: {
                id: `err-${Date.now()}`,
                message: `Could not update item quantity (${errMessage}). Rolled back to ${rollbackQty}.`,
                type: "error",
              },
            });
          }
        }
      },

      updateWellnessDuration: async (lineId: string, wellnessPricingId: string) => {
        const { cart, devSettings } = get();
        if (!cart) return;

        // 1. Optimistic Update
        const optimisticGroups = cart.groups.map((group) => {
          const itemMatch = group.items.find((i) => i.id === lineId);
          if (!itemMatch) return group;

          const updatedItems = group.items.map((item) => {
            if (item.id !== lineId) return item;
            const opt = item.product.wellnessPricing?.find((o) => o.id === wellnessPricingId);
            return {
              ...item,
              selectedWellnessPricingId: wellnessPricingId,
              selectedWellnessPricing: opt,
            };
          });

          return { ...group, items: updatedItems };
        });

        set({
          cart: normalizeServerCart({ groups: optimisticGroups, totalItems: 0 }),
        });

        // 2. Dispatch Server Call
        try {
          if (devSettings.simulateOffline) {
            throw new Error("Device offline: unable to save wellness option");
          }

          await CartApiService.updateWellnessDuration(lineId, wellnessPricingId, {
            latency: devSettings.latencyMs,
          });

          set({
            toastNotification: {
              id: `wellness-${Date.now()}`,
              message: "Wellness duration and pricing updated",
              type: "success",
            },
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          set({
            toastNotification: {
              id: `err-wellness-${Date.now()}`,
              message: `Failed to save duration: ${msg}`,
              type: "error",
            },
          });
        }
      },

      removeItem: async (lineId: string) => {
        const { cart, devSettings } = get();
        if (!cart) return;

        // Optimistic removal
        const filteredGroups = cart.groups
          .map((group) => ({
            ...group,
            items: group.items.filter((i) => i.id !== lineId),
          }))
          .filter((group) => group.items.length > 0);

        set({
          cart: normalizeServerCart({ groups: filteredGroups, totalItems: 0 }),
          toastNotification: {
            id: `remove-${Date.now()}`,
            message: "Item removed from cart",
            type: "info",
          },
        });

        try {
          await CartApiService.deleteItem(lineId, { latency: devSettings.latencyMs });
        } catch {
          // Server item deletion failed; optimistic state retained
        }
      },

      mergeGuestCart: async () => {
        const { devSettings } = get();
        set({ isLoading: true });

        try {
          if (devSettings.simulateOffline) {
            throw new Error("Device offline: cannot merge guest cart");
          }

          const options: ApiOptions = { latency: devSettings.latencyMs };
          if (devSettings.failNextMerge) {
            options.simulateError = true;
            set({ devSettings: { ...devSettings, failNextMerge: false } });
          }

          const res = await CartApiService.mergeCart(undefined, options);

          set({
            cart: res.cart,
            lastChanges: res.changes,
            isLoading: false,
            toastNotification: {
              id: `merge-${Date.now()}`,
              message: `Guest cart merged: ${res.changes.length} change(s) recorded`,
              type: "success",
            },
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          set({
            isLoading: false,
            toastNotification: {
              id: `merge-err-${Date.now()}`,
              message: `Guest cart merge failed: ${msg}`,
              type: "error",
            },
          });
        }
      },

      applyCoupon: (coupon: CouponDiscount) => {
        set({
          appliedCoupon: coupon,
          toastNotification: {
            id: `coupon-${Date.now()}`,
            message: `Coupon "${coupon.code}" applied!`,
            type: "success",
          },
        });
      },

      removeCoupon: () => {
        set({
          appliedCoupon: null,
          toastNotification: {
            id: `coupon-rem-${Date.now()}`,
            message: "Coupon removed",
            type: "info",
          },
        });
      },

      clearNotification: () => {
        set({ toastNotification: null });
      },

      setDevSettings: (settings) => {
        set((state) => ({
          devSettings: { ...state.devSettings, ...settings },
        }));
      },

      resetAll: async () => {
        set({
          orders: {},
          checkoutSession: {
            isCheckingOut: false,
            checkoutErrors: {},
            idempotencyKeys: {},
            completedOrderIds: [],
          },
          appliedCoupon: null,
          lastChanges: null,
        });
        await get().fetchCart(true);
      },

      // Single Group Checkout with Idempotency
      checkoutGroup: async (pkg, paymentMethod, patientDetails, customIdempotencyKey) => {
        const { checkoutSession, devSettings, appliedCoupon } = get();

        // 1. Get or Generate Idempotency Key
        const idempotencyKey =
          customIdempotencyKey ||
          checkoutSession.idempotencyKeys[pkg.groupType] ||
          `idemp_${pkg.groupType}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        set((state) => ({
          checkoutSession: {
            ...state.checkoutSession,
            isCheckingOut: true,
            checkoutErrors: {
              ...state.checkoutSession.checkoutErrors,
              [pkg.groupType]: "", // Clear previous error
            },
            idempotencyKeys: {
              ...state.checkoutSession.idempotencyKeys,
              [pkg.groupType]: idempotencyKey,
            },
          },
        }));

        try {
          const options: ApiOptions = { latency: devSettings.latencyMs };
          if (devSettings.failNextCheckout) {
            options.failStatus = 402;
            set({ devSettings: { ...devSettings, failNextCheckout: false } });
          }

          const discounts = calculateDiscount(appliedCoupon, pkg.subtotals, pkg.deliveryFees);
          const finalTotals: Record<string, number> = {};
          for (const [cur, total] of Object.entries(pkg.totalAmounts)) {
            const disc = discounts[cur] || 0;
            finalTotals[cur] = Math.max(0, total - disc);
          }

          const res = await CartApiService.checkout(
            {
              groupType: pkg.groupType,
              items: pkg.items,
              paymentMethod,
              idempotencyKey,
              patientDetails,
              packageTitle: pkg.title,
              providerName: pkg.providerName,
              subtotals: pkg.subtotals,
              deliveryFees: pkg.deliveryFees,
              finalTotals,
            },
            options
          );

          // Order succeeded! Remove this group's items from active cart
          const { cart } = get();
          if (cart) {
            const remainingGroups = cart.groups.filter((g) => g.type !== pkg.groupType);
            set({
              cart: normalizeServerCart({ groups: remainingGroups, totalItems: 0 }),
            });
          }

          set((state) => ({
            orders: {
              ...state.orders,
              [res.order.orderId]: res.order,
            },
            checkoutSession: {
              ...state.checkoutSession,
              isCheckingOut: false,
              completedOrderIds: [...state.checkoutSession.completedOrderIds, res.order.orderId],
            },
            toastNotification: {
              id: `order-ok-${Date.now()}`,
              message: `Order #${res.order.orderId} created successfully!`,
              type: "success",
            },
          }));

          return res.order;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Checkout failed";
          set((state) => ({
            checkoutSession: {
              ...state.checkoutSession,
              isCheckingOut: false,
              checkoutErrors: {
                ...state.checkoutSession.checkoutErrors,
                [pkg.groupType]: msg,
              },
            },
          }));
          throw err;
        }
      },

      // Checkout All Groups with Partial Failure Handling
      checkoutAll: async (packages, paymentMethod, patientDetails) => {
        const { devSettings } = get();
        set((state) => ({
          checkoutSession: {
            ...state.checkoutSession,
            isCheckingOut: true,
          },
        }));

        const succeeded: CheckoutOrder[] = [];
        const failed: { groupType: ServiceType; error: string }[] = [];

        for (let i = 0; i < packages.length; i++) {
          const pkg = packages[i];
          if (!pkg.eligibleForCheckout) continue;

          // Check if dev partial failure is simulated for the 2nd group
          if (devSettings.failPartialSecondGroup && i === 1) {
            const idempotencyKey =
              get().checkoutSession.idempotencyKeys[pkg.groupType] ||
              `idemp_${pkg.groupType}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

            set((state) => ({
              checkoutSession: {
                ...state.checkoutSession,
                checkoutErrors: {
                  ...state.checkoutSession.checkoutErrors,
                  [pkg.groupType]: "Provider gateway unavailable: partial failure simulation on Group 2",
                },
                idempotencyKeys: {
                  ...state.checkoutSession.idempotencyKeys,
                  [pkg.groupType]: idempotencyKey,
                },
              },
            }));
            failed.push({
              groupType: pkg.groupType,
              error: "Provider gateway unavailable: partial failure simulation on Group 2",
            });
            continue;
          }

          try {
            const order = await get().checkoutGroup(pkg, paymentMethod, patientDetails);
            succeeded.push(order);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to process group payment";
            failed.push({
              groupType: pkg.groupType,
              error: msg,
            });
          }
        }

        set((state) => ({
          checkoutSession: {
            ...state.checkoutSession,
            isCheckingOut: false,
          },
        }));

        return { succeeded, failed };
      },

      retryFailedGroupCheckout: async (pkg, paymentMethod, patientDetails) => {
        // Reuse stored idempotency key so retry does not duplicate
        const { checkoutSession } = get();
        const existingKey = checkoutSession.idempotencyKeys[pkg.groupType];
        return get().checkoutGroup(pkg, paymentMethod, patientDetails, existingKey);
      },

      clearCompletedOrder: (orderId: string) => {
        set((state) => {
          const remaining = { ...state.orders };
          delete remaining[orderId];
          return { orders: remaining };
        });
      },
    }),
    {
      name: "medex_cart_store_v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        guestCart: state.guestCart,
        orders: state.orders,
        checkoutSession: state.checkoutSession,
        appliedCoupon: state.appliedCoupon,
        devSettings: state.devSettings,
      }),
    }
  )
);
