import { ApiListData } from '../../core/api/api.types';
import { PagedFilter } from '../garden-structure-api.types';
import { ProductCategory, ProductUnit } from '../products/products.models';

export const INVENTORY_MOVEMENT_TYPES = [
  'purchase',
  'manual_adjustment',
  'consumption',
  'correction',
] as const;

export const INVENTORY_ADJUSTMENT_DIRECTIONS = ['increase', 'decrease'] as const;

export type InventoryMovementType = (typeof INVENTORY_MOVEMENT_TYPES)[number];
export type InventoryAdjustmentDirection = (typeof INVENTORY_ADJUSTMENT_DIRECTIONS)[number];

export interface InventoryOverviewItem {
  readonly productId: string;
  readonly productName: string;
  readonly category: ProductCategory;
  readonly quantityRemaining: number;
  readonly unit: ProductUnit;
  readonly lotsCount: number;
  readonly nearestExpiryDate: string | null;
}

export interface InventoryLot {
  readonly id: string;
  readonly productId: string;
  readonly quantityInitial: number;
  readonly quantityRemaining: number;
  readonly unit: ProductUnit;
  readonly purchaseDate: string | null;
  readonly expiryDate: string | null;
  readonly batchNumber: string | null;
  readonly notes: string | null;
  readonly archivedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface InventoryMovement {
  readonly id: string;
  readonly productId: string;
  readonly inventoryLotId: string | null;
  readonly movementType: InventoryMovementType;
  readonly quantity: number;
  readonly unit: ProductUnit;
  readonly activityId: string | null;
  readonly occurredAt: string;
  readonly notes: string | null;
  readonly createdAt: string;
}

export interface ListInventoryFilters extends PagedFilter {
  readonly q?: string;
  readonly category?: ProductCategory;
  readonly lowStockOnly?: boolean;
  readonly expiringBefore?: string;
}

export type ListInventoryLotsFilters = PagedFilter;

export interface ListInventoryMovementsFilters extends PagedFilter {
  readonly from?: string;
  readonly to?: string;
  readonly movementType?: InventoryMovementType;
}

export interface CreateInventoryLotRequest {
  readonly quantityInitial: number;
  readonly unit: ProductUnit;
  readonly purchaseDate?: string | null;
  readonly expiryDate?: string | null;
  readonly batchNumber?: string | null;
  readonly notes?: string | null;
}

export interface CreateInventoryLotResult {
  readonly lot: { readonly id: string };
  readonly movement: { readonly id: string };
}

export interface ManualInventoryAdjustmentRequest {
  readonly productId: string;
  readonly inventoryLotId?: string | null;
  readonly quantity: number;
  readonly unit: ProductUnit;
  readonly movementType: 'manual_adjustment' | 'correction';
  readonly direction: InventoryAdjustmentDirection;
  readonly notes?: string | null;
}

export interface ManualInventoryAdjustmentResult {
  readonly movement: { readonly id: string };
  readonly lot: {
    readonly id: string;
    readonly quantityRemaining: number;
  };
}

export type InventoryOverviewData = ApiListData<InventoryOverviewItem>;
export type InventoryLotsData = ApiListData<InventoryLot>;
export type InventoryMovementsData = ApiListData<InventoryMovement>;
