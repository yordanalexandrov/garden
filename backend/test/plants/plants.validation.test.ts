import { describe, expect, it } from "vitest";

import {
  createPlantBodySchema,
  listPlantsQuerySchema,
  plantParamsSchema,
  updatePlantBodySchema
} from "../../src/modules/plants/plants.validation.js";

const validPlantId = "123e4567-e89b-12d3-a456-426614174000";

describe("plants validation", () => {
  it("accepts canonical lifecycle and growing style values", () => {
    const parsed = createPlantBodySchema.parse({
      commonName: "Tomato",
      lifecycleType: "annual",
      growingStyle: "vegetable"
    });

    expect(parsed).toMatchObject({
      commonName: "Tomato",
      lifecycleType: "annual",
      growingStyle: "vegetable"
    });
  });

  it("rejects non-canonical lifecycle values", () => {
    const parsed = createPlantBodySchema.safeParse({
      commonName: "Tomato",
      lifecycleType: "seasonal",
      growingStyle: "vegetable"
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects non-canonical growing style values", () => {
    const parsed = createPlantBodySchema.safeParse({
      commonName: "Tomato",
      lifecycleType: "annual",
      growingStyle: "crop"
    });

    expect(parsed.success).toBe(false);
  });

  it("parses filter defaults and trims q", () => {
    const parsed = listPlantsQuerySchema.parse({
      q: " tomato ",
      lifecycleType: "annual",
      growingStyle: "vegetable"
    });

    expect(parsed).toEqual({
      q: "tomato",
      lifecycleType: "annual",
      growingStyle: "vegetable",
      page: 1,
      pageSize: 20,
      includeArchived: false
    });
  });

  it("rejects invalid plant ids", () => {
    expect(plantParamsSchema.safeParse({ plantId: "not-a-uuid" }).success).toBe(false);
    expect(plantParamsSchema.parse({ plantId: validPlantId })).toEqual({ plantId: validPlantId });
  });

  it("requires at least one field for plant updates", () => {
    expect(updatePlantBodySchema.safeParse({}).success).toBe(false);
  });
});
