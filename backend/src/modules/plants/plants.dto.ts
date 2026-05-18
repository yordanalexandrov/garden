import type {
  GrowingStyle,
  LifecycleType,
  PlantDetailDto,
  PlantListItemDto,
  PlantMutationDto,
  PlantRow
} from "./plants.types.js";

export function toPlantListItemDto(row: PlantRow): PlantListItemDto {
  return {
    id: row.id,
    commonName: row.common_name,
    variety: row.variety,
    plantCategory: row.plant_category,
    lifecycleType: row.lifecycle_type as LifecycleType,
    growingStyle: row.growing_style as GrowingStyle,
    notes: row.notes,
    archivedAt: toNullableIsoString(row.archived_at)
  };
}

export function toPlantDetailDto(row: PlantRow): PlantDetailDto {
  return {
    ...toPlantListItemDto(row),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export function toPlantMutationDto(row: Pick<PlantRow, "id">): PlantMutationDto {
  return {
    id: row.id
  };
}

function toNullableIsoString(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}
