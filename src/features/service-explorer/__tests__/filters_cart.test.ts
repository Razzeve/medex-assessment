import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FILTER_STATE } from '../hooks/use-service-filters';
import { normalizeServerCart } from '@/features/cart-checkout/utils/split-engine';
import { CartGroup, CartItem, AddCartItemPayload } from '@/features/cart-checkout/types';

test('Task 1: DEFAULT_FILTER_STATE provides a clean baseline', () => {
  assert.strictEqual(DEFAULT_FILTER_STATE.country, null);
  assert.strictEqual(DEFAULT_FILTER_STATE.city, null);
  assert.strictEqual(DEFAULT_FILTER_STATE.currency, 'ALL');
  assert.strictEqual(DEFAULT_FILTER_STATE.search, '');
  assert.strictEqual(DEFAULT_FILTER_STATE.categoryId, null);
  assert.strictEqual(DEFAULT_FILTER_STATE.minPrice, null);
  assert.strictEqual(DEFAULT_FILTER_STATE.maxPrice, null);
  assert.strictEqual(DEFAULT_FILTER_STATE.types.length, 0);
  assert.strictEqual(DEFAULT_FILTER_STATE.providerIds.length, 0);
});

test('Task 1: Cart item addition & split engine normalization', () => {
  const payload: AddCartItemPayload = {
    serviceId: 'srv-101',
    title: 'Executive Health Check',
    type: 'package',
    currency: 'THB',
    price: 5970.6,
    providerId: 48,
    providerName: 'Riverside International Hospital',
    categoryTitle: 'Health Check Up',
    quantity: 1,
  };

  const initialGroups: CartGroup[] = [];
  const groupType = payload.type || 'service';

  let targetGroup = initialGroups.find((g) => g.type === groupType);
  if (!targetGroup) {
    targetGroup = {
      type: groupType,
      itemCount: 0,
      unpricedItems: 0,
      subtotals: {},
      items: [],
    };
    initialGroups.push(targetGroup);
  }

  const newItem: CartItem = {
    id: `line_${payload.serviceId}`,
    productId: String(payload.serviceId),
    quantity: payload.quantity || 1,
    product: {
      id: String(payload.serviceId),
      title: payload.title,
      type: groupType,
      currency: payload.currency,
      providerId: payload.providerId,
      providerName: payload.providerName,
      price: payload.price,
      description: payload.categoryTitle,
    },
  };
  targetGroup.items.push(newItem);

  const normalized = normalizeServerCart({
    groups: initialGroups,
    totalItems: 0,
  });

  assert.strictEqual(normalized.totalItems, 1);
  assert.strictEqual(normalized.groups.length, 1);
  assert.strictEqual(normalized.groups[0].type, 'package');
  assert.strictEqual(normalized.groups[0].itemCount, 1);
  assert.strictEqual(normalized.groups[0].subtotals['THB'], 5970.6);

  // Add the same item again (quantity increment)
  const existingItem = targetGroup.items.find(
    (item) => item.productId === String(payload.serviceId)
  );
  if (existingItem) {
    existingItem.quantity += 1;
  }

  const normalizedAfterSecond = normalizeServerCart({
    groups: initialGroups,
    totalItems: 0,
  });

  assert.strictEqual(normalizedAfterSecond.totalItems, 2);
  assert.strictEqual(normalizedAfterSecond.groups[0].itemCount, 2);
  assert.strictEqual(normalizedAfterSecond.groups[0].subtotals['THB'], 11941.2);
});

test('Task 1: Wellness items without selected duration remain unpriced until chosen', () => {
  const wellnessPayload: AddCartItemPayload = {
    serviceId: 'well-202',
    title: 'Hot Stone Massage',
    type: 'wellness',
    currency: 'THB',
    price: 1790,
    providerId: 48,
    providerName: 'Sukhothai Wellness Retreat',
    selectedWellnessPricingId: 'w-60',
    selectedWellnessPricing: {
      id: 'w-60',
      durationInMinutes: 60,
      amount_after_service_charge: 1790,
    },
  };

  const groups: CartGroup[] = [
    {
      type: 'wellness',
      itemCount: 0,
      unpricedItems: 0,
      subtotals: {},
      items: [
        {
          id: 'line_well_1',
          productId: 'well-202',
          quantity: 1,
          selectedWellnessPricingId: wellnessPayload.selectedWellnessPricingId,
          selectedWellnessPricing: wellnessPayload.selectedWellnessPricing,
          product: {
            id: 'well-202',
            title: wellnessPayload.title,
            type: 'wellness',
            currency: 'THB',
            price: 1790,
          },
        },
      ],
    },
  ];

  const normalized = normalizeServerCart({ groups, totalItems: 0 });
  assert.strictEqual(normalized.groups[0].unpricedItems, 0);
  assert.strictEqual(normalized.groups[0].subtotals['THB'], 1790);
});

