import { PagedFilter } from '../garden-structure-api.types';

export const PERSISTENT_BED_PLANT_STATUSES = ['active', 'removed', 'archived'] as const;
export const EDITABLE_PERSISTENT_BED_PLANT_STATUSES = ['active', 'removed'] as const;
export const YEARLY_BED_PLANTING_STATUSES = [
  'planned',
  'planted',
  'removed',
  'harvested',
  'archived',
] as const;
export const EDITABLE_YEARLY_BED_PLANTING_STATUSES = [
  'planned',
  'planted',
  'removed',
  'harvested',
] as const;

export type PersistentBedPlantStatus = (typeof PERSISTENT_BED_PLANT_STATUSES)[number];
export type EditablePersistentBedPlantStatus =
  (typeof EDITABLE_PERSISTENT_BED_PLANT_STATUSES)[number];
export type YearlyBedPlantingStatus = (typeof YEARLY_BED_PLANTING_STATUSES)[number];
export type EditableYearlyBedPlantingStatus =
  (typeof EDITABLE_YEARLY_BED_PLANTING_STATUSES)[number];

export interface PersistentBedPlantListItem {
  readonly id: string;
  readonly bedId: string;
  readonly plantId: string;
  readonly plantName: string;
  readonly plantedYear: number | null;
  readonly quantity: number | null;
  readonly notes: string | null;
  readonly status: PersistentBedPlantStatus;
}

export interface PersistentBedPlantDetail extends PersistentBedPlantListItem {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface ListPersistentBedPlantsFilters extends PagedFilter {
  readonly status?: PersistentBedPlantStatus;
}

export interface CreatePersistentBedPlantRequest {
  readonly plantId: string;
  readonly plantedYear?: number | null;
  readonly quantity?: number | null;
  readonly notes?: string | null;
}

export interface UpdatePersistentBedPlantRequest
  extends Partial<CreatePersistentBedPlantRequest> {
  readonly status?: PersistentBedPlantStatus;
}

export interface YearlyBedPlantingListItem {
  readonly id: string;
  readonly bedId: string;
  readonly plantId: string;
  readonly plantName: string;
  readonly year: number;
  readonly quantity: number | null;
  readonly notes: string | null;
  readonly status: YearlyBedPlantingStatus;
}

export interface YearlyBedPlantingDetail extends YearlyBedPlantingListItem {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface ListYearlyBedPlantingsFilters extends PagedFilter {
  readonly year?: number;
  readonly status?: YearlyBedPlantingStatus;
}

export interface CreateYearlyBedPlantingRequest {
  readonly plantId: string;
  readonly year: number;
  readonly quantity?: number | null;
  readonly notes?: string | null;
  readonly status: YearlyBedPlantingStatus;
}

export type UpdateYearlyBedPlantingRequest = Partial<CreateYearlyBedPlantingRequest>;
