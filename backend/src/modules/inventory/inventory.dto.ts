import type {
  CreateInventoryLotDto,
  CreateInventoryLotResult,
  InventoryLot,
  InventoryLotDto,
  InventoryMovement,
  InventoryMovementDto,
  InventoryOverviewItem,
  InventoryOverviewItemDto,
  ManualInventoryAdjustmentDto,
  ManualInventoryAdjustmentResult
} from "./inventory.types.js";

export function toInventoryOverviewItemDto(item: InventoryOverviewItem): InventoryOverviewItemDto {
  return {
    productId: item.productId,
    productName: item.productName,
    category: item.category,
    quantityRemaining: item.quantityRemaining,
    unit: item.unit,
    lotsCount: item.lotsCount,
    nearestExpiryDate: item.nearestExpiryDate
  };
}

export function toInventoryLotDto(lot: InventoryLot): InventoryLotDto {
  return {
    id: lot.id,
    productId: lot.productId,
    quantityInitial: lot.quantityInitial,
    quantityRemaining: lot.quantityRemaining,
    unit: lot.unit,
    purchaseDate: lot.purchaseDate,
    expiryDate: lot.expiryDate,
    batchNumber: lot.batchNumber,
    notes: lot.notes,
    archivedAt: toNullableIsoString(lot.archivedAt),
    createdAt: lot.createdAt.toISOString(),
    updatedAt: lot.updatedAt.toISOString()
  };
}

export function toInventoryMovementDto(movement: InventoryMovement): InventoryMovementDto {
  return {
    id: movement.id,
    productId: movement.productId,
    inventoryLotId: movement.inventoryLotId,
    movementType: movement.movementType,
    quantity: movement.quantity,
    unit: movement.unit,
    activityId: movement.activityId,
    occurredAt: movement.occurredAt.toISOString(),
    notes: movement.notes,
    createdAt: movement.createdAt.toISOString()
  };
}

export function toCreateInventoryLotDto(result: CreateInventoryLotResult): CreateInventoryLotDto {
  return {
    lot: { id: result.lot.id },
    movement: { id: result.movement.id }
  };
}

export function toManualInventoryAdjustmentDto(result: ManualInventoryAdjustmentResult): ManualInventoryAdjustmentDto {
  return {
    movement: { id: result.movement.id },
    lot: {
      id: result.lot.id,
      quantityRemaining: result.lot.quantityRemaining
    }
  };
}

function toNullableIsoString(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}
