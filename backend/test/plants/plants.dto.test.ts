import { describe, expect, it } from "vitest";

import { toPlantDetailDto, toPlantListItemDto, toPlantMutationDto } from "../../src/modules/plants/plants.dto.js";
import type { PlantRow } from "../../src/modules/plants/plants.types.js";

const createdAt = new Date("2026-05-18T10:00:00.000Z");
const updatedAt = new Date("2026-05-18T11:00:00.000Z");

describe("plants DTO mapping", () => {
  it("maps database snake_case fields to list camelCase fields", () => {
    expect(toPlantListItemDto(createPlantRow())).toEqual({
      id: "123e4567-e89b-12d3-a456-426614174000",
      commonName: "Tomato",
      variety: "Roma",
      plantCategory: "vegetable",
      lifecycleType: "annual",
      growingStyle: "vegetable",
      notes: "Seed indoors",
      archivedAt: null
    });
  });

  it("maps detail timestamps", () => {
    expect(toPlantDetailDto(createPlantRow())).toMatchObject({
      createdAt: "2026-05-18T10:00:00.000Z",
      updatedAt: "2026-05-18T11:00:00.000Z"
    });
  });

  it("maps mutation responses to canonical id", () => {
    expect(toPlantMutationDto(createPlantRow())).toEqual({
      id: "123e4567-e89b-12d3-a456-426614174000"
    });
  });
});

function createPlantRow(): PlantRow {
  return {
    id: "123e4567-e89b-12d3-a456-426614174000",
    account_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    common_name: "Tomato",
    variety: "Roma",
    plant_category: "vegetable",
    lifecycle_type: "annual",
    growing_style: "vegetable",
    notes: "Seed indoors",
    created_at: createdAt,
    updated_at: updatedAt,
    archived_at: null
  };
}
