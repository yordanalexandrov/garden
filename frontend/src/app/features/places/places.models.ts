import { PagedFilter } from '../garden-structure-api.types';

export interface PlaceCounts {
  readonly perennials: number;
  readonly beds: number;
  readonly openProblems: number;
  readonly upcomingTasks: number;
}

export interface PlaceListItem {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly weatherEnabled: boolean;
  readonly weatherLocationLabel: string | null;
  readonly timezone: string | null;
  readonly createdAt: string;
  readonly archivedAt: string | null;
}

export interface PlaceDetail extends PlaceListItem {
  readonly notes: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly counts: PlaceCounts;
  readonly updatedAt: string;
}

export interface ListPlacesFilters extends PagedFilter {
  readonly q?: string;
  readonly includeArchived?: boolean;
}

export interface CreatePlaceRequest {
  readonly name: string;
  readonly description?: string | null;
  readonly notes?: string | null;
  readonly weatherEnabled: boolean;
  readonly weatherLocationLabel?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly timezone?: string | null;
}

export type UpdatePlaceRequest = Partial<CreatePlaceRequest>;

export interface PlaceMutationResult {
  readonly id: string;
  readonly name: string;
}
