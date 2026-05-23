import { PagedFilter } from '../garden-structure-api.types';

export const BED_STATUSES = ['active', 'removed', 'archived'] as const;
export const EDITABLE_BED_STATUSES = ['active', 'removed'] as const;

export type BedStatus = (typeof BED_STATUSES)[number];
export type EditableBedStatus = (typeof EDITABLE_BED_STATUSES)[number];

export interface BedCurrentPersistentPlant {
  readonly id: string;
  readonly plantName: string;
  readonly quantity: number | null;
}

export interface BedCurrentYearlyPlanting {
  readonly id: string;
  readonly plantName: string;
  readonly year: number;
  readonly quantity: number | null;
  readonly status: string;
}

export interface BedCurrentContents {
  readonly persistentPlants: readonly BedCurrentPersistentPlant[];
  readonly yearlyPlantings: readonly BedCurrentYearlyPlanting[];
}

export interface BedListItem {
  readonly id: string;
  readonly placeId: string;
  readonly name: string;
  readonly description: string | null;
  readonly widthM: number | null;
  readonly lengthM: number | null;
  readonly areaM2: number | null;
  readonly status: BedStatus;
  readonly currentContents: BedCurrentContents;
}

export interface BedDetail extends BedListItem {
  readonly notes: string | null;
  readonly persistentPlants: readonly BedCurrentPersistentPlant[];
  readonly yearlyPlantings: readonly BedCurrentYearlyPlanting[];
  readonly recentActivities: readonly unknown[];
  readonly openProblems: readonly unknown[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface ListBedsFilters extends PagedFilter {
  readonly q?: string;
  readonly status?: BedStatus;
  readonly year?: number;
}

export interface CreateBedRequest {
  readonly name: string;
  readonly description?: string | null;
  readonly notes?: string | null;
  readonly widthM?: number | null;
  readonly lengthM?: number | null;
  readonly areaM2?: number | null;
}

export interface UpdateBedRequest extends Partial<CreateBedRequest> {
  readonly status?: BedStatus;
}
