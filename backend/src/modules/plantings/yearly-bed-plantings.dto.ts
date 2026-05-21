import type {
  YearlyBedPlantingDetailDto,
  YearlyBedPlantingListItemDto,
  YearlyBedPlantingMutationDto,
  YearlyBedPlantingStatus,
  YearlyBedPlantingWithPlant,
  YearlyBedPlantingWithPlantRow,
  YearlyBedPlantingRow
} from "./yearly-bed-plantings.types.js";

type YearlyBedPlantingDtoSource = YearlyBedPlantingWithPlant | YearlyBedPlantingWithPlantRow;

export function toYearlyBedPlantingListItemDto(
  planting: YearlyBedPlantingDtoSource
): YearlyBedPlantingListItemDto {
  return {
    id: planting.id,
    bedId: bedIdOf(planting),
    plantId: plantIdOf(planting),
    plantName: plantNameOf(planting),
    year: planting.year,
    quantity: quantityOf(planting),
    notes: planting.notes,
    status: statusOf(planting)
  };
}

export function toYearlyBedPlantingDetailDto(planting: YearlyBedPlantingDtoSource): YearlyBedPlantingDetailDto {
  return {
    ...toYearlyBedPlantingListItemDto(planting),
    createdAt: createdAtOf(planting).toISOString(),
    updatedAt: updatedAtOf(planting).toISOString(),
    archivedAt: toNullableIsoString(archivedAtOf(planting))
  };
}

export function toYearlyBedPlantingMutationDto(
  planting: Pick<YearlyBedPlantingRow, "id"> | Pick<YearlyBedPlantingWithPlant, "id">
): YearlyBedPlantingMutationDto {
  return {
    id: planting.id
  };
}

function isYearlyBedPlantingRow(value: YearlyBedPlantingDtoSource): value is YearlyBedPlantingWithPlantRow {
  return "bed_id" in value;
}

function bedIdOf(planting: YearlyBedPlantingDtoSource): string {
  return isYearlyBedPlantingRow(planting) ? planting.bed_id : planting.bedId;
}

function plantIdOf(planting: YearlyBedPlantingDtoSource): string {
  return isYearlyBedPlantingRow(planting) ? planting.plant_id : planting.plantId;
}

function plantNameOf(planting: YearlyBedPlantingDtoSource): string {
  return isYearlyBedPlantingRow(planting)
    ? formatPlantName(planting.common_name, planting.variety)
    : planting.plantName;
}

function quantityOf(planting: YearlyBedPlantingDtoSource): number | null {
  return isYearlyBedPlantingRow(planting) ? toNullableNumber(planting.quantity) : planting.quantity;
}

function statusOf(planting: YearlyBedPlantingDtoSource): YearlyBedPlantingStatus {
  return planting.status as YearlyBedPlantingStatus;
}

function createdAtOf(planting: YearlyBedPlantingDtoSource): Date {
  return isYearlyBedPlantingRow(planting) ? planting.created_at : planting.createdAt;
}

function updatedAtOf(planting: YearlyBedPlantingDtoSource): Date {
  return isYearlyBedPlantingRow(planting) ? planting.updated_at : planting.updatedAt;
}

function archivedAtOf(planting: YearlyBedPlantingDtoSource): Date | null {
  return isYearlyBedPlantingRow(planting) ? planting.archived_at : planting.archivedAt;
}

function formatPlantName(commonName: string, variety: string | null): string {
  const trimmedVariety = variety?.trim();
  return trimmedVariety === undefined || trimmedVariety.length === 0 ? commonName : `${commonName} (${trimmedVariety})`;
}

function toNullableNumber(value: number | string | null): number | null {
  return value === null ? null : Number(value);
}

function toNullableIsoString(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}
