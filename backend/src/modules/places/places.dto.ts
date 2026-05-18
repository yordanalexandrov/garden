import type {
  PlaceCountsDto,
  PlaceDetailDto,
  PlaceListItemDto,
  PlaceMutationDto,
  PlaceRow
} from "./places.types.js";

export function toPlaceListItemDto(row: PlaceRow): PlaceListItemDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    weatherEnabled: row.weather_enabled,
    weatherLocationLabel: row.weather_location_label,
    timezone: row.timezone,
    createdAt: row.created_at.toISOString(),
    archivedAt: toNullableIsoString(row.archived_at)
  };
}

export function toPlaceDetailDto(row: PlaceRow, counts: PlaceCountsDto): PlaceDetailDto {
  return {
    ...toPlaceListItemDto(row),
    notes: row.notes,
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    counts,
    updatedAt: row.updated_at.toISOString()
  };
}

export function toPlaceMutationDto(row: Pick<PlaceRow, "id" | "name">): PlaceMutationDto {
  return {
    id: row.id,
    name: row.name
  };
}

function toNullableIsoString(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

function toNullableNumber(value: string | null): number | null {
  return value === null ? null : Number(value);
}
