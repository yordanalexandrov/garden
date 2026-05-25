import { AppError } from "../../shared/errors/app-error.js";
import type { InventoryShortageDecision, SimpleUnit } from "./inventory.types.js";

export function assertSameInventoryUnit(requestedUnit: SimpleUnit, lotUnit: SimpleUnit): void {
  if (requestedUnit !== lotUnit) {
    throw new AppError("BUSINESS_RULE_VIOLATION", "Unsupported inventory unit conversion", {
      unit: ["Inventory operations only support same-unit quantities in v1"]
    });
  }
}

export function evaluateInventoryShortage(input: {
  coveredQuantity: number;
  uncoveredQuantity: number;
  allowInventoryShortage: boolean;
}): InventoryShortageDecision {
  const uncoveredQuantity = Math.max(0, input.uncoveredQuantity);

  return {
    allowed: input.allowInventoryShortage,
    coveredQuantity: input.coveredQuantity,
    uncoveredQuantity,
    shouldReject: uncoveredQuantity > 0 && !input.allowInventoryShortage
  };
}

export function assertNoInventoryShortage(decision: InventoryShortageDecision): void {
  if (decision.shouldReject) {
    throw new AppError("INVENTORY_SHORTAGE", "Insufficient inventory stock", {
      quantity: ["Insufficient stock and shortage override is not allowed"]
    });
  }
}
