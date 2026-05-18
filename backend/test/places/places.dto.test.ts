import { describe, expect, it } from "vitest";

import { toPlaceDetailDto, toPlaceListItemDto, toPlaceMutationDto } from "../../src/modules/places/places.dto.js";
import type { PlaceRow } from "../../src/modules/places/places.types.js";

const createdAt = new Date("2026-05-18T10:00:00.000Z");
const updatedAt = new Date("2026-05-18T11:00:00.000Z");

describe("places DTO mapping", () => {
  it("maps database snake_case fields to list camelCase fields", () => {
    expect(toPlaceListItemDto(createPlaceRow())).toEqual({
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Home Garden",
      description: "Back garden",
      weatherEnabled: true,
      weatherLocationLabel: "Ruse, Bulgaria",
      timezone: "Europe/Sofia",
      createdAt: "2026-05-18T10:00:00.000Z",
      archivedAt: null
    });
  });

  it("maps detail-only fields and numeric coordinates", () => {
    expect(
      toPlaceDetailDto(createPlaceRow(), {
        perennials: 2,
        beds: 3,
        openProblems: 1,
        upcomingTasks: 4
      })
    ).toMatchObject({
      notes: "Water early",
      latitude: 43.84,
      longitude: 25.95,
      counts: {
        perennials: 2,
        beds: 3,
        openProblems: 1,
        upcomingTasks: 4
      },
      updatedAt: "2026-05-18T11:00:00.000Z"
    });
  });

  it("maps mutation responses to canonical id and name", () => {
    expect(toPlaceMutationDto(createPlaceRow())).toEqual({
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Home Garden"
    });
  });
});

function createPlaceRow(): PlaceRow {
  return {
    id: "123e4567-e89b-12d3-a456-426614174000",
    account_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "Home Garden",
    description: "Back garden",
    notes: "Water early",
    weather_enabled: true,
    weather_location_label: "Ruse, Bulgaria",
    latitude: "43.84",
    longitude: "25.95",
    timezone: "Europe/Sofia",
    created_at: createdAt,
    updated_at: updatedAt,
    archived_at: null
  };
}
