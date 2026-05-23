import { PagedFilter } from '../garden-structure-api.types';

export const PERENNIAL_STATUSES = ['active', 'removed', 'dead', 'archived'] as const;
export const EDITABLE_PERENNIAL_STATUSES = ['active', 'removed', 'dead'] as const;

export type PerennialStatus = (typeof PERENNIAL_STATUSES)[number];
export type EditablePerennialStatus = (typeof EDITABLE_PERENNIAL_STATUSES)[number];

export interface PerennialListItem {
  readonly id: string;
  readonly placeId: string;
  readonly plantId: string;
  readonly plantName: string;
  readonly label: string | null;
  readonly plantedYear: number | null;
  readonly status: PerennialStatus;
  readonly notes: string | null;
}

export interface PerennialDetail extends PerennialListItem {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface ListPerennialsFilters extends PagedFilter {
  readonly q?: string;
  readonly status?: PerennialStatus;
}

export interface CreatePerennialRequest {
  readonly plantId: string;
  readonly label?: string | null;
  readonly plantedYear?: number | null;
  readonly notes?: string | null;
}

export interface UpdatePerennialRequest extends Partial<CreatePerennialRequest> {
  readonly status?: PerennialStatus;
}
