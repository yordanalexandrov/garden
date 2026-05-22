import type {
  Bed,
  BedCurrentContentsDto,
  BedCurrentContentsRow,
  BedDetailDto,
  BedListItemDto,
  BedMutationDto,
  BedRow,
  BedStatus,
  BedWithCurrentContents
} from "./beds.types.js";

type BedDtoSource = Bed | BedRow | BedWithCurrentContents;

export function toBedCurrentContentsDto(rows: BedCurrentContentsRow[]): BedCurrentContentsDto {
  const currentContents: BedCurrentContentsDto = {
    persistentPlants: [],
    yearlyPlantings: []
  };

  for (const row of rows) {
    if (row.source_type === "persistent_bed_plant") {
      currentContents.persistentPlants.push({
        id: row.source_id,
        plantName: formatPlantName(row.common_name, row.variety),
        quantity: toNullableNumber(row.quantity)
      });
      continue;
    }

    if (row.source_type === "yearly_bed_planting") {
      if (row.year === null) {
        throw new Error("Yearly bed planting current-content rows require a year");
      }

      currentContents.yearlyPlantings.push({
        id: row.source_id,
        plantName: formatPlantName(row.common_name, row.variety),
        year: row.year,
        quantity: toNullableNumber(row.quantity),
        status: row.status
      });
      continue;
    }

    throw new Error(`Unsupported bed current-content source type: ${row.source_type}`);
  }

  return currentContents;
}

export function toBedListItemDto(bed: BedDtoSource, contentRows: BedCurrentContentsRow[] = []): BedListItemDto {
  return {
    id: bed.id,
    placeId: placeIdOf(bed),
    name: bed.name,
    description: bed.description,
    widthM: widthMOf(bed),
    lengthM: lengthMOf(bed),
    areaM2: areaM2Of(bed),
    status: statusOf(bed),
    currentContents: currentContentsOf(bed, contentRows)
  };
}

export function toBedDetailDto(bed: BedDtoSource, contentRows: BedCurrentContentsRow[] = []): BedDetailDto {
  const currentContents = currentContentsOf(bed, contentRows);

  return {
    ...toBedListItemDto(bed, contentRows),
    notes: bed.notes,
    persistentPlants: currentContents.persistentPlants,
    yearlyPlantings: currentContents.yearlyPlantings,
    recentActivities: [],
    openProblems: [],
    createdAt: createdAtOf(bed).toISOString(),
    updatedAt: updatedAtOf(bed).toISOString(),
    archivedAt: toNullableIsoString(archivedAtOf(bed))
  };
}

export function toBedMutationDto(bed: Pick<BedRow, "id"> | Pick<Bed, "id">): BedMutationDto {
  return {
    id: bed.id
  };
}

function isBedRow(value: BedDtoSource): value is BedRow {
  return "place_id" in value;
}

function hasCurrentContents(value: BedDtoSource): value is BedWithCurrentContents {
  return "currentContents" in value;
}

function placeIdOf(bed: BedDtoSource): string {
  return isBedRow(bed) ? bed.place_id : bed.placeId;
}

function widthMOf(bed: BedDtoSource): number | null {
  return isBedRow(bed) ? toNullableNumber(bed.width_m) : bed.widthM;
}

function lengthMOf(bed: BedDtoSource): number | null {
  return isBedRow(bed) ? toNullableNumber(bed.length_m) : bed.lengthM;
}

function areaM2Of(bed: BedDtoSource): number | null {
  return isBedRow(bed) ? toNullableNumber(bed.area_m2) : bed.areaM2;
}

function statusOf(bed: BedDtoSource): BedStatus {
  return bed.status as BedStatus;
}

function currentContentsOf(bed: BedDtoSource, contentRows: BedCurrentContentsRow[]): BedCurrentContentsDto {
  if (hasCurrentContents(bed)) {
    return bed.currentContents;
  }

  return toBedCurrentContentsDto(contentRows);
}

function createdAtOf(bed: BedDtoSource): Date {
  return isBedRow(bed) ? bed.created_at : bed.createdAt;
}

function updatedAtOf(bed: BedDtoSource): Date {
  return isBedRow(bed) ? bed.updated_at : bed.updatedAt;
}

function archivedAtOf(bed: BedDtoSource): Date | null {
  return isBedRow(bed) ? bed.archived_at : bed.archivedAt;
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
