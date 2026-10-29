import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateDiscount, validateCoupon } from "../utils/coupons";

test("Coupons - Percentage discount applied across multiple currencies", () => {
  const result = validateCoupon("medex10");
  assert.equal(result.valid, true);
  assert.ok(result.coupon);

  const subtotals = {
    THB: 10000,
    NPR: 20000,
    INR: 5000,
  };

  const discounts = calculateDiscount(result.coupon, subtotals);
  assert.equal(discounts["THB"], 1000);
  assert.equal(discounts["NPR"], 2000);
  assert.equal(discounts["INR"], 500);
});

test("Coupons - Fixed discount clamped to prevent negative balance", () => {
  const result = validateCoupon("HEALTH500");
  assert.equal(result.valid, true);

  const smallSubtotal = {
    THB: 300, // Less than 500 fixed credit
    NPR: 1200,
  };

  const discounts = calculateDiscount(result.coupon!, smallSubtotal);
  // THB discount clamped to 300 so amount doesn't become negative
  assert.equal(discounts["THB"], 300);
  assert.equal(discounts["NPR"], 500);
});

test("Coupons - Rejects invalid promo code with helpful error", () => {
  const result = validateCoupon("INVALIDCODE");
  assert.equal(result.valid, false);
  assert.match(result.message, /invalid or expired/);
});

