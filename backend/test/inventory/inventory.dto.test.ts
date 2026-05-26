import { describe, expect, it } from "vitest";

import { toInventoryMovementDto } from "../../src/modules/inventory/inventory.dto.js";
import type { InventoryMovement } from "../../src/modules/inventory/inventory.types.js";

const baseMovement: InventoryMovement = {
  id: "11111111-1111-4111-8111-111111111111",
  accountId: "22222222-2222-4222-8222-222222222222",
  productId: "33333333-3333-4333-8333-333333333333",
  inventoryLotId: "44444444-4444-4444-8444-444444444444",
  movementType: "manual_adjustment",
  quantity: 5,
  unit: "g",
  activityId: null,
  occurredAt: new Date("2026-05-26T10:00:00.000Z"),
  notes: null,
  createdAt: new Date("2026-05-26T10:00:00.000Z")
};

describe("inventory DTO mapping", () => {
  it("emits correctionDirection only for correction movements", () => {
    expect(
      toInventoryMovementDto({
        ...baseMovement,
        movementType: "manual_adjustment",
        notes: "correction_direction=increase_lot; user supplied prefix"
      })
    ).not.toHaveProperty("correctionDirection");

    expect(
      toInventoryMovementDto({
        ...baseMovement,
        movementType: "correction",
        notes: "correction_direction=decrease_lot; corrected extra usage"
      })
    ).toMatchObject({ correctionDirection: "decrease_lot" });
  });
});
