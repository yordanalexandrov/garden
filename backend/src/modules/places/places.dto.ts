import type {
  PlaceCountsDto,
  PlaceDetailDto,
  PlaceListItemDto,
  Place,
  PlaceDetail,
  PlaceMutationDto,
  PlaceRow
} from "./places.types.js";

type PlaceDtoSource = Place | PlaceRow;

export function toPlaceListItemDto(place: PlaceDtoSource): PlaceListItemDto {
  return {
    id: place.id,
    name: place.name,
    description: place.description,
    weatherEnabled: weatherEnabledOf(place),
    weatherLocationLabel: weatherLocationLabelOf(place),
    timezone: place.timezone,
    createdAt: createdAtOf(place).toISOString(),
    archivedAt: toNullableIsoString(archivedAtOf(place))
  };
}

export function toPlaceDetailDto(place: PlaceDetail): PlaceDetailDto;
export function toPlaceDetailDto(row: PlaceRow, counts: PlaceCountsDto): PlaceDetailDto;
export function toPlaceDetailDto(place: PlaceDetail | PlaceRow, counts?: PlaceCountsDto): PlaceDetailDto {
  const resolvedCounts = isPlaceRow(place) ? counts : place.counts;

  if (resolvedCounts === undefined) {
    throw new Error("Place detail counts are required");
  }

  return {
    ...toPlaceListItemDto(place),
    notes: place.notes,
    latitude: latitudeOf(place),
    longitude: longitudeOf(place),
    counts: resolvedCounts,
    updatedAt: updatedAtOf(place).toISOString()
  };
}

export function toPlaceMutationDto(place: Pick<PlaceRow, "id" | "name"> | Pick<Place, "id" | "name">): PlaceMutationDto {
  return {
    id: place.id,
    name: place.name
  };
}

function isPlaceRow(value: PlaceDtoSource): value is PlaceRow {
  return "created_at" in value;
}

function weatherEnabledOf(place: PlaceDtoSource): boolean {
  return isPlaceRow(place) ? place.weather_enabled : place.weatherEnabled;
}

function weatherLocationLabelOf(place: PlaceDtoSource): string | null {
  return isPlaceRow(place) ? place.weather_location_label : place.weatherLocationLabel;
}

function latitudeOf(place: PlaceDtoSource): number | null {
  return isPlaceRow(place) ? toNullableNumber(place.latitude) : place.latitude;
}

function longitudeOf(place: PlaceDtoSource): number | null {
  return isPlaceRow(place) ? toNullableNumber(place.longitude) : place.longitude;
}

function createdAtOf(place: PlaceDtoSource): Date {
  return isPlaceRow(place) ? place.created_at : place.createdAt;
}

function updatedAtOf(place: PlaceDtoSource): Date {
  return isPlaceRow(place) ? place.updated_at : place.updatedAt;
}

function archivedAtOf(place: PlaceDtoSource): Date | null {
  return isPlaceRow(place) ? place.archived_at : place.archivedAt;
}

function toNullableIsoString(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

function toNullableNumber(value: string | null): number | null {
  return value === null ? null : Number(value);
}
