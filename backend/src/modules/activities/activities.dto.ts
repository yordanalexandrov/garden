import type {
  ActivityDetail,
  ActivityListItem,
  ActivityProductUsage,
  CorrectActivityResult,
  CreateActivityResult,
  InventoryMovementSummary,
  QuarantinePeriod,
  SuggestedTask
} from "./activities.types.js";

export function toActivityListItemDto(item: ActivityListItem): ActivityListItemDto {
  return {
    id: item.id,
    placeId: item.placeId,
    placeName: item.placeName,
    type: item.type,
    performedAt: item.performedAt.toISOString(),
    targetSummary: item.targetSummary,
    productSummary: item.productSummary,
    sideEffects: item.sideEffects
  };
}

export function toCorrectActivityResultDto(result: CorrectActivityResult): CorrectActivityResultDto {
  return {
    activityId: result.activityId,
    correctionMovements: result.correctionMovements.map((movement) => ({
      movementId: movement.id,
      productId: movement.productId,
      productName: "", // correction movements do not carry product names
      inventoryLotId: movement.inventoryLotId,
      direction: movement.direction,
      quantity: movement.quantity,
      unit: movement.unit
    })),
    lotEffects: result.lotEffects,
    auditLog: {
      id: result.auditLogId
    },
    warnings: result.warnings
  };
}

export function toActivityDetailDto(activity: ActivityDetail): ActivityDetailDto {
  return {
    id: activity.id,
    placeId: activity.placeId,
    type: activity.type,
    performedAt: activity.performedAt.toISOString(),
    targetScopeType: activity.targetScopeType,
    targets: activity.targets,
    productUsages: activity.productUsages.map(toActivityProductUsageDto),
    inventoryMovements: activity.inventoryMovements.map(toInventoryMovementEffectDto),
    quarantinePeriods: activity.quarantinePeriods.map(toQuarantinePeriodDto),
    suggestedTasks: activity.suggestedTasks.map(toSuggestedTaskDto),
    notes: activity.notes
  };
}

export function toCreateActivityResultDto(result: CreateActivityResult): CreateActivityResultDto {
  return {
    activity: toActivityDetailDto(result.activity),
    inventoryEffects: result.inventoryEffects.map(toInventoryMovementEffectDto),
    quarantinePeriods: result.quarantinePeriods.map(toQuarantinePeriodDto),
    suggestedTasks: result.suggestedTasks.map(toSuggestedTaskDto),
    warnings: result.warnings
  };
}

function toActivityProductUsageDto(usage: ActivityProductUsage): ActivityProductUsageDto {
  return {
    id: usage.id,
    productId: usage.productId,
    productName: usage.productName,
    productUsageRuleId: usage.productUsageRuleId,
    quantityUsed: usage.quantityUsed,
    unit: usage.unit,
    createdStockMovement: usage.createdStockMovement,
    createdQuarantine: usage.createdQuarantine,
    createdFollowupSuggestion: usage.createdFollowupSuggestion,
    notes: usage.notes
  };
}

function toInventoryMovementEffectDto(movement: InventoryMovementSummary): InventoryEffectDto {
  return {
    movementId: movement.id,
    productId: movement.productId,
    productName: movement.productName,
    inventoryLotId: movement.inventoryLotId,
    quantity: movement.quantity,
    unit: movement.unit
  };
}

function toQuarantinePeriodDto(period: QuarantinePeriod): QuarantinePeriodDto {
  return {
    id: period.id,
    productId: period.productId,
    productName: period.productName,
    startsOn: period.startsOn,
    endsOn: period.endsOn
  };
}

function toSuggestedTaskDto(task: SuggestedTask): SuggestedTaskDto {
  return {
    id: task.id,
    type: task.type,
    dueDate: task.dueDate,
    status: task.status
  };
}

type ActivityListItemDto = Omit<ActivityListItem, "performedAt"> & {
  performedAt: string;
};

type ActivityProductUsageDto = {
  id: string;
  productId: string;
  productName: string;
  productUsageRuleId: string | null;
  quantityUsed: number;
  unit: string;
  createdStockMovement: boolean;
  createdQuarantine: boolean;
  createdFollowupSuggestion: boolean;
  notes: string | null;
};

type InventoryEffectDto = {
  movementId: string;
  productId: string;
  productName: string;
  inventoryLotId: string | null;
  direction?: string;
  quantity: number;
  unit: string;
};

type QuarantinePeriodDto = {
  id: string;
  productId: string;
  productName: string;
  startsOn: string;
  endsOn: string;
};

type SuggestedTaskDto = {
  id: string;
  type: string;
  dueDate: string;
  status: "suggested";
};

type ActivityDetailDto = {
  id: string;
  placeId: string | null;
  type: string;
  performedAt: string;
  targetScopeType: string;
  targets: ActivityDetail["targets"];
  productUsages: ActivityProductUsageDto[];
  inventoryMovements: InventoryEffectDto[];
  quarantinePeriods: QuarantinePeriodDto[];
  suggestedTasks: SuggestedTaskDto[];
  notes: string | null;
};

type CreateActivityResultDto = {
  activity: ActivityDetailDto;
  inventoryEffects: InventoryEffectDto[];
  quarantinePeriods: QuarantinePeriodDto[];
  suggestedTasks: SuggestedTaskDto[];
  warnings: string[];
};

type CorrectActivityResultDto = {
  activityId: string;
  correctionMovements: InventoryEffectDto[];
  lotEffects: CorrectActivityResult["lotEffects"];
  auditLog: { id: string };
  warnings: string[];
};
