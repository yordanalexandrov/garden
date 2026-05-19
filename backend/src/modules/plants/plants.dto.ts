import type {
  GrowingStyle,
  LifecycleType,
  Plant,
  PlantDetailDto,
  PlantListItemDto,
  PlantMutationDto,
  PlantRow
} from "./plants.types.js";

type PlantDtoSource = Plant | PlantRow;

export function toPlantListItemDto(plant: PlantDtoSource): PlantListItemDto {
  return {
    id: plant.id,
    commonName: commonNameOf(plant),
    variety: plant.variety,
    plantCategory: plantCategoryOf(plant),
    lifecycleType: lifecycleTypeOf(plant),
    growingStyle: growingStyleOf(plant),
    notes: plant.notes,
    archivedAt: toNullableIsoString(archivedAtOf(plant))
  };
}

export function toPlantDetailDto(plant: PlantDtoSource): PlantDetailDto {
  return {
    ...toPlantListItemDto(plant),
    createdAt: createdAtOf(plant).toISOString(),
    updatedAt: updatedAtOf(plant).toISOString()
  };
}

export function toPlantMutationDto(plant: Pick<PlantRow, "id"> | Pick<Plant, "id">): PlantMutationDto {
  return {
    id: plant.id
  };
}

function isPlantRow(value: PlantDtoSource): value is PlantRow {
  return "common_name" in value;
}

function commonNameOf(plant: PlantDtoSource): string {
  return isPlantRow(plant) ? plant.common_name : plant.commonName;
}

function plantCategoryOf(plant: PlantDtoSource): string | null {
  return isPlantRow(plant) ? plant.plant_category : plant.plantCategory;
}

function lifecycleTypeOf(plant: PlantDtoSource): LifecycleType {
  return isPlantRow(plant) ? (plant.lifecycle_type as LifecycleType) : plant.lifecycleType;
}

function growingStyleOf(plant: PlantDtoSource): GrowingStyle {
  return isPlantRow(plant) ? (plant.growing_style as GrowingStyle) : plant.growingStyle;
}

function createdAtOf(plant: PlantDtoSource): Date {
  return isPlantRow(plant) ? plant.created_at : plant.createdAt;
}

function updatedAtOf(plant: PlantDtoSource): Date {
  return isPlantRow(plant) ? plant.updated_at : plant.updatedAt;
}

function archivedAtOf(plant: PlantDtoSource): Date | null {
  return isPlantRow(plant) ? plant.archived_at : plant.archivedAt;
}

function toNullableIsoString(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}
