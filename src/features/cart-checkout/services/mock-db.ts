import fs from "fs/promises";
import path from "path";
import {
  CartProduct,
  CheckoutOrder,
  GuestCartItem,
  MergeCartResponse,
  ServerCartResponse,
} from "../types";
import { mergeGuestCartIntoServerCart } from "../utils/merge";
import { normalizeServerCart } from "../utils/split-engine";

interface MockCartData {
  catalog: CartProduct[];
  serverCart: ServerCartResponse;
  guestCart: GuestCartItem[];
}

// In-memory singleton state across API routes
let currentCart: ServerCartResponse | null = null;
let currentCatalog: CartProduct[] = [];
let defaultGuestCart: GuestCartItem[] = [];
const ordersStore = new Map<string, CheckoutOrder>();
const idempotencyStore = new Map<string, string>(); // idempotencyKey -> orderId

async function loadInitialData(): Promise<MockCartData> {
  const filePath = path.join(process.cwd(), "public/data/task2-cart.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  return {
    catalog: data.catalog || [],
    serverCart: normalizeServerCart(data.serverCart),
    guestCart: data.guestCart || [],
  };
}

export async function getOrInitCart(): Promise<{
  cart: ServerCartResponse;
  catalog: CartProduct[];
  guestCart: GuestCartItem[];
}> {
  if (!currentCart || currentCatalog.length === 0) {
    const data = await loadInitialData();
    currentCatalog = data.catalog;
    defaultGuestCart = data.guestCart;
    currentCart = data.serverCart;
  }
  return {
    cart: currentCart,
    catalog: currentCatalog,
    guestCart: defaultGuestCart,
  };
}

export async function resetMockCart(): Promise<ServerCartResponse> {
  const data = await loadInitialData();
  currentCatalog = data.catalog;
  defaultGuestCart = data.guestCart;
  currentCart = data.serverCart;
  ordersStore.clear();
  idempotencyStore.clear();
  return currentCart;
}

export async function updateItemQuantity(
  lineId: string,
  newQuantity: number
): Promise<{ success: boolean; cart: ServerCartResponse; notFound?: boolean }> {
  const { cart } = await getOrInitCart();

  let itemFound = false;
  for (const group of cart.groups) {
    const item = group.items.find((i) => i.id === lineId);
    if (item) {
      item.quantity = Math.max(1, newQuantity);
      itemFound = true;
      break;
    }
  }

  if (!itemFound) {
    return { success: false, cart, notFound: true };
  }

  currentCart = normalizeServerCart(cart);
  return { success: true, cart: currentCart };
}

export async function updateItemWellnessDuration(
  lineId: string,
  wellnessPricingId: string
): Promise<{ success: boolean; cart: ServerCartResponse; notFound?: boolean }> {
  const { cart } = await getOrInitCart();

  let itemFound = false;
  for (const group of cart.groups) {
    const item = group.items.find((i) => i.id === lineId);
    if (item && item.product.wellnessPricing) {
      const option = item.product.wellnessPricing.find((o) => o.id === wellnessPricingId);
      if (option) {
        item.selectedWellnessPricingId = option.id;
        item.selectedWellnessPricing = option;
        itemFound = true;
        break;
      }
    }
  }

  if (!itemFound) {
    return { success: false, cart, notFound: true };
  }

  currentCart = normalizeServerCart(cart);
  return { success: true, cart: currentCart };
}

export async function removeCartItem(
  lineId: string
): Promise<{ success: boolean; cart: ServerCartResponse; notFound?: boolean }> {
  const { cart } = await getOrInitCart();

  let itemFound = false;
  for (const group of cart.groups) {
    const initialLen = group.items.length;
    group.items = group.items.filter((i) => i.id !== lineId);
    if (group.items.length < initialLen) {
      itemFound = true;
    }
  }

  if (!itemFound) {
    return { success: false, cart, notFound: true };
  }

  // Remove empty groups if unknown
  cart.groups = cart.groups.filter((g) => g.items.length > 0);
  currentCart = normalizeServerCart(cart);
  return { success: true, cart: currentCart };
}

export async function mergeGuestCart(
  guestItems?: GuestCartItem[]
): Promise<MergeCartResponse> {
  const { cart, catalog, guestCart } = await getOrInitCart();
  const itemsToMerge = guestItems && guestItems.length > 0 ? guestItems : guestCart;

  const result = mergeGuestCartIntoServerCart(cart, itemsToMerge, catalog);
  currentCart = result.cart;
  return result;
}

// Checkout & Idempotency Store
export function getOrderById(orderId: string): CheckoutOrder | undefined {
  return ordersStore.get(orderId);
}

export function getOrderByKey(idempotencyKey: string): CheckoutOrder | undefined {
  const orderId = idempotencyStore.get(idempotencyKey);
  if (!orderId) return undefined;
  return ordersStore.get(orderId);
}

export function saveOrder(order: CheckoutOrder): void {
  ordersStore.set(order.orderId, order);
  if (order.idempotencyKey) {
    idempotencyStore.set(order.idempotencyKey, order.orderId);
  }
}
