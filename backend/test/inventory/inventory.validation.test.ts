import { describe, expect, it } from "vitest";

import {
  createInventoryLotBodySchema,
  inventoryMovementsQuerySchema,
  inventoryOverviewQuerySchema,
  manualInventoryAdjustmentBodySchema
} from "../../src/modules/inventory/inventory.validation.js";

describe("inventory validation", () => {
  it("accepts canonical lot creation units and rejects invalid quantity/unit", () => {
    for (const unit of ["g", "kg", "ml", "l"]) {
      expect(createInventoryLotBodySchema.parse({ quantityInitial: 1, unit })).toMatchObject({ unit });
    }

    expect(() => createInventoryLotBodySchema.parse({ quantityInitial: 0, unit: "g" })).toThrow();
    expect(() => createInventoryLotBodySchema.parse({ quantityInitial: -1, unit: "g" })).toThrow();
    expect(() => createInventoryLotBodySchema.parse({ quantityInitial: 1, unit: "oz" })).toThrow();
  });

  it("accepts only manual adjustment movement types for adjustment payloads", () => {
    expect(
      manualInventoryAdjustmentBodySchema.parse({
        productId: "11111111-1111-4111-8111-111111111111",
        inventoryLotId: "22222222-2222-4222-8222-222222222222",
        quantity: 2,
        unit: "g",
        movementType: "manual_adjustment",
        direction: "decrease"
      })
    ).toMatchObject({ movementType: "manual_adjustment", direction: "decrease" });

    expect(() =>
      manualInventoryAdjustmentBodySchema.parse({
        productId: "11111111-1111-4111-8111-111111111111",
        inventoryLotId: "22222222-2222-4222-8222-222222222222",
        quantity: 2,
        unit: "g",
        movementType: "consumption",
        direction: "decrease"
      })
    ).toThrow();
  });

  it("parses overview and movement query filters", () => {
    expect(
      inventoryOverviewQuerySchema.parse({
        q: " copper ",
        category: "fungicide",
        lowStockOnly: "true",
        expiringBefore: "2027-01-01",
        page: "2",
        pageSize: "5"
      })
    ).toEqual({
      q: "copper",
      category: "fungicide",
      lowStockOnly: true,
      expiringBefore: "2027-01-01",
      page: 2,
      pageSize: 5
    });

    expect(inventoryMovementsQuerySchema.parse({ movementType: "purchase" })).toMatchObject({
      movementType: "purchase"
    });
    expect(() => inventoryMovementsQuerySchema.parse({ movementType: "unknown" })).toThrow();
  });
});
