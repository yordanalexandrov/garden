import { describe, expect, it } from "vitest";

import {
  createPlaceBodySchema,
  listPlacesQuerySchema,
  placeParamsSchema,
  updatePlaceBodySchema
} from "../../src/modules/places/places.validation.js";

const validPlaceId = "123e4567-e89b-12d3-a456-426614174000";

describe("places validation", () => {
  it("accepts disabled weather without weather location fields", () => {
    const parsed = createPlaceBodySchema.parse({
      name: "Home Garden",
      weatherEnabled: false
    });

    expect(parsed).toMatchObject({
      name: "Home Garden",
      weatherEnabled: false
    });
  });

  it("defaults weatherEnabled to false for place creation", () => {
    const parsed = createPlaceBodySchema.parse({
      name: "Home Garden"
    });

    expect(parsed.weatherEnabled).toBe(false);
  });

  it("accepts enabled weather with a location label", () => {
    const parsed = createPlaceBodySchema.parse({
      name: "Home Garden",
      weatherEnabled: true,
      weatherLocationLabel: "Ruse, Bulgaria"
    });

    expect(parsed.weatherLocationLabel).toBe("Ruse, Bulgaria");
  });

  it("accepts enabled weather with complete coordinates", () => {
    const parsed = createPlaceBodySchema.parse({
      name: "Home Garden",
      weatherEnabled: true,
      latitude: 43.84,
      longitude: 25.95
    });

    expect(parsed.latitude).toBe(43.84);
    expect(parsed.longitude).toBe(25.95);
  });

  it("rejects enabled weather without label or complete coordinates", () => {
    const parsed = createPlaceBodySchema.safeParse({
      name: "Home Garden",
      weatherEnabled: true,
      latitude: 43.84
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues).toEqual([
      expect.objectContaining({
        path: ["weatherLocationLabel"]
      })
    ]);
  });

  it("parses pagination and includeArchived defaults predictably", () => {
    const parsed = listPlacesQuerySchema.parse({});

    expect(parsed).toEqual({
      page: 1,
      pageSize: 20,
      includeArchived: false
    });
  });

  it("parses boolean includeArchived query strings without truthy string coercion", () => {
    expect(listPlacesQuerySchema.parse({ includeArchived: "false" }).includeArchived).toBe(false);
    expect(listPlacesQuerySchema.parse({ includeArchived: "true" }).includeArchived).toBe(true);
  });

  it("rejects invalid place ids", () => {
    expect(placeParamsSchema.safeParse({ placeId: "not-a-uuid" }).success).toBe(false);
    expect(placeParamsSchema.parse({ placeId: validPlaceId })).toEqual({ placeId: validPlaceId });
  });

  it("requires at least one field for place updates", () => {
    expect(updatePlaceBodySchema.safeParse({}).success).toBe(false);
  });
});
