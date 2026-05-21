import type {
  PersistentBedPlantDetailDto,
  PersistentBedPlantListItemDto,
  PersistentBedPlantMutationDto,
  PersistentBedPlantStatus,
  PersistentBedPlantWithPlant,
  PersistentBedPlantWithPlantRow,
  PersistentBedPlantRow
} from "./persistent-bed-plants.types.js";

type PersistentBedPlantDtoSource = PersistentBedPlantWithPlant | PersistentBedPlantWithPlantRow;

export function toPersistentBedPlantListItemDto(
  persistentPlant: PersistentBedPlantDtoSource
): PersistentBedPlantListItemDto {
  return {
    id: persistentPlant.id,
    bedId: bedIdOf(persistentPlant),
    plantId: plantIdOf(persistentPlant),
    plantName: plantNameOf(persistentPlant),
    plantedYear: plantedYearOf(persistentPlant),
    quantity: quantityOf(persistentPlant),
    notes: persistentPlant.notes,
    status: statusOf(persistentPlant)
  };
}

export function toPersistentBedPlantDetailDto(
  persistentPlant: PersistentBedPlantDtoSource
): PersistentBedPlantDetailDto {
  return {
    ...toPersistentBedPlantListItemDto(persistentPlant),
    createdAt: createdAtOf(persistentPlant).toISOString(),
    updatedAt: updatedAtOf(persistentPlant).toISOString(),
    archivedAt: toNullableIsoString(archivedAtOf(persistentPlant))
  };
}

export function toPersistentBedPlantMutationDto(
  persistentPlant: Pick<PersistentBedPlantRow, "id"> | Pick<PersistentBedPlantWithPlant, "id">
): PersistentBedPlantMutationDto {
  return {
    id: persistentPlant.id
  };
}

function isPersistentBedPlantRow(value: PersistentBedPlantDtoSource): value is PersistentBedPlantWithPlantRow {
  return "bed_id" in value;
}

function bedIdOf(persistentPlant: PersistentBedPlantDtoSource): string {
  return isPersistentBedPlantRow(persistentPlant) ? persistentPlant.bed_id : persistentPlant.bedId;
}

function plantIdOf(persistentPlant: PersistentBedPlantDtoSource): string {
  return isPersistentBedPlantRow(persistentPlant) ? persistentPlant.plant_id : persistentPlant.plantId;
}

function plantNameOf(persistentPlant: PersistentBedPlantDtoSource): string {
  return isPersistentBedPlantRow(persistentPlant)
    ? formatPlantName(persistentPlant.common_name, persistentPlant.variety)
    : persistentPlant.plantName;
}

function plantedYearOf(persistentPlant: PersistentBedPlantDtoSource): number | null {
  return isPersistentBedPlantRow(persistentPlant) ? persistentPlant.planted_year : persistentPlant.plantedYear;
}

function quantityOf(persistentPlant: PersistentBedPlantDtoSource): number | null {
  return isPersistentBedPlantRow(persistentPlant) ? toNullableNumber(persistentPlant.quantity) : persistentPlant.quantity;
}

function statusOf(persistentPlant: PersistentBedPlantDtoSource): PersistentBedPlantStatus {
  return persistentPlant.status as PersistentBedPlantStatus;
}

function createdAtOf(persistentPlant: PersistentBedPlantDtoSource): Date {
  return isPersistentBedPlantRow(persistentPlant) ? persistentPlant.created_at : persistentPlant.createdAt;
}

function updatedAtOf(persistentPlant: PersistentBedPlantDtoSource): Date {
  return isPersistentBedPlantRow(persistentPlant) ? persistentPlant.updated_at : persistentPlant.updatedAt;
}

function archivedAtOf(persistentPlant: PersistentBedPlantDtoSource): Date | null {
  return isPersistentBedPlantRow(persistentPlant) ? persistentPlant.archived_at : persistentPlant.archivedAt;
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
