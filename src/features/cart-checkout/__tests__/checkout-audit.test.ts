import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCurrency } from "../utils/currency";
import { calculateDiscount, validateCoupon } from "../utils/coupons";
import {
  createSplitPackage,
  normalizeServerCart,
} from "../utils/split-engine";
import { CartGroup, ServerCartResponse } from "../types";

test("Checkout Audit - FREESHIP coupon waives delivery fees across provider currencies", () => {
  const result = validateCoupon("FREESHIP");
  assert.equal(result.valid, true);
  assert.ok(result.coupon);

  const subtotals = { THB: 1500, NPR: 4000 };
  const deliveryFees = { THB: 120, NPR: 250 };

  const discounts = calculateDiscount(result.coupon, subtotals, deliveryFees);
  assert.equal(discounts["THB"], 120);
  assert.equal(discounts["NPR"], 250);
});

test("Checkout Audit - Currency formatter handles lowercase strings and decimal formatting", () => {
  assert.equal(formatCurrency(1677, "thb"), "฿1,677");
  assert.equal(formatCurrency(12500.5, "npr"), "NPR 12,500.50");
  assert.equal(formatCurrency(350, "INR"), "₹350");
  assert.equal(formatCurrency(0, "THB"), "฿0");
  assert.equal(formatCurrency(NaN, "THB"), "฿0");
});

test("Checkout Audit - Empty group disappears and recalculates total metrics", () => {
  const initialCart: ServerCartResponse = {
    groups: [
      {
        type: "lab_test",
        itemCount: 1,
        unpricedItems: 0,
        subtotals: { THB: 1677 },
        items: [
          {
            id: "line_1",
            productId: "prod_1",
            quantity: 1,
            product: {
              id: "prod_1",
              title: "CBC Lab Test",
              type: "lab_test",
              currency: "THB",
              price: 1677,
            },
          },
        ],
      },
      {
        type: "wellness",
        itemCount: 1,
        unpricedItems: 0,
        subtotals: { THB: 1800 },
        items: [
          {
            id: "line_2",
            productId: "prod_2",
            quantity: 1,
            product: {
              id: "prod_2",
              title: "Spa Massage",
              type: "wellness",
              currency: "THB",
              price: 1800,
            },
          },
        ],
      },
    ],
    totalItems: 2,
  };

  // Remove the only item in lab_test group
  const updatedGroups = initialCart.groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.id !== "line_1"),
    }))
    .filter((g) => g.items.length > 0);

  const normalized = normalizeServerCart({
    groups: updatedGroups,
    totalItems: 0,
  });

  assert.equal(normalized.groups.length, 1);
  assert.equal(normalized.groups[0].type, "wellness");
  assert.equal(normalized.totalItems, 1);
  assert.equal(normalized.groups[0].subtotals["THB"], 1800);

  // Split package creation for remaining cart
  const packages = normalized.groups.map(createSplitPackage);
  assert.equal(packages.length, 1);
  assert.equal(packages[0].groupType, "wellness");
  // Wellness has 0 delivery fees
  assert.equal(packages[0].deliveryFees["THB"], 0);
});

test("Checkout Audit - Group-isolated checkout correctly isolates single package", () => {
  const groupLab: CartGroup = {
    type: "lab_test",
    itemCount: 1,
    unpricedItems: 0,
    subtotals: { THB: 1677 },
    items: [
      {
        id: "line_lab",
        productId: "p_lab",
        quantity: 1,
        product: {
          id: "p_lab",
          title: "Home Phlebotomist Lab",
          type: "lab_test",
          currency: "THB",
          price: 1677,
          providerName: "Lotus Pathology",
        },
      },
    ],
  };

  const groupWellness: CartGroup = {
    type: "wellness",
    itemCount: 2,
    unpricedItems: 0,
    subtotals: { THB: 3600 },
    items: [
      {
        id: "line_well",
        productId: "p_well",
        quantity: 2,
        product: {
          id: "p_well",
          title: "Aromatherapy",
          type: "wellness",
          currency: "THB",
          price: 1800,
          providerName: "Anantara Spa",
        },
      },
    ],
  };

  const allPackages = [createSplitPackage(groupLab), createSplitPackage(groupWellness)];
  assert.equal(allPackages.length, 2);

  // Simulate routing to /checkout?group=lab_test
  const isolatedLab = allPackages.filter((p) => p.groupType === "lab_test");
  assert.equal(isolatedLab.length, 1);
  assert.equal(isolatedLab[0].title, "Home Lab Collection");
  assert.equal(isolatedLab[0].deliveryFees["THB"], 120);
  assert.equal(isolatedLab[0].totalAmounts["THB"], 1677 + 120);

  // Simulate routing to /checkout?group=wellness
  const isolatedWellness = allPackages.filter((p) => p.groupType === "wellness");
  assert.equal(isolatedWellness.length, 1);
  assert.equal(isolatedWellness[0].deliveryFees["THB"], 0);
  assert.equal(isolatedWellness[0].totalAmounts["THB"], 3600);
});

test("Checkout Audit - Patient Details Validation logic distinguishes Physical vs Consultation items", () => {
  interface PatientValidationInput {
    fullName?: string;
    email?: string;
    phone?: string;
    addressLine?: string;
    city?: string;
    dateOfBirth?: string;
    gender?: string;
  }

  function validatePatient(input: PatientValidationInput, hasPhysical: boolean, hasConsultation: boolean) {
    const errors: Record<string, string> = {};
    if (!input.fullName?.trim()) errors.fullName = "Required";
    if (!input.email?.trim() || !input.email.includes("@")) errors.email = "Required";
    if (!input.phone?.trim()) errors.phone = "Required";

    if (hasPhysical) {
      if (!input.addressLine?.trim()) errors.addressLine = "Required";
      if (!input.city?.trim()) errors.city = "Required";
    }

    if (hasConsultation) {
      if (!input.dateOfBirth?.trim()) errors.dateOfBirth = "Required";
      if (!input.gender) errors.gender = "Required";
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  // 1. Physical order missing address should fail
  const physicalNoAddress = validatePatient(
    { fullName: "John Doe", email: "john@medex.asia", phone: "+66 81 000 0000" },
    true,
    false
  );
  assert.equal(physicalNoAddress.valid, false);
  assert.ok(physicalNoAddress.errors.addressLine);

  // 2. Physical order with address passes
  const physicalWithAddress = validatePatient(
    {
      fullName: "John Doe",
      email: "john@medex.asia",
      phone: "+66 81 000 0000",
      addressLine: "124 Sukhumvit",
      city: "Bangkok",
    },
    true,
    false
  );
  assert.equal(physicalWithAddress.valid, true);

  // 3. Lab/Consultation missing DOB should fail
  const labNoDob = validatePatient(
    {
      fullName: "Jane Doe",
      email: "jane@medex.asia",
      phone: "+66 81 000 0000",
      addressLine: "124 Sukhumvit",
      city: "Bangkok",
      gender: "female",
    },
    true,
    true
  );
  assert.equal(labNoDob.valid, false);
  assert.ok(labNoDob.errors.dateOfBirth);

  // 4. Complete lab order passes
  const labComplete = validatePatient(
    {
      fullName: "Jane Doe",
      email: "jane@medex.asia",
      phone: "+66 81 000 0000",
      addressLine: "124 Sukhumvit",
      city: "Bangkok",
      dateOfBirth: "1992-04-12",
      gender: "female",
    },
    true,
    true
  );
  assert.equal(labComplete.valid, true);
});
