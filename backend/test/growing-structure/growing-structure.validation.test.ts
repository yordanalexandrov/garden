import { describe, expect, it } from "vitest";

import { createBedBodySchema, listBedsQuerySchema } from "../../src/modules/beds/beds.validation.js";
import {
  createPersistentBedPlantBodySchema,
  listPersistentBedPlantsQuerySchema
} from "../../src/modules/plantings/persistent-bed-plants.validation.js";
import {
  createYearlyBedPlantingBodySchema,
  listYearlyBedPlantingsQuerySchema
} from "../../src/modules/plantings/yearly-bed-plantings.validation.js";
import {
  createPerennialBodySchema,
  listPerennialsQuerySchema
} from "../../src/modules/perennials/perennials.validation.js";

const validPlantId = "123e4567-e89b-12d3-a456-426614174000";

describe("growing structure validation", () => {
  it("accepts canonical perennial status values and rejects invalid statuses", () => {
    expect(listPerennialsQuerySchema.parse({ status: "active" }).status).toBe("active");
    expect(listPerennialsQuerySchema.parse({ status: "removed" }).status).toBe("removed");
    expect(listPerennialsQuerySchema.parse({ status: "dead" }).status).toBe("dead");
    expect(listPerennialsQuerySchema.parse({ status: "archived" }).status).toBe("archived");
    expect(listPerennialsQuerySchema.safeParse({ status: "inactive" }).success).toBe(false);
  });

  it("accepts positive bed dimensions and rejects zero or negative dimensions", () => {
    expect(
      createBedBodySchema.parse({
        name: "Bed A",
        widthM: 1.2,
        lengthM: 4,
        areaM2: 4.8
      })
    ).toMatchObject({
      widthM: 1.2,
      lengthM: 4,
      areaM2: 4.8
    });

    expect(createBedBodySchema.safeParse({ name: "Bed A", widthM: 0 }).success).toBe(false);
    expect(createBedBodySchema.safeParse({ name: "Bed A", lengthM: -1 }).success).toBe(false);
    expect(createBedBodySchema.safeParse({ name: "Bed A", areaM2: 0 }).success).toBe(false);
  });

  it("accepts non-negative persistent bed plant quantity and rejects negative quantity", () => {
    expect(
      createPersistentBedPlantBodySchema.parse({
        plantId: validPlantId,
        quantity: 0
      }).quantity
    ).toBe(0);

    expect(
      createPersistentBedPlantBodySchema.safeParse({
        plantId: validPlantId,
        quantity: -1
      }).success
    ).toBe(false);
  });

  it("accepts canonical yearly bed planting status values and rejects invalid statuses", () => {
    for (const status of ["planned", "planted", "removed", "harvested", "archived"]) {
      expect(
        createYearlyBedPlantingBodySchema.parse({
          plantId: validPlantId,
          year: 2026,
          status
        }).status
      ).toBe(status);
    }

    expect(
      createYearlyBedPlantingBodySchema.safeParse({
        plantId: validPlantId,
        year: 2026,
        status: "growing"
      }).success
    ).toBe(false);
  });

  it("rejects years outside the migration-backed 1900 through 3000 range", () => {
    expect(
      createPerennialBodySchema.safeParse({
        plantId: validPlantId,
        plantedYear: 1899
      }).success
    ).toBe(false);
    expect(
      createYearlyBedPlantingBodySchema.safeParse({
        plantId: validPlantId,
        year: 3001,
        status: "planted"
      }).success
    ).toBe(false);
    expect(
      createYearlyBedPlantingBodySchema.parse({
        plantId: validPlantId,
        year: 1900,
        status: "planted"
      }).year
    ).toBe(1900);
    expect(
      createYearlyBedPlantingBodySchema.parse({
        plantId: validPlantId,
        year: 3000,
        status: "planted"
      }).year
    ).toBe(3000);
  });

  it("parses pagination defaults and enforces the max page size", () => {
    expect(listPersistentBedPlantsQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20
    });
    expect(listYearlyBedPlantingsQuerySchema.parse({ page: "2", pageSize: "100", year: "2026" })).toEqual({
      page: 2,
      pageSize: 100,
      year: 2026
    });
    expect(listBedsQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });
});
