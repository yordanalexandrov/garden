import { describe, expect, it } from "vitest";

import { toBedCurrentContentsDto, toBedDetailDto, toBedListItemDto } from "../../src/modules/beds/beds.dto.js";
import type { BedCurrentContentsRow, BedRow } from "../../src/modules/beds/beds.types.js";
import {
  toPersistentBedPlantDetailDto,
  toPersistentBedPlantListItemDto
} from "../../src/modules/plantings/persistent-bed-plants.dto.js";
import type { PersistentBedPlantWithPlantRow } from "../../src/modules/plantings/persistent-bed-plants.types.js";
import {
  toYearlyBedPlantingDetailDto,
  toYearlyBedPlantingListItemDto
} from "../../src/modules/plantings/yearly-bed-plantings.dto.js";
import type { YearlyBedPlantingWithPlantRow } from "../../src/modules/plantings/yearly-bed-plantings.types.js";
import { toPerennialDetailDto, toPerennialListItemDto } from "../../src/modules/perennials/perennials.dto.js";
import type { PerennialWithPlantRow } from "../../src/modules/perennials/perennials.types.js";

const accountId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const placeId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const bedId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const plantId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const createdAt = new Date("2026-05-21T08:00:00.000Z");
const updatedAt = new Date("2026-05-21T09:00:00.000Z");

describe("growing structure DTO mapping", () => {
  it("maps perennial snake_case rows to canonical camelCase fields with plant names", () => {
    const row = createPerennialRow();

    expect(toPerennialListItemDto(row)).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      placeId,
      plantId,
      plantName: "Pear (Williams)",
      label: "Pear near fence",
      plantedYear: 2022,
      status: "active",
      notes: "Prune lightly"
    });
    expect(toPerennialDetailDto(row).createdAt).toBe("2026-05-21T08:00:00.000Z");
  });

  it("maps bed rows and current-content rows to canonical bed DTOs", () => {
    const currentContents = createBedCurrentContentsRows();

    expect(toBedCurrentContentsDto(currentContents)).toEqual({
      persistentPlants: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          plantName: "Strawberry",
          quantity: 10
        }
      ],
      yearlyPlantings: [
        {
          id: "44444444-4444-4444-4444-444444444444",
          plantName: "Tomato (Roma)",
          year: 2026,
          quantity: 12,
          status: "planted"
        }
      ]
    });

    expect(toBedListItemDto(createBedRow(), currentContents)).toMatchObject({
      id: bedId,
      placeId,
      name: "Bed A",
      widthM: 1.2,
      lengthM: 4,
      areaM2: 4.8,
      status: "active",
      currentContents: {
        persistentPlants: [expect.objectContaining({ plantName: "Strawberry" })],
        yearlyPlantings: [expect.objectContaining({ plantName: "Tomato (Roma)" })]
      }
    });
    expect(toBedDetailDto(createBedRow(), currentContents)).toMatchObject({
      persistentPlants: [expect.objectContaining({ plantName: "Strawberry" })],
      yearlyPlantings: [expect.objectContaining({ plantName: "Tomato (Roma)" })],
      recentActivities: [],
      openProblems: [],
      updatedAt: "2026-05-21T09:00:00.000Z"
    });
  });

  it("maps persistent bed plant rows to camelCase fields", () => {
    const row = createPersistentBedPlantRow();

    expect(toPersistentBedPlantListItemDto(row)).toEqual({
      id: "33333333-3333-3333-3333-333333333333",
      bedId,
      plantId,
      plantName: "Strawberry",
      plantedYear: 2025,
      quantity: 10,
      notes: "Runner patch",
      status: "active"
    });
    expect(toPersistentBedPlantDetailDto(row).archivedAt).toBeNull();
  });

  it("maps yearly bed planting rows to camelCase fields", () => {
    const row = createYearlyBedPlantingRow();

    expect(toYearlyBedPlantingListItemDto(row)).toEqual({
      id: "44444444-4444-4444-4444-444444444444",
      bedId,
      plantId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      plantName: "Tomato (Roma)",
      year: 2026,
      quantity: 12,
      notes: "South row",
      status: "planted"
    });
    expect(toYearlyBedPlantingDetailDto(row).updatedAt).toBe("2026-05-21T09:00:00.000Z");
  });
});

function createPerennialRow(): PerennialWithPlantRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    account_id: accountId,
    place_id: placeId,
    plant_id: plantId,
    label: "Pear near fence",
    planted_year: 2022,
    notes: "Prune lightly",
    status: "active",
    created_at: createdAt,
    updated_at: updatedAt,
    archived_at: null,
    common_name: "Pear",
    variety: "Williams"
  };
}

function createBedRow(): BedRow {
  return {
    id: bedId,
    account_id: accountId,
    place_id: placeId,
    name: "Bed A",
    description: "Back bed",
    notes: "Mulched",
    width_m: "1.2",
    length_m: "4",
    area_m2: "4.8",
    status: "active",
    created_at: createdAt,
    updated_at: updatedAt,
    archived_at: null
  };
}

function createBedCurrentContentsRows(): BedCurrentContentsRow[] {
  return [
    {
      bed_id: bedId,
      account_id: accountId,
      place_id: placeId,
      source_type: "persistent_bed_plant",
      source_id: "33333333-3333-3333-3333-333333333333",
      plant_id: plantId,
      common_name: "Strawberry",
      variety: null,
      quantity: "10",
      notes: "Runner patch",
      status: "active",
      year: null
    },
    {
      bed_id: bedId,
      account_id: accountId,
      place_id: placeId,
      source_type: "yearly_bed_planting",
      source_id: "44444444-4444-4444-4444-444444444444",
      plant_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      common_name: "Tomato",
      variety: "Roma",
      quantity: "12",
      notes: "South row",
      status: "planted",
      year: 2026
    }
  ];
}

function createPersistentBedPlantRow(): PersistentBedPlantWithPlantRow {
  return {
    id: "33333333-3333-3333-3333-333333333333",
    account_id: accountId,
    bed_id: bedId,
    plant_id: plantId,
    planted_year: 2025,
    quantity: "10",
    notes: "Runner patch",
    status: "active",
    created_at: createdAt,
    updated_at: updatedAt,
    archived_at: null,
    common_name: "Strawberry",
    variety: null
  };
}

function createYearlyBedPlantingRow(): YearlyBedPlantingWithPlantRow {
  return {
    id: "44444444-4444-4444-4444-444444444444",
    account_id: accountId,
    bed_id: bedId,
    plant_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    year: 2026,
    quantity: "12",
    notes: "South row",
    status: "planted",
    created_at: createdAt,
    updated_at: updatedAt,
    archived_at: null,
    common_name: "Tomato",
    variety: "Roma"
  };
}
