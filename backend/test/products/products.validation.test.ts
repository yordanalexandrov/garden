import { describe, expect, it } from "vitest";

import {
  createProductBodySchema,
  createProductUsageRuleBodySchema,
  listProductsQuerySchema,
  productParamsSchema,
  productUsageRuleParamsSchema,
  updateProductBodySchema,
  updateProductUsageRuleBodySchema
} from "../../src/modules/products/products.validation.js";

const validProductId = "123e4567-e89b-12d3-a456-426614174000";
const validRuleId = "223e4567-e89b-12d3-a456-426614174000";
const validPlantId = "323e4567-e89b-12d3-a456-426614174000";

describe("products validation", () => {
  it("accepts canonical product categories and simple units", () => {
    const parsed = createProductBodySchema.parse({
      name: "Copper Fungicide",
      category: "fungicide",
      activeSubstance: "Copper",
      manufacturer: "Example Co",
      formulation: "WG",
      defaultUnit: "g",
      notes: ""
    });

    expect(parsed).toMatchObject({
      name: "Copper Fungicide",
      category: "fungicide",
      defaultUnit: "g"
    });
  });

  it("rejects invalid product categories and simple units", () => {
    expect(
      createProductBodySchema.safeParse({
        name: "Copper Fungicide",
        category: "fungal",
        defaultUnit: "oz"
      }).success
    ).toBe(false);
  });

  it("parses product list filters with defaults", () => {
    const parsed = listProductsQuerySchema.parse({
      q: " copper ",
      category: "fungicide",
      includeArchived: "true",
      page: "2",
      pageSize: "10"
    });

    expect(parsed).toEqual({
      q: "copper",
      category: "fungicide",
      includeArchived: true,
      page: 2,
      pageSize: 10
    });
  });

  it("requires at least one field for product updates", () => {
    expect(updateProductBodySchema.safeParse({}).success).toBe(false);
    expect(updateProductBodySchema.safeParse({ notes: null }).success).toBe(true);
  });

  it("validates product and rule UUID params", () => {
    expect(productParamsSchema.parse({ productId: validProductId })).toEqual({ productId: validProductId });
    expect(productUsageRuleParamsSchema.parse({ ruleId: validRuleId })).toEqual({ ruleId: validRuleId });
    expect(productParamsSchema.safeParse({ productId: "not-a-uuid" }).success).toBe(false);
    expect(productUsageRuleParamsSchema.safeParse({ ruleId: "not-a-uuid" }).success).toBe(false);
  });

  it("validates product usage rule dose, unit, and intervals", () => {
    expect(
      createProductUsageRuleBodySchema.parse({
        plantId: validPlantId,
        doseValue: 20,
        doseUnit: "g",
        dilutionText: "20 g / 10 l water",
        applicationMethod: "foliar spray",
        reapplicationIntervalDays: null,
        quarantinePeriodDays: 14,
        notes: ""
      })
    ).toMatchObject({
      plantId: validPlantId,
      doseValue: 20,
      doseUnit: "g",
      reapplicationIntervalDays: null,
      quarantinePeriodDays: 14
    });

    expect(
      createProductUsageRuleBodySchema.safeParse({
        plantId: validPlantId,
        doseValue: 0,
        doseUnit: "g"
      }).success
    ).toBe(false);
    expect(
      createProductUsageRuleBodySchema.safeParse({
        plantId: validPlantId,
        doseValue: 20,
        doseUnit: "oz"
      }).success
    ).toBe(false);
    expect(
      createProductUsageRuleBodySchema.safeParse({
        plantId: validPlantId,
        doseValue: 20,
        doseUnit: "g",
        reapplicationIntervalDays: -1
      }).success
    ).toBe(false);
  });

  it("requires at least one field for product usage rule updates", () => {
    expect(updateProductUsageRuleBodySchema.safeParse({}).success).toBe(false);
    expect(updateProductUsageRuleBodySchema.safeParse({ quarantinePeriodDays: null }).success).toBe(true);
  });
});
