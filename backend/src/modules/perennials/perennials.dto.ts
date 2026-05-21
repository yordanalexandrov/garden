import type {
  PerennialDetailDto,
  PerennialListItemDto,
  PerennialMutationDto,
  PerennialStatus,
  PerennialWithPlant,
  PerennialWithPlantRow,
  PerennialRow
} from "./perennials.types.js";

type PerennialDtoSource = PerennialWithPlant | PerennialWithPlantRow;

export function toPerennialListItemDto(perennial: PerennialDtoSource): PerennialListItemDto {
  return {
    id: perennial.id,
    placeId: placeIdOf(perennial),
    plantId: plantIdOf(perennial),
    plantName: plantNameOf(perennial),
    label: perennial.label,
    plantedYear: plantedYearOf(perennial),
    status: statusOf(perennial),
    notes: perennial.notes
  };
}

export function toPerennialDetailDto(perennial: PerennialDtoSource): PerennialDetailDto {
  return {
    ...toPerennialListItemDto(perennial),
    createdAt: createdAtOf(perennial).toISOString(),
    updatedAt: updatedAtOf(perennial).toISOString(),
    archivedAt: toNullableIsoString(archivedAtOf(perennial))
  };
}

export function toPerennialMutationDto(perennial: Pick<PerennialRow, "id"> | Pick<PerennialWithPlant, "id">): PerennialMutationDto {
  return {
    id: perennial.id
  };
}

function isPerennialRow(value: PerennialDtoSource): value is PerennialWithPlantRow {
  return "place_id" in value;
}

function placeIdOf(perennial: PerennialDtoSource): string {
  return isPerennialRow(perennial) ? perennial.place_id : perennial.placeId;
}

function plantIdOf(perennial: PerennialDtoSource): string {
  return isPerennialRow(perennial) ? perennial.plant_id : perennial.plantId;
}

function plantNameOf(perennial: PerennialDtoSource): string {
  return isPerennialRow(perennial) ? formatPlantName(perennial.common_name, perennial.variety) : perennial.plantName;
}

function plantedYearOf(perennial: PerennialDtoSource): number | null {
  return isPerennialRow(perennial) ? perennial.planted_year : perennial.plantedYear;
}

function statusOf(perennial: PerennialDtoSource): PerennialStatus {
  return perennial.status as PerennialStatus;
}

function createdAtOf(perennial: PerennialDtoSource): Date {
  return isPerennialRow(perennial) ? perennial.created_at : perennial.createdAt;
}

function updatedAtOf(perennial: PerennialDtoSource): Date {
  return isPerennialRow(perennial) ? perennial.updated_at : perennial.updatedAt;
}

function archivedAtOf(perennial: PerennialDtoSource): Date | null {
  return isPerennialRow(perennial) ? perennial.archived_at : perennial.archivedAt;
}

function formatPlantName(commonName: string, variety: string | null): string {
  const trimmedVariety = variety?.trim();
  return trimmedVariety === undefined || trimmedVariety.length === 0 ? commonName : `${commonName} (${trimmedVariety})`;
}

function toNullableIsoString(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}
