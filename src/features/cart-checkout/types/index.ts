/**
 * MedEx Cart & Split Checkout Domain Types
 * Strict TypeScript definitions modeling multi-provider healthcare marketplace data.
 */

export type ServiceType = "package" | "lab_test" | "wellness" | "service" | "insurance" | "unknown";

export type Currency = "THB" | "NPR" | "INR";

export interface WellnessPricingOption {
  id: string;
  durationInMinutes: number;
  amount_after_service_charge: number;
}

export interface CartProduct {
  id?: string;
  title?: string;
  type?: ServiceType;
  currency?: Currency;
  providerId?: number;
  providerName?: string;
  price?: number | null;
  priceUnknown?: boolean;
  wellnessPricing?: WellnessPricingOption[];
  imageUrl?: string;
  description?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
  selectedWellnessPricingId?: string;
  selectedWellnessPricing?: WellnessPricingOption;
}

export interface CartGroup {
  type: ServiceType;
  itemCount: number;
  unpricedItems: number;
  subtotals: Record<string, number>;
  items: CartItem[];
}

export interface ServerCartResponse {
  groups: CartGroup[];
  totalItems: number;
}

export interface GuestCartItem {
  productId: string;
  quantity: number;
  wellnessPricingId?: string;
}

export type GuestCartMergeChangeType =
  | "quantity_updated"
  | "item_added"
  | "wellness_duration_selected"
  | "discontinued_item";

export interface GuestCartMergeChange {
  type: GuestCartMergeChangeType;
  productId: string;
  title: string;
  description: string;
}

export interface MergeCartResponse {
  cart: ServerCartResponse;
  changes: GuestCartMergeChange[];
}

// Fulfillment Package Split
export type FulfillmentType =
  | "clinic_visit"
  | "lab_sample_collection"
  | "wellness_appointment"
  | "digital_telehealth"
  | "direct_service";

export interface DeliveryFeePerCurrency {
  currency: Currency;
  amount: number;
  isFree: boolean;
}

export interface SplitPackage {
  id: string;
  groupType: ServiceType;
  fulfillmentType: FulfillmentType;
  providerName: string;
  providerId?: number;
  title: string;
  badgeLabel: string;
  estimatedTimeline: string;
  items: CartItem[];
  subtotals: Record<string, number>;
  deliveryFees: Record<string, number>;
  totalAmounts: Record<string, number>;
  hasUnpricedItems: boolean;
  hasUnavailableItems: boolean;
  eligibleForCheckout: boolean;
  blockingReasons: string[];
}

// Multi-Step Checkout Form
export type PaymentMethod = "card" | "pay_at_clinic";

export interface PatientDetails {
  fullName: string;
  email: string;
  phone: string;
  addressLine?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  notes?: string;
}

export type OrderStatus = "pending" | "processing" | "paid" | "failed";

export interface CheckoutOrder {
  orderId: string;
  idempotencyKey: string;
  groupType: ServiceType;
  packageTitle: string;
  providerName: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  items: CartItem[];
  subtotals: Record<string, number>;
  deliveryFees: Record<string, number>;
  finalTotals: Record<string, number>;
  patientDetails: PatientDetails;
  createdAt: string;
  errorMessage?: string;
}

export interface CheckoutResult {
  orderId: string;
  status: OrderStatus;
  idempotencyKey: string;
  groupType: ServiceType;
  errorMessage?: string;
}

export interface CouponDiscount {
  code: string;
  description: string;
  percentageDiscount?: number; // e.g. 10 for 10%
  fixedDiscounts?: Record<Currency, number>; // e.g. { THB: 200, NPR: 500, INR: 300 }
}

export interface DevSimulationSettings {
  latencyMs: number;
  failNextCheckout: boolean;
  failPartialSecondGroup: boolean;
  failNextQuantity: boolean;
  failNextMerge: boolean;
  simulateOffline: boolean;
}

