import { describe, expect, it } from "vitest";

import { allocateInventoryFefo } from "../../src/modules/inventory/inventory-allocator.js";
import { assertNoInventoryShortage, evaluateInventoryShortage } from "../../src/modules/inventory/inventory-policy.js";
import type { AllocationCandidateLot } from "../../src/modules/inventory/inventory.types.js";

describe("allocateInventoryFefo", () => {
  it("uses earliest expiry, then oldest purchase date, then oldest created-at", () => {
    const result = allocateInventoryFefo({
      requestedQuantity: 30,
      unit: "g",
      lots: [
        lot("later-expiry", { expiryDate: "2027-01-01", purchaseDate: "2026-01-01", createdAt: new Date("2026-01-01T00:00:00.000Z") }),
        lot("earliest-expiry", { expiryDate: "2026-06-01", purchaseDate: "2026-03-01", createdAt: new Date("2026-03-01T00:00:00.000Z") }),
        lot("oldest-created", { expiryDate: "2026-06-01", purchaseDate: "2026-03-01", createdAt: new Date("2026-02-01T00:00:00.000Z") }),
        lot("oldest-purchase", { expiryDate: "2026-06-01", purchaseDate: "2026-01-01", createdAt: new Date("2026-04-01T00:00:00.000Z") })
      ]
    });

    expect(result.allocations.map((allocation) => allocation.inventoryLotId)).toEqual([
      "oldest-purchase",
      "oldest-created",
      "earliest-expiry"
    ]);
  });

  it("ignores zero lots, splits across lots, and reports uncovered quantity", () => {
    const result = allocateInventoryFefo({
      requestedQuantity: 75,
      unit: "ml",
      lots: [
        lot("empty", { quantityRemaining: 0, unit: "ml", expiryDate: "2026-01-01" }),
        lot("first", { quantityRemaining: 20, unit: "ml", expiryDate: "2026-02-01" }),
        lot("second", { quantityRemaining: 30, unit: "ml", expiryDate: "2026-03-01" })
      ]
    });

    expect(result).toEqual({
      allocations: [
        { inventoryLotId: "first", quantity: 20, unit: "ml" },
        { inventoryLotId: "second", quantity: 30, unit: "ml" }
      ],
      coveredQuantity: 50,
      uncoveredQuantity: 25,
      unit: "ml"
    });
  });

  it("places null expiry and purchase dates last", () => {
    const result = allocateInventoryFefo({
      requestedQuantity: 20,
      unit: "kg",
      lots: [
        lot("no-expiry", { unit: "kg", expiryDate: null, purchaseDate: "2026-01-01" }),
        lot("dated-expiry", { unit: "kg", expiryDate: "2028-01-01", purchaseDate: null })
      ]
    });

    expect(result.allocations.map((allocation) => allocation.inventoryLotId)).toEqual(["dated-expiry", "no-expiry"]);
  });

  it("rejects invalid quantities and unsupported unit conversion", () => {
    expect(() => allocateInventoryFefo({ requestedQuantity: 0, unit: "g", lots: [] })).toThrow(/greater than 0/);
    expect(() =>
      allocateInventoryFefo({
        requestedQuantity: 1,
        unit: "g",
        lots: [lot("ml-lot", { unit: "ml" })]
      })
    ).toThrow(/Unsupported inventory unit conversion/);
  });

  it("shortage policy rejects only when shortage override is absent", () => {
    const rejectDecision = evaluateInventoryShortage({
      coveredQuantity: 20,
      uncoveredQuantity: 5,
      allowInventoryShortage: false
    });
    expect(rejectDecision.shouldReject).toBe(true);
    expect(() => assertNoInventoryShortage(rejectDecision)).toThrow(/Insufficient inventory stock/);

    const allowDecision = evaluateInventoryShortage({
      coveredQuantity: 20,
      uncoveredQuantity: 5,
      allowInventoryShortage: true
    });
    expect(allowDecision.shouldReject).toBe(false);
    expect(() => assertNoInventoryShortage(allowDecision)).not.toThrow();
  });
});

function lot(id: string, override: Partial<AllocationCandidateLot> = {}): AllocationCandidateLot {
  return {
    id,
    productId: "product",
    quantityRemaining: override.quantityRemaining ?? 10,
    unit: override.unit ?? "g",
    purchaseDate: override.purchaseDate ?? "2026-01-01",
    expiryDate: override.expiryDate ?? "2026-12-31",
    ...override,
    createdAt: override.createdAt ?? new Date("2026-01-01T00:00:00.000Z")
  };
}
