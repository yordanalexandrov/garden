import type {
  Product,
  ProductDetail,
  ProductDetailDto,
  ProductListItem,
  ProductListItemDto,
  ProductMutationDto,
  ProductRow,
  ProductUsageRule,
  ProductUsageRuleDetailDto,
  ProductUsageRuleDto,
  ProductUsageRuleMutationDto,
  ProductUsageRuleRow,
  SimpleUnit
} from "./products.types.js";

type ProductUsageRuleDtoSource = ProductUsageRule | ProductUsageRuleRow;

export function toProductListItemDto(product: ProductListItem): ProductListItemDto {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    activeSubstance: product.activeSubstance,
    manufacturer: product.manufacturer,
    formulation: product.formulation,
    defaultUnit: product.defaultUnit,
    stockSummary: {
      quantityRemaining: 0,
      unit: product.defaultUnit
    },
    rulesCount: product.rulesCount,
    archivedAt: toNullableIsoString(product.archivedAt)
  };
}

export function toProductDetailDto(product: ProductDetail): ProductDetailDto {
  return {
    ...toProductListItemDto({
      ...product,
      rulesCount: product.usageRules.filter((rule) => rule.archivedAt === null).length
    }),
    notes: product.notes,
    usageRules: product.usageRules.map(toProductUsageRuleDto),
    inventorySummary: {
      quantityRemaining: 0,
      unit: product.defaultUnit,
      lotsCount: 0,
      expiredLotsCount: 0
    },
    recentMovements: [],
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

export function toProductMutationDto(product: Pick<Product, "id"> | Pick<ProductRow, "id">): ProductMutationDto {
  return {
    id: product.id
  };
}

export function toProductUsageRuleDto(rule: ProductUsageRuleDtoSource): ProductUsageRuleDto {
  return {
    id: rule.id,
    productId: productIdOf(rule),
    plantId: plantIdOf(rule),
    doseValue: doseValueOf(rule),
    doseUnit: doseUnitOf(rule),
    dilutionText: dilutionTextOf(rule),
    applicationMethod: applicationMethodOf(rule),
    reapplicationIntervalDays: reapplicationIntervalDaysOf(rule),
    quarantinePeriodDays: quarantinePeriodDaysOf(rule),
    notes: rule.notes,
    archivedAt: toNullableIsoString(archivedAtOf(rule))
  };
}

export function toProductUsageRuleDetailDto(rule: ProductUsageRuleDtoSource): ProductUsageRuleDetailDto {
  return {
    ...toProductUsageRuleDto(rule),
    createdAt: createdAtOf(rule).toISOString(),
    updatedAt: updatedAtOf(rule).toISOString()
  };
}

export function toProductUsageRuleMutationDto(
  rule: Pick<ProductUsageRule, "id"> | Pick<ProductUsageRuleRow, "id">
): ProductUsageRuleMutationDto {
  return {
    id: rule.id
  };
}

function isProductUsageRuleRow(value: ProductUsageRuleDtoSource): value is ProductUsageRuleRow {
  return "product_id" in value;
}

function productIdOf(rule: ProductUsageRuleDtoSource): string {
  return isProductUsageRuleRow(rule) ? rule.product_id : rule.productId;
}

function plantIdOf(rule: ProductUsageRuleDtoSource): string {
  return isProductUsageRuleRow(rule) ? rule.plant_id : rule.plantId;
}

function doseValueOf(rule: ProductUsageRuleDtoSource): number {
  return isProductUsageRuleRow(rule) ? Number(rule.dose_value) : rule.doseValue;
}

function doseUnitOf(rule: ProductUsageRuleDtoSource): SimpleUnit {
  return isProductUsageRuleRow(rule) ? (rule.dose_unit as SimpleUnit) : rule.doseUnit;
}

function dilutionTextOf(rule: ProductUsageRuleDtoSource): string | null {
  return isProductUsageRuleRow(rule) ? rule.dilution_text : rule.dilutionText;
}

function applicationMethodOf(rule: ProductUsageRuleDtoSource): string | null {
  return isProductUsageRuleRow(rule) ? rule.application_method : rule.applicationMethod;
}

function reapplicationIntervalDaysOf(rule: ProductUsageRuleDtoSource): number | null {
  return isProductUsageRuleRow(rule) ? rule.reapplication_interval_days : rule.reapplicationIntervalDays;
}

function quarantinePeriodDaysOf(rule: ProductUsageRuleDtoSource): number | null {
  return isProductUsageRuleRow(rule) ? rule.quarantine_period_days : rule.quarantinePeriodDays;
}

function createdAtOf(rule: ProductUsageRuleDtoSource): Date {
  return isProductUsageRuleRow(rule) ? rule.created_at : rule.createdAt;
}

function updatedAtOf(rule: ProductUsageRuleDtoSource): Date {
  return isProductUsageRuleRow(rule) ? rule.updated_at : rule.updatedAt;
}

function archivedAtOf(rule: ProductUsageRuleDtoSource): Date | null {
  return isProductUsageRuleRow(rule) ? rule.archived_at : rule.archivedAt;
}

function toNullableIsoString(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}
