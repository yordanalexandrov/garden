import { ApiListData } from '../../core/api/api.types';
import { PagedFilter } from '../garden-structure-api.types';
import { ProductUnit } from '../products/products.models';

export const ACTIVITY_TYPES = [
  'watering',
  'treatment',
  'fertilizing',
  'pruning',
  'planting',
  'transplanting',
  'harvesting',
  'observation',
  'maintenance',
  'soil_work',
  'custom',
] as const;

export const TARGET_SCOPE_TYPES = [
  'whole_place',
  'all_perennials_in_place',
  'selected_perennials',
  'all_beds_in_place',
  'selected_beds',
  'single_bed',
  'selected_yearly_plantings',
  'selected_persistent_bed_plants',
] as const;

export const TARGET_TYPES = [
  'place',
  'perennial',
  'bed',
  'yearly_bed_planting',
  'persistent_bed_plant',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export type TargetScopeType = (typeof TARGET_SCOPE_TYPES)[number];
export type TargetType = (typeof TARGET_TYPES)[number];

export interface TargetSelection {
  readonly perennialIds?: readonly string[];
  readonly bedIds?: readonly string[];
  readonly yearlyPlantingIds?: readonly string[];
  readonly persistentBedPlantIds?: readonly string[];
}

export interface TargetSummary {
  readonly targetType: TargetType;
  readonly targetId: string;
  readonly label: string | null;
  readonly placeId: string;
}

export interface ActivitySideEffectsSummary {
  readonly inventoryMovementsCount: number;
  readonly quarantinePeriodsCount: number;
  readonly suggestedTasksCount: number;
  readonly warnings: readonly string[];
}

export interface ActivityListItem {
  readonly id: string;
  readonly placeId: string | null;
  readonly placeName: string | null;
  readonly type: ActivityType;
  readonly performedAt: string;
  readonly targetSummary: string;
  readonly productSummary: string | null;
  readonly sideEffects: ActivitySideEffectsSummary;
}

export interface ActivityProductUsageRequest {
  readonly productId: string;
  readonly productUsageRuleId?: string | null;
  readonly quantityUsed: number;
  readonly unit: ProductUnit;
  readonly notes?: string | null;
}

export interface ActivityProductUsage extends ActivityProductUsageRequest {
  readonly id: string;
  readonly productUsageRuleId: string | null;
  readonly createdStockMovement: boolean;
  readonly createdQuarantine: boolean;
  readonly createdFollowupSuggestion: boolean;
  readonly notes: string | null;
}

export interface InventoryEffect {
  readonly movementId: string;
  readonly productId: string;
  readonly inventoryLotId: string | null;
  readonly direction?: string;
  readonly quantity: number;
  readonly unit: ProductUnit;
}

export interface QuarantinePeriodSummary {
  readonly id: string;
  readonly productId: string;
  readonly startsOn: string;
  readonly endsOn: string;
}

export interface SuggestedTaskSummary {
  readonly id: string;
  readonly type: string;
  readonly dueDate: string;
  readonly status: 'suggested';
}

export interface ActivityDetail {
  readonly id: string;
  readonly placeId: string | null;
  readonly type: ActivityType;
  readonly performedAt: string;
  readonly targetScopeType: TargetScopeType;
  readonly targets: readonly TargetSummary[];
  readonly productUsages: readonly ActivityProductUsage[];
  readonly inventoryMovements: readonly InventoryEffect[];
  readonly quarantinePeriods: readonly QuarantinePeriodSummary[];
  readonly suggestedTasks: readonly SuggestedTaskSummary[];
  readonly notes: string | null;
}

export interface CreateActivityRequest {
  readonly placeId: string;
  readonly type: ActivityType;
  readonly performedAt: string;
  readonly targetScopeType: TargetScopeType;
  readonly targetSelection?: TargetSelection;
  readonly notes?: string | null;
  readonly productUsages?: readonly ActivityProductUsageRequest[];
  readonly allowInventoryShortage: boolean;
}

export interface CreateActivityResult {
  readonly activity: ActivityDetail;
  readonly inventoryEffects: readonly InventoryEffect[];
  readonly quarantinePeriods: readonly QuarantinePeriodSummary[];
  readonly suggestedTasks: readonly SuggestedTaskSummary[];
  readonly warnings: readonly string[];
}

export interface ListActivitiesFilters extends PagedFilter {
  readonly placeId?: string;
  readonly type?: ActivityType;
  readonly from?: string;
  readonly to?: string;
  readonly targetType?: TargetType;
  readonly targetId?: string;
}

export type ActivitiesPage = ApiListData<ActivityListItem>;
