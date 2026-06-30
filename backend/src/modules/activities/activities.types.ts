import type { Selectable } from "kysely";

import type {
  ActivitiesTable,
  ActivityProductUsagesTable,
  ActivityTargetsTable,
  InventoryMovementsTable,
  QuarantinePeriodsTable,
  TasksTable
} from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type { InventoryMovementType } from "../inventory/inventory.types.js";
import type { SimpleUnit } from "../products/products.types.js";
import type { TargetRef, TargetScopeType, TargetSelection, TargetSummary, TargetType } from "../targets/target-resolver.types.js";

export const ACTIVITY_TYPES = [
  "watering",
  "treatment",
  "fertilizing",
  "pruning",
  "planting",
  "transplanting",
  "harvesting",
  "observation",
  "maintenance",
  "soil_work",
  "custom"
] as const;

export const TASK_TYPES = ["spraying", "fertilizing", "pruning", "planting", "harvest_reminder", "custom"] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export type TaskType = (typeof TASK_TYPES)[number];

export type Activity = {
  id: UUID;
  accountId: UUID;
  placeId: UUID | null;
  type: ActivityType;
  performedAt: Date;
  targetScopeType: TargetScopeType;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ActivityTarget = TargetRef & {
  id: UUID;
  activityId: UUID;
  createdAt: Date;
};

export type ActivityProductUsage = {
  id: UUID;
  activityId: UUID;
  productId: UUID;
  productName: string;
  productUsageRuleId: UUID | null;
  quantityUsed: number;
  unit: SimpleUnit;
  createdStockMovement: boolean;
  createdQuarantine: boolean;
  createdFollowupSuggestion: boolean;
  notes: string | null;
  createdAt: Date;
};

export type QuarantinePeriod = {
  id: UUID;
  accountId: UUID;
  placeId: UUID | null;
  activityId: UUID;
  activityProductUsageId: UUID;
  productId: UUID;
  productName: string;
  startsOn: string;
  endsOn: string;
  notes: string | null;
  createdAt: Date;
};

export type SuggestedTask = {
  id: UUID;
  accountId: UUID;
  placeId: UUID | null;
  type: TaskType;
  dueDate: string;
  notes: string | null;
  sourceType: "activity";
  sourceReferenceId: UUID;
  targetScopeType: TargetScopeType;
  status: "suggested";
  createdAt: Date;
  updatedAt: Date;
};

export type ActivityProductUsageInput = {
  productId: UUID;
  productUsageRuleId?: UUID | null;
  quantityUsed: number;
  unit: SimpleUnit;
  notes?: string | null;
};

export type CreateActivityRequest = {
  placeId: UUID;
  type: ActivityType;
  performedAt: Date;
  targetScopeType: TargetScopeType;
  targetSelection?: TargetSelection;
  notes?: string | null;
  productUsages?: ActivityProductUsageInput[];
  allowInventoryShortage: boolean;
};

export type CreateActivityInput = {
  accountId: UUID;
  placeId: UUID | null;
  type: ActivityType;
  performedAt: Date;
  targetScopeType: TargetScopeType;
  notes?: string | null;
};

export type CreateActivityTargetInput = {
  activityId: UUID;
  targetType: TargetType;
  targetId: UUID;
};

export type CreateActivityProductUsageInput = {
  activityId: UUID;
  productId: UUID;
  productUsageRuleId?: UUID | null;
  quantityUsed: number;
  unit: SimpleUnit;
  notes?: string | null;
};

export type ListActivitiesFilters = {
  placeId?: UUID;
  type?: ActivityType;
  from?: Date;
  to?: Date;
  targetType?: TargetType;
  targetId?: UUID;
  page: number;
  pageSize: number;
};

export type ActivityListItem = {
  id: UUID;
  placeId: UUID | null;
  placeName: string | null;
  type: ActivityType;
  performedAt: Date;
  targetSummary: string;
  productSummary: string | null;
  sideEffects: {
    inventoryMovementsCount: number;
    quarantinePeriodsCount: number;
    suggestedTasksCount: number;
    warnings: string[];
  };
};

export type ActivityDetail = Activity & {
  targets: TargetSummary[];
  productUsages: ActivityProductUsage[];
  inventoryMovements: InventoryMovementSummary[];
  quarantinePeriods: QuarantinePeriod[];
  suggestedTasks: SuggestedTask[];
};

export type InventoryMovementSummary = {
  id: UUID;
  productId: UUID;
  productName: string;
  inventoryLotId: UUID | null;
  movementType: "consumption";
  quantity: number;
  unit: SimpleUnit;
  activityId: UUID | null;
  occurredAt: Date;
  notes: string | null;
  createdAt: Date;
};

export type InventoryMovementForReversal = {
  productId: UUID;
  inventoryLotId: UUID | null;
  movementType: string;
  quantity: number;
  unit: SimpleUnit;
  notes: string | null;
};

export type CreateActivityResult = {
  activity: ActivityDetail;
  inventoryEffects: InventoryMovementSummary[];
  quarantinePeriods: QuarantinePeriod[];
  suggestedTasks: SuggestedTask[];
  warnings: string[];
};

export type ActivityCorrectionDirection = "increase_lot" | "decrease_lot";

export type ActivityInventoryCorrectionInput = {
  inventoryMovementId: UUID;
  direction: ActivityCorrectionDirection;
  quantity: number;
  unit: SimpleUnit;
  notes?: string | null;
};

export type CorrectActivityRequest = {
  reason: string;
  inventoryCorrections: ActivityInventoryCorrectionInput[];
};

export type ActivityCorrectionLotEffect = {
  inventoryLotId: UUID;
  beforeQuantityRemaining: number;
  afterQuantityRemaining: number;
};

export type ActivityCorrectionMovementSummary = {
  id: UUID;
  productId: UUID;
  inventoryLotId: UUID | null;
  movementType: Extract<InventoryMovementType, "correction">;
  direction: ActivityCorrectionDirection;
  quantity: number;
  unit: SimpleUnit;
  activityId: UUID | null;
  occurredAt: Date;
  notes: string | null;
  createdAt: Date;
};

export type CorrectActivityResult = {
  activityId: UUID;
  correctionMovements: ActivityCorrectionMovementSummary[];
  lotEffects: ActivityCorrectionLotEffect[];
  auditLogId: UUID;
  warnings: string[];
};

export type PaginatedActivities = {
  items: ActivityListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateQuarantinePeriodInput = {
  accountId: UUID;
  placeId: UUID | null;
  activityId: UUID;
  activityProductUsageId: UUID;
  productId: UUID;
  startsOn: string;
  endsOn: string;
  notes?: string | null;
};

export type CreateSuggestedTaskInput = {
  accountId: UUID;
  placeId: UUID | null;
  type: TaskType;
  dueDate: string;
  notes?: string | null;
  sourceReferenceId: UUID;
  targetScopeType: TargetScopeType;
};

export type ActivityRow = Selectable<ActivitiesTable>;
export type ActivityTargetRow = Selectable<ActivityTargetsTable>;
export type ActivityProductUsageRow = Selectable<ActivityProductUsagesTable>;
export type InventoryMovementRow = Selectable<InventoryMovementsTable>;
export type QuarantinePeriodRow = Selectable<QuarantinePeriodsTable>;
export type TaskRow = Selectable<TasksTable>;

export interface ActivitiesRepository {
  create(input: CreateActivityInput, db?: DbHandle): Promise<Activity>;
  addTargets(inputs: CreateActivityTargetInput[], db?: DbHandle): Promise<ActivityTarget[]>;
  addProductUsages(inputs: CreateActivityProductUsageInput[], db?: DbHandle): Promise<ActivityProductUsage[]>;
  markProductUsageSideEffects(
    usageId: UUID,
    patch: { createdStockMovement?: boolean; createdQuarantine?: boolean; createdFollowupSuggestion?: boolean },
    db?: DbHandle
  ): Promise<void>;
  findById(accountId: UUID, activityId: UUID, db?: DbHandle): Promise<Activity | null>;
  getDetail(accountId: UUID, activityId: UUID, db?: DbHandle): Promise<ActivityDetail | null>;
  list(accountId: UUID, filters: ListActivitiesFilters, db?: DbHandle): Promise<PaginatedActivities>;
  createQuarantinePeriod(input: CreateQuarantinePeriodInput, db?: DbHandle): Promise<QuarantinePeriod>;
  createSuggestedTask(input: CreateSuggestedTaskInput, db?: DbHandle): Promise<SuggestedTask>;
  addTaskTargets(taskId: UUID, targets: TargetRef[], db?: DbHandle): Promise<void>;
  archiveActivity(accountId: UUID, activityId: UUID, db?: DbHandle): Promise<void>;
  deleteQuarantinePeriodsByActivity(accountId: UUID, activityId: UUID, db?: DbHandle): Promise<void>;
  deleteSuggestedTasksByActivity(accountId: UUID, activityId: UUID, db?: DbHandle): Promise<void>;
  listMovementsForReversal(activityId: UUID, db?: DbHandle): Promise<InventoryMovementForReversal[]>;
}
