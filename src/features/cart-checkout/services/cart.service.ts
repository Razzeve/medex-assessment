import {
  AddCartItemPayload,
  CartItem,
  CheckoutOrder,
  GuestCartItem,
  GuestCartMergeChange,
  PaymentMethod,
  PatientDetails,
  ServerCartResponse,
  ServiceType,
} from "../types";

export interface CheckoutPayload {
  groupType: ServiceType;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  patientDetails?: PatientDetails;
  packageTitle?: string;
  providerName?: string;
  subtotals?: Record<string, number>;
  deliveryFees?: Record<string, number>;
  finalTotals?: Record<string, number>;
}

export interface ApiOptions {
  latency?: number;
  simulateError?: boolean;
  failStatus?: number;
  failGroup?: string;
}

export class CartApiService {
  private static buildHeaders(options?: ApiOptions): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (options?.latency !== undefined) {
      headers["x-latency-ms"] = String(options.latency);
    }
    if (options?.simulateError) {
      headers["x-simulate-error"] = "true";
    }
    if (options?.failStatus) {
      headers["x-fail-status"] = String(options.failStatus);
    }
    if (options?.failGroup) {
      headers["x-fail-group"] = options.failGroup;
    }
    return headers;
  }

  static async getCart(
    options?: ApiOptions & { reset?: boolean }
  ): Promise<{ cart: ServerCartResponse; guestCart: GuestCartItem[] }> {
    const params = new URLSearchParams();
    if (options?.reset) params.set("reset", "true");
    if (options?.latency) params.set("latency", String(options.latency));
    if (options?.simulateError) params.set("simulateError", "true");

    const res = await fetch(`/api/cart?${params.toString()}`, {
      method: "GET",
      headers: this.buildHeaders(options),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch cart (HTTP ${res.status})`);
    }

    return res.json();
  }

  static async addItem(
    payload: AddCartItemPayload,
    options?: ApiOptions
  ): Promise<{ cart: ServerCartResponse }> {
    const res = await fetch('/api/cart', {
      method: "POST",
      headers: this.buildHeaders(options),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to add item (HTTP ${res.status})`);
    }

    return res.json();
  }

  static async updateQuantity(
    lineId: string,
    quantity: number,
    options?: ApiOptions
  ): Promise<{ cart: ServerCartResponse }> {
    const res = await fetch(`/api/cart/items/${encodeURIComponent(lineId)}`, {
      method: "PATCH",
      headers: this.buildHeaders(options),
      body: JSON.stringify({ quantity }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const err = new Error(
        errorData.error || `Failed to update quantity (HTTP ${res.status})`
      ) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    return res.json();
  }

  static async updateWellnessDuration(
    lineId: string,
    wellnessPricingId: string,
    options?: ApiOptions
  ): Promise<{ cart: ServerCartResponse }> {
    const res = await fetch(`/api/cart/items/${encodeURIComponent(lineId)}`, {
      method: "PATCH",
      headers: this.buildHeaders(options),
      body: JSON.stringify({ wellnessPricingId }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const err = new Error(
        errorData.error || `Failed to update wellness option (HTTP ${res.status})`
      ) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    return res.json();
  }

  static async deleteItem(lineId: string, options?: ApiOptions): Promise<void> {
    const res = await fetch(`/api/cart/items/${encodeURIComponent(lineId)}`, {
      method: "DELETE",
      headers: this.buildHeaders(options),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to remove item (HTTP ${res.status})`);
    }
  }

  static async mergeCart(
    items?: GuestCartItem[],
    options?: ApiOptions
  ): Promise<{ cart: ServerCartResponse; changes: GuestCartMergeChange[] }> {
    const res = await fetch("/api/cart/merge", {
      method: "POST",
      headers: this.buildHeaders(options),
      body: JSON.stringify({ items }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to merge guest cart (HTTP ${res.status})`);
    }

    return res.json();
  }

  static async checkout(
    payload: CheckoutPayload,
    options?: ApiOptions
  ): Promise<{ orderId: string; status: string; order: CheckoutOrder; idempotentReplay?: boolean }> {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: this.buildHeaders(options),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const err = new Error(
        errorData.error || `Checkout failed (HTTP ${res.status})`
      ) as Error & { status?: number; idempotencyKey?: string };
      err.status = res.status;
      err.idempotencyKey = payload.idempotencyKey;
      throw err;
    }

    return res.json();
  }

  static async getOrder(orderId: string): Promise<CheckoutOrder> {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`Order ${orderId} not found`);
    }

    const data = await res.json();
    return data.order;
  }
}
