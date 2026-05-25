import { PagedFilter } from '../garden-structure-api.types';

export const PRODUCT_CATEGORIES = [
  'insecticide',
  'fungicide',
  'pesticide',
  'fertilizer',
  'foliar_fertilizer',
  'biostimulant',
  'soil_amendment',
  'other_preparation',
] as const;

export const PRODUCT_UNITS = ['ml', 'l', 'g', 'kg'] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export interface ProductStockSummary {
  readonly quantityRemaining: number;
  readonly unit: ProductUnit;
}

export interface ProductInventorySummary extends ProductStockSummary {
  readonly lotsCount: number;
  readonly expiredLotsCount: number;
}

export interface ProductListItem {
  readonly id: string;
  readonly name: string;
  readonly category: ProductCategory;
  readonly activeSubstance: string | null;
  readonly manufacturer: string | null;
  readonly formulation: string | null;
  readonly defaultUnit: ProductUnit;
  readonly stockSummary: ProductStockSummary;
  readonly rulesCount: number;
  readonly archivedAt: string | null;
}

export interface ProductUsageRule {
  readonly id: string;
  readonly productId: string;
  readonly plantId: string;
  readonly doseValue: number;
  readonly doseUnit: ProductUnit;
  readonly dilutionText: string | null;
  readonly applicationMethod: string | null;
  readonly reapplicationIntervalDays: number | null;
  readonly quarantinePeriodDays: number | null;
  readonly notes: string | null;
  readonly archivedAt: string | null;
}

export interface ProductUsageRuleDetail extends ProductUsageRule {
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProductRecentMovement {
  readonly id: string;
  readonly productId: string;
  readonly inventoryLotId: string | null;
  readonly movementType: 'purchase' | 'manual_adjustment' | 'consumption' | 'correction';
  readonly quantity: number;
  readonly unit: ProductUnit;
  readonly activityId: string | null;
  readonly occurredAt: string;
  readonly notes: string | null;
  readonly createdAt: string;
}

export interface ProductDetail extends ProductListItem {
  readonly notes: string | null;
  readonly usageRules: readonly ProductUsageRule[];
  readonly inventorySummary: ProductInventorySummary;
  readonly recentMovements: readonly ProductRecentMovement[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ListProductsFilters extends PagedFilter {
  readonly q?: string;
  readonly category?: ProductCategory;
  readonly includeArchived?: boolean;
}

export interface CreateProductRequest {
  readonly name: string;
  readonly category: ProductCategory;
  readonly activeSubstance?: string | null;
  readonly manufacturer?: string | null;
  readonly formulation?: string | null;
  readonly defaultUnit: ProductUnit;
  readonly notes?: string | null;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface CreateProductUsageRuleRequest {
  readonly plantId: string;
  readonly doseValue: number;
  readonly doseUnit: ProductUnit;
  readonly dilutionText?: string | null;
  readonly applicationMethod?: string | null;
  readonly reapplicationIntervalDays?: number | null;
  readonly quarantinePeriodDays?: number | null;
  readonly notes?: string | null;
}

export type UpdateProductUsageRuleRequest = Partial<CreateProductUsageRuleRequest>;
