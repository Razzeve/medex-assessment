import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateDeliveryFees,
  calculateGroupMetrics,
  createSplitPackage,
  getItemUnitPrice,
  isItemUnavailable,
  isItemWellnessUnpriced,
} from "../utils/split-engine";
import { CartGroup, CartItem } from "../types";

test("Split Engine - Never mix currencies in subtotal calculation", () => {
  const mixedItems: CartItem[] = [
    {
      id: "item-1",
      productId: "prod-1",
      quantity: 1,
      product: {
        id: "prod-1",
        title: "CBC Profile",
        type: "lab_test",
        currency: "THB",
        price: 1677,
      },
    },
    {
      id: "item-2",
      productId: "prod-2",
      quantity: 2,
      product: {
        id: "prod-2",
        title: "Liver Function Profile",
        type: "lab_test",
        currency: "NPR",
        price: 4760,
      },
    },
    {
      id: "item-3",
      productId: "prod-3",
      quantity: 1,
      product: {
        id: "prod-3",
        title: "Blood Panel",
        type: "lab_test",
        currency: "NPR",
        price: 3000,
      },
    },
  ];

  const metrics = calculateGroupMetrics(mixedItems);

  // Sum of quantities: 1 + 2 + 1 = 4
  assert.equal(metrics.itemCount, 4);
  assert.equal(metrics.unpricedItems, 0);

  // Discrete multi-currency checks
  assert.equal(metrics.subtotals["THB"], 1677);
  assert.equal(metrics.subtotals["NPR"], 4760 * 2 + 3000); // 9520 + 3000 = 12520
  // Crucial check: NPR and THB must never be combined into a single number
  assert.equal(Object.keys(metrics.subtotals).length, 2);
});

test("Split Engine - Wellness items remain unpriced until duration option is selected", () => {
  const unselectedWellness: CartItem = {
    id: "wellness-1",
    productId: "prod-facial",
    quantity: 1,
    product: {
      id: "prod-facial",
      title: "Signature Facial",
      type: "wellness",
      currency: "THB",
      price: null,
      priceUnknown: true,
      wellnessPricing: [
        {
          id: "opt-60",
          durationInMinutes: 60,
          amount_after_service_charge: 1800,
        },
        {
          id: "opt-90",
          durationInMinutes: 90,
          amount_after_service_charge: 2040,
        },
      ],
    },
  };

  assert.equal(isItemWellnessUnpriced(unselectedWellness), true);
  assert.equal(getItemUnitPrice(unselectedWellness), null);

  const metricsUnselected = calculateGroupMetrics([unselectedWellness]);
  assert.equal(metricsUnselected.itemCount, 1);
  assert.equal(metricsUnselected.unpricedItems, 1);
  assert.equal(metricsUnselected.subtotals["THB"], undefined);

  // Now simulate user choosing the 90-minute duration
  const selectedWellness: CartItem = {
    ...unselectedWellness,
    selectedWellnessPricingId: "opt-90",
    selectedWellnessPricing: {
      id: "opt-90",
      durationInMinutes: 90,
      amount_after_service_charge: 2040,
    },
  };

  assert.equal(isItemWellnessUnpriced(selectedWellness), false);
  assert.equal(getItemUnitPrice(selectedWellness), 2040);

  const metricsSelected = calculateGroupMetrics([selectedWellness]);
  assert.equal(metricsSelected.unpricedItems, 0);
  assert.equal(metricsSelected.subtotals["THB"], 2040);
});

test("Split Engine - Detects unavailable products and marks package ineligible for checkout", () => {
  const unavailableItem: CartItem = {
    id: "item-delisted",
    productId: "prod-delisted",
    quantity: 1,
    product: {}, // Empty product object represents delisted service
  };

  assert.equal(isItemUnavailable(unavailableItem), true);
  assert.equal(getItemUnitPrice(unavailableItem), null);

  const group: CartGroup = {
    type: "unknown",
    itemCount: 1,
    unpricedItems: 1,
    subtotals: {},
    items: [unavailableItem],
  };

  const splitPkg = createSplitPackage(group);
  assert.equal(splitPkg.hasUnavailableItems, true);
  assert.equal(splitPkg.eligibleForCheckout, false);
  assert.ok(splitPkg.blockingReasons.length > 0);
});

test("Split Engine - Delivery fee calculations and free tier thresholds", () => {
  // Below threshold: 1677 THB < 3000 THB free threshold for lab_test
  const feesStandard = calculateDeliveryFees("lab_test", { THB: 1677, NPR: 4000 });
  assert.equal(feesStandard["THB"], 120);
  assert.equal(feesStandard["NPR"], 250);

  // Above threshold: 5000 THB >= 3000 THB
  const feesFree = calculateDeliveryFees("lab_test", { THB: 5000, NPR: 12000 });
  assert.equal(feesFree["THB"], 0);
  assert.equal(feesFree["NPR"], 0);

  // Packages and Wellness are on-site visits with 0 delivery fee
  const feesClinic = calculateDeliveryFees("package", { THB: 15000 });
  assert.equal(feesClinic["THB"], 0);
});
