import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { mergeGuestCartIntoServerCart } from "../utils/merge";
import { GuestCartItem, ServerCartResponse } from "../types";

// Load actual assessment JSON
const rawData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "public/data/task2-cart.json"), "utf8")
);

test("Guest Cart Merge - Handles all 4 dataset overlap scenarios accurately", () => {
  const initialServerCart: ServerCartResponse = rawData.serverCart;
  const guestCartItems: GuestCartItem[] = rawData.guestCart;
  const catalog = rawData.catalog;

  const result = mergeGuestCartIntoServerCart(initialServerCart, guestCartItems, catalog);

  // Assert audit changes were produced
  assert.equal(result.changes.length, 4);

  // 1. Overlapping product: Liver Function Profile (quantity updated 2 + 3 = 5)
  const liverItemChange = result.changes.find(
    (c) => c.productId === "7bcdaf5b-7874-4061-83ee-ef9c954ffcaf"
  );
  assert.ok(liverItemChange);
  assert.equal(liverItemChange.type, "quantity_updated");

  const labGroup = result.cart.groups.find((g) => g.type === "lab_test");
  assert.ok(labGroup);
  const liverItem = labGroup.items.find(
    (i) => i.productId === "7bcdaf5b-7874-4061-83ee-ef9c954ffcaf"
  );
  assert.equal(liverItem?.quantity, 5);

  // 2. New product: Lipid Profile (added to lab_test)
  const lipidItemChange = result.changes.find(
    (c) => c.productId === "6a92d368-a25a-4e00-89ce-77d69da06b45"
  );
  assert.ok(lipidItemChange);
  assert.equal(lipidItemChange.type, "item_added");

  const lipidItem = labGroup.items.find(
    (i) => i.productId === "6a92d368-a25a-4e00-89ce-77d69da06b45"
  );
  assert.ok(lipidItem);
  assert.equal(lipidItem.quantity, 1);

  // 3. Wellness duration resolution: Signature Facial
  const facialChange = result.changes.find(
    (c) => c.productId === "5f0c1a52-6b1e-4c1f-9a51-000000000003"
  );
  assert.ok(facialChange);
  assert.equal(facialChange.type, "wellness_duration_selected");

  const wellnessGroup = result.cart.groups.find((g) => g.type === "wellness");
  assert.ok(wellnessGroup);
  const facialItem = wellnessGroup.items.find(
    (i) => i.productId === "5f0c1a52-6b1e-4c1f-9a51-000000000003"
  );
  assert.equal(facialItem?.selectedWellnessPricingId, "a1b2c3d4-0000-4000-8000-000000000090");
  // Wellness group should now have subtotal for 90m option (2040 THB)
  assert.equal(wellnessGroup.subtotals["THB"], 2040);
  assert.equal(wellnessGroup.unpricedItems, 0);

  // 4. Stale/Discontinued product: 6b572fa4-4559-4dfd-a276-9c1400ce208e
  const discontinuedChange = result.changes.find(
    (c) => c.productId === "6b572fa4-4559-4dfd-a276-9c1400ce208e"
  );
  assert.ok(discontinuedChange);
  assert.equal(discontinuedChange.type, "discontinued_item");
});
