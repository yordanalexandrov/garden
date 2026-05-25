import { AppError } from "../../shared/errors/app-error.js";
import { assertSameInventoryUnit } from "./inventory-policy.js";
import type { AllocationCandidateLot, InventoryAllocationInput, InventoryAllocationResult } from "./inventory.types.js";

export function allocateInventoryFefo(input: InventoryAllocationInput): InventoryAllocationResult {
  if (input.requestedQuantity <= 0) {
    throw new AppError("VALIDATION_ERROR", "Inventory allocation quantity must be greater than 0", {
      quantity: ["Must be greater than 0"]
    });
  }

  const sortedLots = input.lots
    .filter((lot) => lot.quantityRemaining > 0)
    .map((lot) => {
      assertSameInventoryUnit(input.unit, lot.unit);
      return lot;
    })
    .sort(compareFefoLots);

  let remaining = input.requestedQuantity;
  const allocations: InventoryAllocationResult["allocations"] = [];

  for (const lot of sortedLots) {
    if (remaining <= 0) {
      break;
    }

    const quantity = Math.min(lot.quantityRemaining, remaining);
    allocations.push({
      inventoryLotId: lot.id,
      quantity,
      unit: input.unit
    });
    remaining -= quantity;
  }

  const uncoveredQuantity = Math.max(0, remaining);

  return {
    allocations,
    coveredQuantity: input.requestedQuantity - uncoveredQuantity,
    uncoveredQuantity,
    unit: input.unit
  };
}

function compareFefoLots(a: AllocationCandidateLot, b: AllocationCandidateLot): number {
  return (
    compareNullableDate(a.expiryDate, b.expiryDate) ||
    compareNullableDate(a.purchaseDate, b.purchaseDate) ||
    a.createdAt.getTime() - b.createdAt.getTime() ||
    a.id.localeCompare(b.id)
  );
}

function compareNullableDate(a: string | null, b: string | null): number {
  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  return a.localeCompare(b);
}
