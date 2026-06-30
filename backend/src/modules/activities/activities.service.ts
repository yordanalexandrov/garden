import type { DbClient, DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import { allocateInventoryFefo } from "../inventory/inventory-allocator.js";
import { assertSameInventoryUnit } from "../inventory/inventory-policy.js";
import type { InventoryRepository } from "../inventory/inventory.types.js";
import type { Product, ProductsRepository, ProductUsageRule } from "../products/products.types.js";
import type { ResolvedTarget, TargetRef, TargetResolver } from "../targets/target-resolver.types.js";
import type {
  ActivitiesRepository,
  ActivityType,
  ActivityDetail,
  ActivityCorrectionDirection,
  ActivityCorrectionMovementSummary,
  ActivityProductUsage,
  ActivityProductUsageInput,
  CorrectActivityRequest,
  CorrectActivityResult,
  CreateActivityRequest,
  CreateActivityResult,
  InventoryMovementForReversal,
  InventoryMovementSummary,
  ListActivitiesFilters,
  PaginatedActivities,
  QuarantinePeriod,
  SuggestedTask,
  TaskType
} from "./activities.types.js";

type ValidatedUsage = {
  input: ActivityProductUsageInput;
  product: Product;
  rule: ProductUsageRule | null;
};

export class ActivitiesService {
  constructor(
    private readonly activitiesRepository: ActivitiesRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly targetResolver: TargetResolver,
    private readonly dbClient: DbClient,
    private readonly auditService?: AuditService
  ) {}

  async listActivities(actor: AuthenticatedActor, filters: ListActivitiesFilters): Promise<PaginatedActivities> {
    return this.activitiesRepository.list(actor.accountId, filters);
  }

  async getActivity(actor: AuthenticatedActor, activityId: UUID): Promise<ActivityDetail> {
    const activity = await this.activitiesRepository.getDetail(actor.accountId, activityId);

    if (activity === null) {
      throw new AppError("NOT_FOUND", "Activity not found");
    }

    return activity;
  }

  async createActivity(actor: AuthenticatedActor, input: CreateActivityRequest): Promise<CreateActivityResult> {
    return this.dbClient.transaction(async (trx) => {
      const targetInput = {
        placeId: input.placeId,
        targetScopeType: input.targetScopeType,
        ...(input.targetSelection === undefined ? {} : { targetSelection: input.targetSelection })
      };
      const resolvedTargets = await this.targetResolver.resolveActivityTargets(actor.accountId, targetInput, trx);

      if (resolvedTargets.length === 0) {
        throw new AppError("BUSINESS_RULE_VIOLATION", "Activity target scope resolved to no targets");
      }

      const warnings: string[] = [];
      const validatedUsages = await this.validateProductUsages(actor.accountId, input.productUsages ?? [], warnings, trx);
      const activity = await this.activitiesRepository.create(
        {
          accountId: actor.accountId,
          placeId: input.placeId,
          type: input.type,
          performedAt: input.performedAt,
          targetScopeType: input.targetScopeType,
          ...(input.notes === undefined ? {} : { notes: input.notes })
        },
        trx
      );

      await this.activitiesRepository.addTargets(
        resolvedTargets.map((target) => ({
          activityId: activity.id,
          targetType: target.targetType,
          targetId: target.targetId
        })),
        trx
      );

      const productUsages = await this.activitiesRepository.addProductUsages(
        validatedUsages.map((usage) => ({
          activityId: activity.id,
          productId: usage.input.productId,
          productUsageRuleId: usage.input.productUsageRuleId ?? null,
          quantityUsed: usage.input.quantityUsed,
          unit: usage.input.unit,
          ...(usage.input.notes === undefined ? {} : { notes: usage.input.notes })
        })),
        trx
      );

      const inventoryEffects: InventoryMovementSummary[] = [];
      const quarantinePeriods: QuarantinePeriod[] = [];
      const suggestedTasks: SuggestedTask[] = [];

      for (const [index, productUsage] of productUsages.entries()) {
        const usage = validatedUsages[index];
        if (usage === undefined) {
          throw new AppError("INTERNAL_ERROR", "Activity product usage validation result is missing");
        }
        await this.consumeInventoryForUsage(
          actor.accountId,
          activity.id,
          productUsage,
          usage.input,
          input.performedAt,
          input.allowInventoryShortage,
          warnings,
          inventoryEffects,
          trx
        );

        if (usage.rule !== null) {
          const quarantine = await this.createQuarantineIfNeeded(
            actor.accountId,
            input.placeId,
            activity.id,
            productUsage,
            usage.rule,
            input.performedAt,
            trx
          );

          if (quarantine !== null) {
            quarantinePeriods.push(quarantine);
          }

          const task = await this.createSuggestedTaskIfNeeded(
            actor.accountId,
            input.placeId,
            activity.id,
            input.type,
            input.targetScopeType,
            resolvedTargets,
            usage.rule,
            input.performedAt,
            trx
          );

          if (task !== null) {
            suggestedTasks.push(task);
            await this.activitiesRepository.markProductUsageSideEffects(productUsage.id, { createdFollowupSuggestion: true }, trx);
          }
        }
      }

      await this.auditService?.logActorEvent(
        {
          actor,
          entityType: "activity",
          entityId: activity.id,
          action: "activity.created",
          afterJson: {
            activityId: activity.id,
            inventoryMovementsCount: inventoryEffects.length,
            quarantinePeriodsCount: quarantinePeriods.length,
            suggestedTasksCount: suggestedTasks.length
          }
        },
        trx
      );

      const detail = await this.activitiesRepository.getDetail(actor.accountId, activity.id, trx);

      if (detail === null) {
        throw new AppError("INTERNAL_ERROR", "Created activity could not be loaded");
      }

      return {
        activity: detail,
        inventoryEffects,
        quarantinePeriods,
        suggestedTasks,
        warnings
      };
    });
  }

  async correctActivity(actor: AuthenticatedActor, activityId: UUID, input: CorrectActivityRequest): Promise<CorrectActivityResult> {
    if (this.auditService === undefined) {
      throw new AppError("INTERNAL_ERROR", "Activity correction requires audit service");
    }

    const auditService = this.auditService;

    return this.dbClient.transaction(async (trx) => {
      const activity = await this.activitiesRepository.getDetail(actor.accountId, activityId, trx);

      if (activity === null) {
        throw new AppError("NOT_FOUND", "Activity not found");
      }

      if (activity.quarantinePeriods.length > 0 || activity.suggestedTasks.length > 0) {
        throw new AppError(
          "BUSINESS_RULE_VIOLATION",
          "Activities with quarantine periods or suggested tasks cannot be corrected by v1 inventory correction"
        );
      }

      const correctionMovements: ActivityCorrectionMovementSummary[] = [];
      const lotEffects: CorrectActivityResult["lotEffects"] = [];

      for (const correction of input.inventoryCorrections) {
        const originalMovement = await this.inventoryRepository.findMovementById(
          actor.accountId,
          correction.inventoryMovementId,
          trx
        );

        if (originalMovement === null || originalMovement.activityId !== activity.id) {
          throw new AppError("NOT_FOUND", "Inventory movement not found for activity");
        }

        if (originalMovement.movementType !== "consumption") {
          throw new AppError("BUSINESS_RULE_VIOLATION", "Only original consumption movements can be corrected");
        }

        if (originalMovement.inventoryLotId === null) {
          throw new AppError("BUSINESS_RULE_VIOLATION", "Only lot-bound inventory movements can be corrected");
        }

        assertSameInventoryUnit(correction.unit, originalMovement.unit);

        const lot = await this.inventoryRepository.findLotById(actor.accountId, originalMovement.inventoryLotId, trx);

        if (lot === null) {
          throw new AppError("NOT_FOUND", "Inventory lot not found");
        }

        if (lot.productId !== originalMovement.productId) {
          throw new AppError("BUSINESS_RULE_VIOLATION", "Inventory lot must belong to movement product");
        }

        const movement = await this.inventoryRepository.createMovement(
          {
            accountId: actor.accountId,
            productId: originalMovement.productId,
            inventoryLotId: lot.id,
            movementType: "correction",
            quantity: correction.quantity,
            unit: correction.unit,
            activityId: activity.id,
            occurredAt: new Date(),
            notes: formatCorrectionMovementNotes(correction.direction, correction.notes ?? input.reason)
          },
          trx
        );

        const updatedLot =
          correction.direction === "increase_lot"
            ? await this.inventoryRepository.incrementLotRemainingQuantity(actor.accountId, lot.id, correction.quantity, trx)
            : await this.inventoryRepository.decrementLotRemainingQuantity(actor.accountId, lot.id, correction.quantity, trx);

        if (updatedLot === null) {
          if (correction.direction === "decrease_lot") {
            throw new AppError("INVENTORY_SHORTAGE", "Inventory correction cannot make lot quantity negative", {
              quantity: ["Correction would make lot quantity negative"]
            });
          }

          throw new AppError("NOT_FOUND", "Inventory lot not found");
        }

        correctionMovements.push({
          id: movement.id,
          productId: movement.productId,
          inventoryLotId: movement.inventoryLotId,
          movementType: "correction",
          direction: correction.direction,
          quantity: movement.quantity,
          unit: movement.unit,
          activityId: movement.activityId,
          occurredAt: movement.occurredAt,
          notes: movement.notes,
          createdAt: movement.createdAt
        });
        lotEffects.push({
          inventoryLotId: lot.id,
          beforeQuantityRemaining:
            correction.direction === "increase_lot"
              ? updatedLot.quantityRemaining - correction.quantity
              : updatedLot.quantityRemaining + correction.quantity,
          afterQuantityRemaining: updatedLot.quantityRemaining
        });
      }

      const auditLog = await auditService.logActorEvent(
        {
          actor,
          entityType: "activity",
          entityId: activity.id,
          action: "activity.corrected",
          beforeJson: {
            activityId: activity.id,
            inventoryMovementsCount: activity.inventoryMovements.length
          },
          afterJson: {
            reason: input.reason,
            correctionMovementIds: correctionMovements.map((movement) => movement.id),
            lotEffects
          }
        },
        trx
      );

      return {
        activityId: activity.id,
        correctionMovements,
        lotEffects,
        auditLogId: auditLog.id,
        warnings: []
      };
    });
  }

  async archiveActivity(actor: AuthenticatedActor, activityId: UUID): Promise<void> {
    if (this.auditService === undefined) {
      throw new AppError("INTERNAL_ERROR", "Activity archive requires audit service");
    }

    const auditService = this.auditService;

    return this.dbClient.transaction(async (trx) => {
      const activity = await this.activitiesRepository.getDetail(actor.accountId, activityId, trx);

      if (activity === null) {
        throw new AppError("NOT_FOUND", "Activity not found");
      }

      // Load all movements (consumption + correction) to compute net restoration per lot,
      // correctly accounting for any prior correctActivity adjustments.
      const allMovements = await this.activitiesRepository.listMovementsForReversal(activityId, trx);

      // Net correction delta per lot: positive = already restored by correctActivity (reduce what we restore).
      const correctionNetByLot = computeCorrectionNetByLot(allMovements);

      const reversedLotIds: UUID[] = [];

      for (const movement of activity.inventoryMovements) {
        if (movement.inventoryLotId === null) {
          // Non-lot-bound consumption: no lot quantity was tracked, nothing to restore.
          continue;
        }

        const correctionNet = correctionNetByLot.get(movement.inventoryLotId) ?? 0;
        const netToRestore = movement.quantity - correctionNet;

        if (netToRestore <= 0) {
          // Prior corrections already fully restored this lot's stock.
          continue;
        }

        await this.inventoryRepository.createMovement(
          {
            accountId: actor.accountId,
            productId: movement.productId,
            inventoryLotId: movement.inventoryLotId,
            movementType: "correction",
            quantity: netToRestore,
            unit: movement.unit,
            activityId: activity.id,
            occurredAt: new Date(),
            notes: `Archive reversal for activity ${activity.id}`
          },
          trx
        );

        const updatedLot = await this.inventoryRepository.incrementLotRemainingQuantity(
          actor.accountId,
          movement.inventoryLotId,
          netToRestore,
          trx
        );

        if (updatedLot === null) {
          throw new AppError("NOT_FOUND", "Inventory lot not found or archived; cannot complete activity archive");
        }

        reversedLotIds.push(movement.inventoryLotId);
      }

      await this.activitiesRepository.deleteQuarantinePeriodsByActivity(actor.accountId, activityId, trx);
      await this.activitiesRepository.deleteSuggestedTasksByActivity(actor.accountId, activityId, trx);
      await this.activitiesRepository.archiveActivity(actor.accountId, activityId, trx);

      await auditService.logActorEvent(
        {
          actor,
          entityType: "activity",
          entityId: activity.id,
          action: "activity.archived",
          beforeJson: {
            activityId: activity.id,
            inventoryMovements: activity.inventoryMovements.map((m) => ({
              movementId: m.id,
              productId: m.productId,
              inventoryLotId: m.inventoryLotId,
              quantity: m.quantity,
              unit: m.unit
            })),
            quarantinePeriodsCount: activity.quarantinePeriods.length,
            suggestedTasksCount: activity.suggestedTasks.length
          },
          afterJson: {
            isArchived: true,
            reversedLotIds
          }
        },
        trx
      );
    });
  }

  private async validateProductUsages(
    accountId: UUID,
    inputs: ActivityProductUsageInput[],
    warnings: string[],
    db: DbHandle
  ): Promise<ValidatedUsage[]> {
    const usages: ValidatedUsage[] = [];

    for (const input of inputs) {
      const product = await this.productsRepository.findById(accountId, input.productId, db);

      if (product === null) {
        throw new AppError("NOT_FOUND", "Product not found");
      }

      let rule: ProductUsageRule | null = null;

      if (input.productUsageRuleId === undefined || input.productUsageRuleId === null) {
        warnings.push(`No product usage rule supplied for product ${product.id}; rule-derived quarantine and follow-up tasks were not created.`);
      } else {
        rule = await this.productsRepository.findUsageRuleById(accountId, input.productUsageRuleId, db);

        if (rule === null) {
          throw new AppError("NOT_FOUND", "Product usage rule not found");
        }

        if (rule.productId !== input.productId) {
          throw new AppError("BUSINESS_RULE_VIOLATION", "Product usage rule must belong to product", {
            productUsageRuleId: ["Rule does not belong to productId"]
          });
        }
      }

      usages.push({ input, product, rule });
    }

    return usages;
  }

  private async consumeInventoryForUsage(
    accountId: UUID,
    activityId: UUID,
    productUsage: ActivityProductUsage,
    input: ActivityProductUsageInput,
    performedAt: Date,
    allowInventoryShortage: boolean,
    warnings: string[],
    inventoryEffects: InventoryMovementSummary[],
    db: DbHandle
  ): Promise<void> {
    const lots = await this.inventoryRepository.listConsumableLotsForProduct(accountId, input.productId, db);
    const allocation = allocateInventoryFefo({
      requestedQuantity: input.quantityUsed,
      unit: input.unit,
      lots
    });

    if (allocation.uncoveredQuantity > 0 && !allowInventoryShortage) {
      throw new AppError("INVENTORY_SHORTAGE", "Insufficient inventory for product usage", {
        productId: ["Insufficient stock for requested quantity"],
        uncoveredQuantity: [allocation.uncoveredQuantity]
      });
    }

    if (allocation.uncoveredQuantity > 0) {
      warnings.push(
        `Inventory shortage allowed for product ${input.productId}; ${allocation.uncoveredQuantity} ${input.unit} was not covered by stock.`
      );
    }

    let createdMovement = false;
    const lotsById = new Map(lots.map((lot) => [lot.id, lot]));

    for (const allocated of allocation.allocations) {
      const lot = lotsById.get(allocated.inventoryLotId);

      if (lot === undefined) {
        throw new AppError("INTERNAL_ERROR", "Allocated inventory lot could not be loaded");
      }

      const movement = await this.inventoryRepository.createMovement(
        {
          accountId,
          productId: input.productId,
          inventoryLotId: lot.id,
          movementType: "consumption",
          quantity: allocated.quantity,
          unit: allocated.unit,
          activityId,
          occurredAt: performedAt,
          ...(input.notes === undefined ? {} : { notes: input.notes })
        },
        db
      );

      const updatedLot = await this.inventoryRepository.decrementLotRemainingQuantity(
        accountId,
        lot.id,
        allocated.quantity,
        db
      );

      if (updatedLot === null) {
        throw new AppError("INVENTORY_SHORTAGE", "Inventory lot no longer has enough stock", {
          inventoryLotId: ["Lot stock changed before consumption could be recorded"]
        });
      }

      createdMovement = true;
      inventoryEffects.push({
        id: movement.id,
        productId: movement.productId,
        productName: "", // not used from create result — detail comes from getDetail
        inventoryLotId: movement.inventoryLotId,
        movementType: "consumption",
        quantity: movement.quantity,
        unit: movement.unit,
        activityId: movement.activityId,
        occurredAt: movement.occurredAt,
        notes: movement.notes,
        createdAt: movement.createdAt
      });
    }

    if (createdMovement) {
      await this.activitiesRepository.markProductUsageSideEffects(productUsage.id, { createdStockMovement: true }, db);
    }
  }

  private async createQuarantineIfNeeded(
    accountId: UUID,
    placeId: UUID,
    activityId: UUID,
    productUsage: ActivityProductUsage,
    rule: ProductUsageRule,
    performedAt: Date,
    db: DbHandle
  ): Promise<QuarantinePeriod | null> {
    if (rule.quarantinePeriodDays === null) {
      return null;
    }

    const startsOn = dateOnly(performedAt);
    const endsOn = addDays(startsOn, rule.quarantinePeriodDays);
    const period = await this.activitiesRepository.createQuarantinePeriod(
      {
        accountId,
        placeId,
        activityId,
        activityProductUsageId: productUsage.id,
        productId: productUsage.productId,
        startsOn,
        endsOn,
        notes: rule.notes
      },
      db
    );

    await this.activitiesRepository.markProductUsageSideEffects(productUsage.id, { createdQuarantine: true }, db);

    return period;
  }

  private async createSuggestedTaskIfNeeded(
    accountId: UUID,
    placeId: UUID,
    activityId: UUID,
    activityType: ActivityType,
    targetScopeType: ActivityDetail["targetScopeType"],
    targets: ResolvedTarget[],
    rule: ProductUsageRule,
    performedAt: Date,
    db: DbHandle
  ): Promise<SuggestedTask | null> {
    if (rule.reapplicationIntervalDays === null) {
      return null;
    }

    const task = await this.activitiesRepository.createSuggestedTask(
      {
        accountId,
        placeId,
        type: suggestedTaskTypeForActivity(activityType),
        dueDate: addDays(dateOnly(performedAt), rule.reapplicationIntervalDays),
        notes: rule.notes,
        sourceReferenceId: activityId,
        targetScopeType
      },
      db
    );

    await this.activitiesRepository.addTaskTargets(task.id, targets.map(toTargetRef), db);

    return task;
  }
}

function suggestedTaskTypeForActivity(activityType: ActivityType): TaskType {
  if (activityType === "fertilizing") {
    return "fertilizing";
  }

  if (activityType === "pruning") {
    return "pruning";
  }

  if (activityType === "planting" || activityType === "transplanting") {
    return "planting";
  }

  return "spraying";
}

function toTargetRef(target: ResolvedTarget): TargetRef {
  return {
    targetType: target.targetType,
    targetId: target.targetId
  };
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return dateOnly(value);
}

// Returns per-lot net quantity already restored by prior correctActivity calls.
// Positive value = stock was put back (reduce archive restoration by this amount).
// Negative value = more stock was taken (increase archive restoration by this amount).
function computeCorrectionNetByLot(movements: InventoryMovementForReversal[]): Map<string, number> {
  const net = new Map<string, number>();
  for (const mv of movements) {
    if (mv.movementType !== "correction" || mv.inventoryLotId === null) {
      continue;
    }
    const current = net.get(mv.inventoryLotId) ?? 0;
    if (mv.notes?.includes("correction_direction=increase_lot")) {
      net.set(mv.inventoryLotId, current + mv.quantity);
    } else if (mv.notes?.includes("correction_direction=decrease_lot")) {
      net.set(mv.inventoryLotId, current - mv.quantity);
    }
  }
  return net;
}

function formatCorrectionMovementNotes(direction: ActivityCorrectionDirection, notes: string): string {
  return `correction_direction=${direction}; ${notes}`;
}
