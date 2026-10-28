import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSingleOptionPrice,
  calculateServicePrice,
  formatPrice,
} from '../utils/pricing.ts';
import { RawService } from '../types/index.ts';

test('Pricing - Standard percentage discount and percentage service charge', () => {
  // Executive Health Check (Male): price = 6200, discount = 10%, serviceCharge = 7%
  const result = calculateSingleOptionPrice('6200.00', '10.00', 'percent', '7.00', 'percent');

  assert.strictEqual(result.originalPrice, 6200);
  assert.strictEqual(result.discountAmount, 620);
  assert.strictEqual(result.serviceChargeAmount, 390.6);
  assert.strictEqual(result.finalPrice, 5970.6);
  assert.strictEqual(formatPrice(result.finalPrice, 'THB'), 'THB 5,970.60');
});

test('Pricing - Flat amount discount and flat amount service charge', () => {
  const result = calculateSingleOptionPrice('2500.00', '300.00', 'amount', '50.00', 'amount');

  assert.strictEqual(result.originalPrice, 2500);
  assert.strictEqual(result.discountAmount, 300);
  assert.strictEqual(result.serviceChargeAmount, 50);
  assert.strictEqual(result.finalPrice, 2250);
});

test('Pricing - Awkward data case: discount exceeds price (clamped to prevent negative)', () => {
  // Vitamin D Test data inconsistency in mock dataset: price 450, discount 600
  const result = calculateSingleOptionPrice('450.00', '600.00', 'amount', '0.00', 'amount');

  assert.strictEqual(result.originalPrice, 450);
  assert.strictEqual(result.discountAmount, 450); // Clamped to base price
  assert.strictEqual(result.finalPrice, 0); // Never negative
});

test('Pricing - Zero price service (Free Consultation)', () => {
  const result = calculateSingleOptionPrice('0.00', '0.00', 'amount', '0.00', 'amount');

  assert.strictEqual(result.originalPrice, 0);
  assert.strictEqual(result.finalPrice, 0);
});

test('Pricing - Wellness service duration options & lowest option detection', () => {
  const wellnessService: RawService = {
    id: 'well-1',
    title: 'Signature Facial',
    slug: 'signature-facial',
    type: 'wellness',
    userId: 48,
    categoryId: 'cat-1',
    subCategoryId: null,
    price: null,
    discount: null,
    discountType: null,
    serviceCharge: null,
    serviceChargeType: null,
    status: true,
    testAtHome: false,
    homeTestCharge: null,
    createdAt: '2025-01-01',
    wellnessPricing: [
      {
        id: 'opt-60',
        durationInMinutes: 60,
        price: '1800.00',
        discount: '0.00',
        discountType: 'amount',
        serviceCharge: '0.00',
        serviceChargeType: 'amount',
      },
      {
        id: 'opt-90',
        durationInMinutes: 90,
        price: '2400.00',
        discount: '15.00',
        discountType: 'percent',
        serviceCharge: '0.00',
        serviceChargeType: 'amount',
      },
    ],
  };

  const calc = calculateServicePrice(wellnessService, 'THB');
  assert.strictEqual(calc.isWellness, true);
  assert.strictEqual(calc.minDuration, 60);
  assert.strictEqual(calc.finalPrice, 1800);
  assert.strictEqual(calc.wellnessOptions?.length, 2);
  assert.strictEqual(calc.wellnessOptions?.[1].finalPrice, 2040); // 2400 - 15% (360) = 2040
});
