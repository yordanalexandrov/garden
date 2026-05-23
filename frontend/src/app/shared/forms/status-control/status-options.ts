import { BED_STATUSES } from '../../../features/beds/beds.models';
import { PERENNIAL_STATUSES } from '../../../features/perennials/perennials.models';
import {
  PERSISTENT_BED_PLANT_STATUSES,
  YEARLY_BED_PLANTING_STATUSES,
} from '../../../features/plantings/plantings.models';

export interface StatusOption<TStatus extends string = string> {
  readonly value: TStatus;
  readonly label: string;
  readonly archived: boolean;
}

export const toStatusOptions = <TStatus extends string>(
  statuses: readonly TStatus[],
): readonly StatusOption<TStatus>[] =>
  statuses.map((status) => ({
    value: status,
    label: status
      .split('_')
      .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
      .join(' '),
    archived: status === 'archived',
  }));

export const perennialStatusOptions = toStatusOptions(PERENNIAL_STATUSES);
export const bedStatusOptions = toStatusOptions(BED_STATUSES);
export const persistentBedPlantStatusOptions = toStatusOptions(PERSISTENT_BED_PLANT_STATUSES);
export const yearlyBedPlantingStatusOptions = toStatusOptions(YEARLY_BED_PLANTING_STATUSES);
