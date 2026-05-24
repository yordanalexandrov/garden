import { PagedFilter } from '../garden-structure-api.types';

export const PLANT_LIFECYCLE_TYPES = ['annual', 'biennial', 'perennial'] as const;
export const PLANT_GROWING_STYLES = [
  'tree',
  'shrub',
  'vine',
  'herb',
  'vegetable',
  'berry',
  'flower',
  'other',
] as const;

export type LifecycleType = (typeof PLANT_LIFECYCLE_TYPES)[number];
export type GrowingStyle = (typeof PLANT_GROWING_STYLES)[number];

export interface PlantListItem {
  readonly id: string;
  readonly commonName: string;
  readonly variety: string | null;
  readonly plantCategory: string | null;
  readonly lifecycleType: LifecycleType;
  readonly growingStyle: GrowingStyle;
  readonly notes: string | null;
  readonly archivedAt: string | null;
}

export interface PlantDetail extends PlantListItem {
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ListPlantsFilters extends PagedFilter {
  readonly q?: string;
  readonly lifecycleType?: LifecycleType;
  readonly growingStyle?: GrowingStyle;
  readonly includeArchived?: boolean;
}

export interface CreatePlantRequest {
  readonly commonName: string;
  readonly variety?: string | null;
  readonly plantCategory?: string | null;
  readonly lifecycleType: LifecycleType;
  readonly growingStyle: GrowingStyle;
  readonly notes?: string | null;
}

export type UpdatePlantRequest = Partial<CreatePlantRequest>;
