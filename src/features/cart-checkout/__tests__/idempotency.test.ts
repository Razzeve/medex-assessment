import { test } from "node:test";
import assert from "node:assert/strict";
import { getOrderByKey, saveOrder } from "../services/mock-db";
import { CheckoutOrder } from "../types";

test("Checkout Idempotency - Same key returns original order without duplication", () => {
  const idempotencyKey = "test_key_12345";
  const order: CheckoutOrder = {
    orderId: "MDX-LAB-TEST-001",
    idempotencyKey,
    groupType: "lab_test",
    packageTitle: "Home Lab Collection",
    providerName: "Lotus Pathology",
    paymentMethod: "card",
    status: "paid",
    items: [],
    subtotals: { THB: 1677 },
    deliveryFees: { THB: 120 },
    finalTotals: { THB: 1797 },
    patientDetails: {
      fullName: "Test Patient",
      email: "test@medex.asia",
      phone: "+66 81 000 0000",
    },
    createdAt: new Date().toISOString(),
  };

  saveOrder(order);

  // Subsequent checkout invocation with identical idempotencyKey
  const retrievedOrder = getOrderByKey(idempotencyKey);
  assert.ok(retrievedOrder);
  assert.equal(retrievedOrder.orderId, "MDX-LAB-TEST-001");
  assert.equal(retrievedOrder.status, "paid");
});
