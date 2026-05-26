import type { Selectable } from "kysely";

import type { InventoryLotsTable, InventoryMovementsTable, InventoryProductBalancesView } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import { PRODUCT_CATEGORIES, SIMPLE_UNITS, type ProductCategory, type SimpleUnit } from "../products/products.types.js";

export { PRODUCT_CATEGORIES, SIMPLE_UNITS, type ProductCategory, type SimpleUnit };

export const INVENTORY_MOVEMENT_TYPES = ["purchase", "manual_adjustment", "consumption", "correction"] as const;
export const MANUAL_ADJUSTMENT_MOVEMENT_TYPES = ["manual_adjustment", "correction"] as const;
export const INVENTORY_ADJUSTMENT_DIRECTIONS = ["increase", "decrease"] as const;

export type InventoryMovementType = (typeof INVENTORY_MOVEMENT_TYPES)[number];
export type ManualAdjustmentMovementType = (typeof MANUAL_ADJUSTMENT_MOVEMENT_TYPES)[number];
export type InventoryAdjustmentDirection = (typeof INVENTORY_ADJUSTMENT_DIRECTIONS)[number];

export type InventoryLotRow = Selectable<InventoryLotsTable>;
export type InventoryMovementRow = Selectable<InventoryMovementsTable>;
export type InventoryProductBalanceRow = Selectable<InventoryProductBalancesView>;
export type InventoryOverviewItem = {
  productId: UUID;
  productName: string;
  category: ProductCategory;
  quantityRemaining: number;
  unit: SimpleUnit;
  lotsCount: number;
  nearestExpiryDate: string | null;
};

export type InventoryLot = {
  id: UUID;
  accountId: UUID;
  productId: UUID;
  quantityInitial: number;
  quantityRemaining: number;
  unit: SimpleUnit;
  purchaseDate: string | null;
  expiryDate: string | null;
  batchNumber: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type InventoryMovement = {
  id: UUID;
  accountId: UUID;
  productId: UUID;
  inventoryLotId: UUID | null;
  movementType: InventoryMovementType;
  quantity: number;
  unit: SimpleUnit;
  activityId: UUID | null;
  occurredAt: Date;
  notes: string | null;
  createdAt: Date;
};

export type ListInventoryFilters = {
  q?: string;
  category?: ProductCategory;
  lowStockOnly: boolean;
  expiringBefore?: string;
  page: number;
  pageSize: number;
};

export type ListInventoryLotsFilters = {
  page: number;
  pageSize: number;
};

export type ListInventoryMovementsFilters = {
  from?: Date;
  to?: Date;
  movementType?: InventoryMovementType;
  page: number;
  pageSize: number;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateInventoryLotInput = {
  accountId: UUID;
  productId: UUID;
  quantityInitial: number;
  unit: SimpleUnit;
  purchaseDate?: string | null;
  expiryDate?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
};

export type CreateInventoryMovementInput = {
  accountId: UUID;
  productId: UUID;
  inventoryLotId?: UUID | null;
  movementType: InventoryMovementType;
  quantity: number;
  unit: SimpleUnit;
  activityId?: UUID | null;
  occurredAt: Date;
  notes?: string | null;
};

export type ManualInventoryAdjustmentInput = {
  productId: UUID;
  inventoryLotId: UUID;
  quantity: number;
  unit: SimpleUnit;
  movementType: ManualAdjustmentMovementType;
  direction: InventoryAdjustmentDirection;
  notes?: string | null;
};

export type CreateInventoryLotResult = {
  lot: InventoryLot;
  movement: InventoryMovement;
};

export type ManualInventoryAdjustmentResult = {
  movement: InventoryMovement;
  lot: InventoryLot;
};

export type AllocationCandidateLot = Pick<
  InventoryLot,
  "id" | "productId" | "quantityRemaining" | "unit" | "purchaseDate" | "expiryDate" | "createdAt"
>;

export type InventoryAllocationInput = {
  requestedQuantity: number;
  unit: SimpleUnit;
  lots: AllocationCandidateLot[];
};

export type InventoryAllocation = {
  inventoryLotId: UUID;
  quantity: number;
  unit: SimpleUnit;
};

export type InventoryAllocationResult = {
  allocations: InventoryAllocation[];
  coveredQuantity: number;
  uncoveredQuantity: number;
  unit: SimpleUnit;
};

export type InventoryShortageDecision = {
  allowed: boolean;
  coveredQuantity: number;
  uncoveredQuantity: number;
  shouldReject: boolean;
};

export type InventoryOverviewItemDto = InventoryOverviewItem;

export type InventoryLotDto = {
  id: UUID;
  productId: UUID;
  quantityInitial: number;
  quantityRemaining: number;
  unit: SimpleUnit;
  purchaseDate: string | null;
  expiryDate: string | null;
  batchNumber: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryMovementDto = {
  id: UUID;
  productId: UUID;
  inventoryLotId: UUID | null;
  movementType: InventoryMovementType;
  quantity: number;
  unit: SimpleUnit;
  activityId: UUID | null;
  occurredAt: string;
  notes: string | null;
  createdAt: string;
};

export type CreateInventoryLotDto = {
  lot: { id: UUID };
  movement: { id: UUID };
};

export type ManualInventoryAdjustmentDto = {
  movement: { id: UUID };
  lot: { id: UUID; quantityRemaining: number };
};

export interface InventoryRepository {
  listOverview(accountId: UUID, filters: ListInventoryFilters, db?: DbHandle): Promise<PaginatedResult<InventoryOverviewItem>>;
  listLotsByProduct(
    accountId: UUID,
    productId: UUID,
    filters: ListInventoryLotsFilters,
    db?: DbHandle
  ): Promise<PaginatedResult<InventoryLot>>;
  findLotById(accountId: UUID, lotId: UUID, db?: DbHandle): Promise<InventoryLot | null>;
  listMovementsByProduct(
    accountId: UUID,
    productId: UUID,
    filters: ListInventoryMovementsFilters,
    db?: DbHandle
  ): Promise<PaginatedResult<InventoryMovement>>;
  listConsumableLotsForProduct(accountId: UUID, productId: UUID, db?: DbHandle): Promise<InventoryLot[]>;
  findMovementById(accountId: UUID, movementId: UUID, db?: DbHandle): Promise<InventoryMovement | null>;
  createLot(input: CreateInventoryLotInput, db?: DbHandle): Promise<InventoryLot>;
  createMovement(input: CreateInventoryMovementInput, db?: DbHandle): Promise<InventoryMovement>;
  updateLotRemainingQuantity(
    accountId: UUID,
    lotId: UUID,
    quantityRemaining: number,
    db?: DbHandle
  ): Promise<InventoryLot | null>;
  decrementLotRemainingQuantity(
    accountId: UUID,
    lotId: UUID,
    quantity: number,
    db?: DbHandle
  ): Promise<InventoryLot | null>;
}
