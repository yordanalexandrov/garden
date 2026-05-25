import type { Selectable } from "kysely";

import type { ProductUsageRulesTable, ProductsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";

export const PRODUCT_CATEGORIES = [
  "insecticide",
  "fungicide",
  "pesticide",
  "fertilizer",
  "foliar_fertilizer",
  "biostimulant",
  "soil_amendment",
  "other_preparation"
] as const;

export const SIMPLE_UNITS = ["ml", "l", "g", "kg"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type SimpleUnit = (typeof SIMPLE_UNITS)[number];
export type ProductRow = Selectable<ProductsTable>;
export type ProductUsageRuleRow = Selectable<ProductUsageRulesTable>;

export type Product = {
  id: UUID;
  accountId: UUID;
  name: string;
  category: ProductCategory;
  activeSubstance: string | null;
  manufacturer: string | null;
  formulation: string | null;
  defaultUnit: SimpleUnit;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type ProductListItem = Product & {
  rulesCount: number;
};

export type ProductDetail = Product & {
  usageRules: ProductUsageRule[];
};

export type CreateProductInput = {
  accountId: UUID;
  name: string;
  category: ProductCategory;
  activeSubstance?: string | null;
  manufacturer?: string | null;
  formulation?: string | null;
  defaultUnit: SimpleUnit;
  notes?: string | null;
};

export type UpdateProductInput = Partial<Omit<CreateProductInput, "accountId">>;

export type ListProductsFilters = {
  q?: string;
  category?: ProductCategory;
  includeArchived: boolean;
  page: number;
  pageSize: number;
};

export type PaginatedProducts = {
  items: ProductListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type ProductUsageRule = {
  id: UUID;
  accountId: UUID;
  productId: UUID;
  plantId: UUID;
  doseValue: number;
  doseUnit: SimpleUnit;
  dilutionText: string | null;
  applicationMethod: string | null;
  reapplicationIntervalDays: number | null;
  quarantinePeriodDays: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type CreateProductUsageRuleInput = {
  accountId: UUID;
  productId: UUID;
  plantId: UUID;
  doseValue: number;
  doseUnit: SimpleUnit;
  dilutionText?: string | null;
  applicationMethod?: string | null;
  reapplicationIntervalDays?: number | null;
  quarantinePeriodDays?: number | null;
  notes?: string | null;
};

export type UpdateProductUsageRuleInput = Partial<Omit<CreateProductUsageRuleInput, "accountId" | "productId">>;

export type ProductStockSummaryDto = {
  quantityRemaining: number;
  unit: SimpleUnit;
};

export type ProductInventorySummaryDto = ProductStockSummaryDto & {
  lotsCount: number;
  expiredLotsCount: number;
};

export type ProductRecentMovementDto = {
  id: UUID;
  quantity: number;
  unit: SimpleUnit;
  occurredAt: string;
};

export type ProductUsageRuleDto = {
  id: UUID;
  productId: UUID;
  plantId: UUID;
  doseValue: number;
  doseUnit: SimpleUnit;
  dilutionText: string | null;
  applicationMethod: string | null;
  reapplicationIntervalDays: number | null;
  quarantinePeriodDays: number | null;
  notes: string | null;
  archivedAt: string | null;
};

export type ProductUsageRuleDetailDto = ProductUsageRuleDto & {
  createdAt: string;
  updatedAt: string;
};

export type ProductUsageRuleMutationDto = {
  id: UUID;
};

export type ProductListItemDto = {
  id: UUID;
  name: string;
  category: ProductCategory;
  activeSubstance: string | null;
  manufacturer: string | null;
  formulation: string | null;
  defaultUnit: SimpleUnit;
  stockSummary: ProductStockSummaryDto;
  rulesCount: number;
  archivedAt: string | null;
};

export type ProductDetailDto = ProductListItemDto & {
  notes: string | null;
  usageRules: ProductUsageRuleDto[];
  inventorySummary: ProductInventorySummaryDto;
  recentMovements: ProductRecentMovementDto[];
  createdAt: string;
  updatedAt: string;
};

export type ProductMutationDto = {
  id: UUID;
};

export interface ProductsRepository {
  list(accountId: UUID, filters: ListProductsFilters, db?: DbHandle): Promise<PaginatedProducts>;
  findById(accountId: UUID, productId: UUID, db?: DbHandle): Promise<Product | null>;
  create(input: CreateProductInput, db?: DbHandle): Promise<Product>;
  update(accountId: UUID, productId: UUID, patch: UpdateProductInput, db?: DbHandle): Promise<Product | null>;
  archive(accountId: UUID, productId: UUID, db?: DbHandle): Promise<boolean>;

  listUsageRules(accountId: UUID, productId: UUID, db?: DbHandle): Promise<ProductUsageRule[]>;
  findUsageRuleById(accountId: UUID, ruleId: UUID, db?: DbHandle): Promise<ProductUsageRule | null>;
  findActiveUsageRuleForProductPlant(
    accountId: UUID,
    productId: UUID,
    plantId: UUID,
    excludeRuleId?: UUID,
    db?: DbHandle
  ): Promise<ProductUsageRule | null>;
  createUsageRule(input: CreateProductUsageRuleInput, db?: DbHandle): Promise<ProductUsageRule>;
  updateUsageRule(
    accountId: UUID,
    ruleId: UUID,
    patch: UpdateProductUsageRuleInput,
    db?: DbHandle
  ): Promise<ProductUsageRule | null>;
  archiveUsageRule(accountId: UUID, ruleId: UUID, db?: DbHandle): Promise<boolean>;
}
