import { describe, expect, it } from "vitest";

import { toProductDetailDto, toProductListItemDto, toProductUsageRuleDetailDto } from "../../src/modules/products/products.dto.js";
import type { ProductDetail, ProductListItem, ProductUsageRule } from "../../src/modules/products/products.types.js";

const createdAt = new Date("2026-05-25T08:00:00.000Z");
const updatedAt = new Date("2026-05-25T09:00:00.000Z");

describe("products DTO mapping", () => {
  it("maps product list items with placeholder stock summary and camelCase fields", () => {
    const product = createProductListItem();

    expect(toProductListItemDto(product)).toEqual({
      id: product.id,
      name: "Copper Fungicide",
      category: "fungicide",
      activeSubstance: "Copper",
      manufacturer: "Example Co",
      formulation: "WG",
      defaultUnit: "g",
      stockSummary: {
        quantityRemaining: 0,
        unit: "g"
      },
      rulesCount: 2,
      archivedAt: null
    });
  });

  it("maps product detail with usage rules and empty inventory placeholders before Phase 9", () => {
    const product: ProductDetail = {
      ...createProductListItem(),
      usageRules: [createUsageRule()]
    };

    expect(toProductDetailDto(product)).toEqual({
      id: product.id,
      name: "Copper Fungicide",
      category: "fungicide",
      activeSubstance: "Copper",
      manufacturer: "Example Co",
      formulation: "WG",
      defaultUnit: "g",
      stockSummary: {
        quantityRemaining: 0,
        unit: "g"
      },
      rulesCount: 1,
      archivedAt: null,
      notes: "Use with care",
      usageRules: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          productId: product.id,
          plantId: "44444444-4444-4444-8444-444444444444",
          doseValue: 20,
          doseUnit: "g",
          dilutionText: "20 g / 10 l water",
          applicationMethod: "foliar spray",
          reapplicationIntervalDays: 10,
          quarantinePeriodDays: 14,
          notes: "Rule notes",
          archivedAt: null
        }
      ],
      inventorySummary: {
        quantityRemaining: 0,
        unit: "g",
        lotsCount: 0,
        expiredLotsCount: 0
      },
      recentMovements: [],
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    });
  });

  it("maps product usage rule detail timestamps", () => {
    expect(toProductUsageRuleDetailDto(createUsageRule())).toMatchObject({
      id: "33333333-3333-4333-8333-333333333333",
      doseValue: 20,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    });
  });
});

function createProductListItem(): ProductListItem {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    accountId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "Copper Fungicide",
    category: "fungicide",
    activeSubstance: "Copper",
    manufacturer: "Example Co",
    formulation: "WG",
    defaultUnit: "g",
    notes: "Use with care",
    createdAt,
    updatedAt,
    archivedAt: null,
    rulesCount: 2
  };
}

function createUsageRule(): ProductUsageRule {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    accountId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    productId: "11111111-1111-4111-8111-111111111111",
    plantId: "44444444-4444-4444-8444-444444444444",
    doseValue: 20,
    doseUnit: "g",
    dilutionText: "20 g / 10 l water",
    applicationMethod: "foliar spray",
    reapplicationIntervalDays: 10,
    quarantinePeriodDays: 14,
    notes: "Rule notes",
    createdAt,
    updatedAt,
    archivedAt: null
  };
}
