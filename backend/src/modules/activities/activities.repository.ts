import { sql, type Selectable } from "kysely";

import type {
  ActivitiesTable,
  ActivityProductUsagesTable,
  ActivityTargetsTable,
  InventoryMovementsTable,
  QuarantinePeriodsTable,
  TasksTable
} from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { UUID } from "../auth/auth.types.js";
import type { SimpleUnit } from "../products/products.types.js";
import type { TargetScopeType, TargetSummary, TargetType } from "../targets/target-resolver.types.js";
import type {
  ActivitiesRepository,
  Activity,
  ActivityDetail,
  ActivityProductUsage,
  ActivityTarget,
  ActivityType,
  CreateActivityInput,
  CreateActivityProductUsageInput,
  CreateActivityTargetInput,
  CreateQuarantinePeriodInput,
  CreateSuggestedTaskInput,
  InventoryMovementSummary,
  ListActivitiesFilters,
  PaginatedActivities,
  QuarantinePeriod,
  SuggestedTask,
  TaskType
} from "./activities.types.js";

const ACTIVITY_COLUMNS = [
  "id",
  "account_id",
  "place_id",
  "type",
  "performed_at",
  "target_scope_type",
  "notes",
  "created_at",
  "updated_at"
] as const;

const ACTIVITY_TARGET_COLUMNS = ["id", "activity_id", "target_type", "target_id", "created_at"] as const;

const ACTIVITY_PRODUCT_USAGE_COLUMNS = [
  "id",
  "activity_id",
  "product_id",
  "product_usage_rule_id",
  "quantity_used",
  "unit",
  "created_stock_movement",
  "created_quarantine",
  "created_followup_suggestion",
  "notes",
  "created_at"
] as const;

const INVENTORY_MOVEMENT_COLUMNS = [
  "id",
  "product_id",
  "inventory_lot_id",
  "movement_type",
  "quantity",
  "unit",
  "activity_id",
  "occurred_at",
  "notes",
  "created_at"
] as const;

const QUARANTINE_COLUMNS = [
  "id",
  "account_id",
  "place_id",
  "activity_id",
  "activity_product_usage_id",
  "product_id",
  "starts_on",
  "ends_on",
  "notes",
  "created_at"
] as const;

const TASK_COLUMNS = [
  "id",
  "account_id",
  "place_id",
  "type",
  "due_date",
  "notes",
  "source_type",
  "source_reference_id",
  "target_scope_type",
  "status",
  "created_at",
  "updated_at"
] as const;

type SelectedActivity = Pick<Selectable<ActivitiesTable>, (typeof ACTIVITY_COLUMNS)[number]>;
type SelectedActivityTarget = Pick<Selectable<ActivityTargetsTable>, (typeof ACTIVITY_TARGET_COLUMNS)[number]>;
type SelectedActivityProductUsage = Pick<
  Selectable<ActivityProductUsagesTable>,
  (typeof ACTIVITY_PRODUCT_USAGE_COLUMNS)[number]
>;
type SelectedInventoryMovement = Pick<Selectable<InventoryMovementsTable>, (typeof INVENTORY_MOVEMENT_COLUMNS)[number]>;
type SelectedQuarantinePeriod = Pick<Selectable<QuarantinePeriodsTable>, (typeof QUARANTINE_COLUMNS)[number]>;
type SelectedTask = Pick<Selectable<TasksTable>, (typeof TASK_COLUMNS)[number]>;
type CountRow = { count: string | number | bigint };

export class KyselyActivitiesRepository implements ActivitiesRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async create(input: CreateActivityInput, db: DbHandle = this.dbHandle): Promise<Activity> {
    const row = await db.db
      .insertInto("activities")
      .values({
        account_id: input.accountId,
        place_id: input.placeId,
        type: input.type,
        performed_at: input.performedAt,
        target_scope_type: input.targetScopeType,
        notes: input.notes ?? null
      })
      .returning(ACTIVITY_COLUMNS)
      .executeTakeFirstOrThrow();

    return toActivity(row);
  }

  async addTargets(inputs: CreateActivityTargetInput[], db: DbHandle = this.dbHandle): Promise<ActivityTarget[]> {
    if (inputs.length === 0) {
      return [];
    }

    const rows = await db.db
      .insertInto("activity_targets")
      .values(inputs.map((input) => ({ activity_id: input.activityId, target_type: input.targetType, target_id: input.targetId })))
      .returning(ACTIVITY_TARGET_COLUMNS)
      .execute();

    return rows.map(toActivityTarget);
  }

  async addProductUsages(
    inputs: CreateActivityProductUsageInput[],
    db: DbHandle = this.dbHandle
  ): Promise<ActivityProductUsage[]> {
    if (inputs.length === 0) {
      return [];
    }

    const rows = await db.db
      .insertInto("activity_product_usages")
      .values(
        inputs.map((input) => ({
          activity_id: input.activityId,
          product_id: input.productId,
          product_usage_rule_id: input.productUsageRuleId ?? null,
          quantity_used: input.quantityUsed,
          unit: input.unit,
          notes: input.notes ?? null
        }))
      )
      .returning(ACTIVITY_PRODUCT_USAGE_COLUMNS)
      .execute();

    return rows.map(toActivityProductUsage);
  }

  async markProductUsageSideEffects(
    usageId: UUID,
    patch: { createdStockMovement?: boolean; createdQuarantine?: boolean; createdFollowupSuggestion?: boolean },
    db: DbHandle = this.dbHandle
  ): Promise<void> {
    await db.db
      .updateTable("activity_product_usages")
      .set({
        ...(patch.createdStockMovement === undefined ? {} : { created_stock_movement: patch.createdStockMovement }),
        ...(patch.createdQuarantine === undefined ? {} : { created_quarantine: patch.createdQuarantine }),
        ...(patch.createdFollowupSuggestion === undefined
          ? {}
          : { created_followup_suggestion: patch.createdFollowupSuggestion })
      })
      .where("id", "=", usageId)
      .execute();
  }

  async archiveActivity(accountId: UUID, activityId: UUID, db: DbHandle = this.dbHandle): Promise<void> {
    await db.db
      .updateTable("activities")
      .set({ is_archived: true })
      .where("account_id", "=", accountId)
      .where("id", "=", activityId)
      .execute();
  }

  async deleteQuarantinePeriodsByActivity(activityId: UUID, db: DbHandle = this.dbHandle): Promise<void> {
    await db.db.deleteFrom("quarantine_periods").where("activity_id", "=", activityId).execute();
  }

  async deleteSuggestedTasksByActivity(accountId: UUID, activityId: UUID, db: DbHandle = this.dbHandle): Promise<void> {
    await db.db
      .deleteFrom("tasks")
      .where("account_id", "=", accountId)
      .where("source_type", "=", "activity")
      .where("source_reference_id", "=", activityId)
      .where("status", "=", "suggested")
      .execute();
  }

  async findById(accountId: UUID, activityId: UUID, db: DbHandle = this.dbHandle): Promise<Activity | null> {
    const row = await db.db
      .selectFrom("activities")
      .select(ACTIVITY_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "=", activityId)
      .where("is_archived", "=", false)
      .executeTakeFirst();

    return row === undefined ? null : toActivity(row);
  }

  async list(accountId: UUID, filters: ListActivitiesFilters, db: DbHandle = this.dbHandle): Promise<PaginatedActivities> {
    let itemsQuery = db.db
      .selectFrom("activity_detail_view as adv")
      .leftJoin("places as p", "p.id", "adv.place_id")
      .select((eb) => [
        "adv.id as id",
        "adv.place_id as place_id",
        "p.name as place_name",
        "adv.type as type",
        "adv.performed_at as performed_at",
        "adv.target_count as target_count",
        "adv.inventory_movement_count as inventory_movement_count",
        "adv.quarantine_count as quarantine_count",
        "adv.followup_task_count as followup_task_count",
        eb
          .selectFrom("activity_product_usages as apu")
          .innerJoin("products as pr", "pr.id", "apu.product_id")
          .select(sql<string>`string_agg(distinct pr.name, ', ' order by pr.name)`.as("product_summary"))
          .whereRef("apu.activity_id", "=", "adv.id")
          .as("product_summary")
      ])
      .where("adv.account_id", "=", accountId)
      .orderBy("adv.performed_at", "desc")
      .orderBy("adv.created_at", "desc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db
      .selectFrom("activity_detail_view as adv")
      .select(sql<string>`count(*)`.as("count"))
      .where("adv.account_id", "=", accountId);

    if (filters.placeId !== undefined) {
      itemsQuery = itemsQuery.where("adv.place_id", "=", filters.placeId);
      countQuery = countQuery.where("adv.place_id", "=", filters.placeId);
    }

    if (filters.type !== undefined) {
      itemsQuery = itemsQuery.where("adv.type", "=", filters.type);
      countQuery = countQuery.where("adv.type", "=", filters.type);
    }

    if (filters.from !== undefined) {
      itemsQuery = itemsQuery.where("adv.performed_at", ">=", filters.from);
      countQuery = countQuery.where("adv.performed_at", ">=", filters.from);
    }

    if (filters.to !== undefined) {
      itemsQuery = itemsQuery.where("adv.performed_at", "<=", filters.to);
      countQuery = countQuery.where("adv.performed_at", "<=", filters.to);
    }

    if (filters.targetType !== undefined && filters.targetId !== undefined) {
      itemsQuery = itemsQuery.where((eb) =>
        eb.exists(
          eb
            .selectFrom("activity_targets as at")
            .select("at.id")
            .whereRef("at.activity_id", "=", "adv.id")
            .where("at.target_type", "=", filters.targetType!)
            .where("at.target_id", "=", filters.targetId!)
        )
      );
      countQuery = countQuery.where((eb) =>
        eb.exists(
          eb
            .selectFrom("activity_targets as at")
            .select("at.id")
            .whereRef("at.activity_id", "=", "adv.id")
            .where("at.target_type", "=", filters.targetType!)
            .where("at.target_id", "=", filters.targetId!)
        )
      );
    }

    const rows = await itemsQuery.execute();
    const totalRow = await countQuery.executeTakeFirst();

    return {
      items: rows.map((row) => ({
        id: row.id,
        placeId: row.place_id,
        placeName: row.place_name,
        type: row.type as ActivityType,
        performedAt: row.performed_at,
        targetSummary: formatCountSummary(Number(row.target_count), "target"),
        productSummary: row.product_summary,
        sideEffects: {
          inventoryMovementsCount: Number(row.inventory_movement_count),
          quarantinePeriodsCount: Number(row.quarantine_count),
          suggestedTasksCount: Number(row.followup_task_count),
          warnings: []
        }
      })),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async getDetail(accountId: UUID, activityId: UUID, db: DbHandle = this.dbHandle): Promise<ActivityDetail | null> {
    const activity = await this.findById(accountId, activityId, db);

    if (activity === null) {
      return null;
    }

    const [targets, productUsages, inventoryMovements, quarantinePeriods, suggestedTasks] = await Promise.all([
      this.listTargetSummaries(activityId, db),
      this.listProductUsages(activityId, db),
      this.listInventoryMovements(activityId, db),
      this.listQuarantinePeriods(activityId, db),
      this.listSuggestedTasks(accountId, activityId, db)
    ]);

    return {
      ...activity,
      targets,
      productUsages,
      inventoryMovements,
      quarantinePeriods,
      suggestedTasks
    };
  }

  async createQuarantinePeriod(
    input: CreateQuarantinePeriodInput,
    db: DbHandle = this.dbHandle
  ): Promise<QuarantinePeriod> {
    const row = await db.db
      .insertInto("quarantine_periods")
      .values({
        account_id: input.accountId,
        place_id: input.placeId,
        activity_id: input.activityId,
        activity_product_usage_id: input.activityProductUsageId,
        product_id: input.productId,
        starts_on: input.startsOn,
        ends_on: input.endsOn,
        notes: input.notes ?? null
      })
      .returning(QUARANTINE_COLUMNS)
      .executeTakeFirstOrThrow();

    return toQuarantinePeriod(row);
  }

  async createSuggestedTask(input: CreateSuggestedTaskInput, db: DbHandle = this.dbHandle): Promise<SuggestedTask> {
    const row = await db.db
      .insertInto("tasks")
      .values({
        account_id: input.accountId,
        place_id: input.placeId,
        type: input.type,
        due_date: input.dueDate,
        notes: input.notes ?? null,
        source_type: "activity",
        source_reference_id: input.sourceReferenceId,
        target_scope_type: input.targetScopeType,
        status: "suggested"
      })
      .returning(TASK_COLUMNS)
      .executeTakeFirstOrThrow();

    return toSuggestedTask(row);
  }

  async addTaskTargets(taskId: UUID, targets: { targetType: TargetType; targetId: UUID }[], db: DbHandle = this.dbHandle): Promise<void> {
    if (targets.length === 0) {
      return;
    }

    await db.db
      .insertInto("task_targets")
      .values(targets.map((target) => ({ task_id: taskId, target_type: target.targetType, target_id: target.targetId })))
      .execute();
  }

  private async listProductUsages(activityId: UUID, db: DbHandle): Promise<ActivityProductUsage[]> {
    const rows = await db.db
      .selectFrom("activity_product_usages")
      .select(ACTIVITY_PRODUCT_USAGE_COLUMNS)
      .where("activity_id", "=", activityId)
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toActivityProductUsage);
  }

  private async listInventoryMovements(activityId: UUID, db: DbHandle): Promise<InventoryMovementSummary[]> {
    const rows = await db.db
      .selectFrom("inventory_movements")
      .select(INVENTORY_MOVEMENT_COLUMNS)
      .where("activity_id", "=", activityId)
      .where("movement_type", "=", "consumption")
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toInventoryMovementSummary);
  }

  private async listQuarantinePeriods(activityId: UUID, db: DbHandle): Promise<QuarantinePeriod[]> {
    const rows = await db.db
      .selectFrom("quarantine_periods")
      .select(QUARANTINE_COLUMNS)
      .where("activity_id", "=", activityId)
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toQuarantinePeriod);
  }

  private async listSuggestedTasks(accountId: UUID, activityId: UUID, db: DbHandle): Promise<SuggestedTask[]> {
    const rows = await db.db
      .selectFrom("tasks")
      .select(TASK_COLUMNS)
      .where("account_id", "=", accountId)
      .where("source_type", "=", "activity")
      .where("source_reference_id", "=", activityId)
      .where("status", "=", "suggested")
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toSuggestedTask);
  }

  private async listTargetSummaries(activityId: UUID, db: DbHandle): Promise<TargetSummary[]> {
    const rows = await db.db
      .selectFrom("activity_targets")
      .select(ACTIVITY_TARGET_COLUMNS)
      .where("activity_id", "=", activityId)
      .orderBy("created_at", "asc")
      .execute();

    const summariesByKey = await this.loadTargetSummariesByKey(rows, db);

    return rows.map((row) => {
      const summary = summariesByKey.get(targetSummaryKey(row.target_type as TargetType, row.target_id));

      if (summary === undefined) {
        throw new AppError("INTERNAL_ERROR", "Persisted activity target could not be loaded");
      }

      return summary;
    });
  }

  private async loadTargetSummariesByKey(
    rows: SelectedActivityTarget[],
    db: DbHandle
  ): Promise<Map<string, TargetSummary>> {
    const summaries = new Map<string, TargetSummary>();
    const placeIds = targetIdsForType(rows, "place");
    const bedIds = targetIdsForType(rows, "bed");
    const perennialIds = targetIdsForType(rows, "perennial");
    const yearlyPlantingIds = targetIdsForType(rows, "yearly_bed_planting");
    const persistentBedPlantIds = targetIdsForType(rows, "persistent_bed_plant");

    if (placeIds.length > 0) {
      const places = await db.db
        .selectFrom("places")
        .select(["id", "name"])
        .where("id", "in", placeIds)
        .execute();
      for (const place of places) {
        summaries.set(targetSummaryKey("place", place.id), {
          targetType: "place",
          targetId: place.id,
          label: place.name,
          placeId: place.id
        });
      }
    }

    if (bedIds.length > 0) {
      const beds = await db.db
        .selectFrom("beds")
        .select(["id", "name", "place_id"])
        .where("id", "in", bedIds)
        .execute();
      for (const bed of beds) {
        summaries.set(targetSummaryKey("bed", bed.id), {
          targetType: "bed",
          targetId: bed.id,
          label: bed.name,
          placeId: bed.place_id
        });
      }
    }

    if (perennialIds.length > 0) {
      const perennials = await db.db
        .selectFrom("perennials")
        .leftJoin("plants", "plants.id", "perennials.plant_id")
        .select(["perennials.id", "perennials.label", "perennials.place_id", "plants.common_name", "plants.variety"])
        .where("perennials.id", "in", perennialIds)
        .execute();
      for (const perennial of perennials) {
        summaries.set(targetSummaryKey("perennial", perennial.id), {
          targetType: "perennial",
          targetId: perennial.id,
          label: perennial.label ?? formatPlantName(perennial.common_name, perennial.variety),
          placeId: perennial.place_id
        });
      }
    }

    if (yearlyPlantingIds.length > 0) {
      const plantings = await db.db
        .selectFrom("yearly_bed_plantings")
        .innerJoin("beds", "beds.id", "yearly_bed_plantings.bed_id")
        .leftJoin("plants", "plants.id", "yearly_bed_plantings.plant_id")
        .select(["yearly_bed_plantings.id", "beds.place_id", "yearly_bed_plantings.year", "plants.common_name", "plants.variety"])
        .where("yearly_bed_plantings.id", "in", yearlyPlantingIds)
        .execute();
      for (const planting of plantings) {
        const plantName = formatPlantName(planting.common_name, planting.variety);
        summaries.set(targetSummaryKey("yearly_bed_planting", planting.id), {
          targetType: "yearly_bed_planting",
          targetId: planting.id,
          label: `${plantName ?? "Yearly planting"} ${planting.year}`,
          placeId: planting.place_id
        });
      }
    }

    if (persistentBedPlantIds.length > 0) {
      const persistentPlants = await db.db
        .selectFrom("persistent_bed_plants")
        .innerJoin("beds", "beds.id", "persistent_bed_plants.bed_id")
        .leftJoin("plants", "plants.id", "persistent_bed_plants.plant_id")
        .select(["persistent_bed_plants.id", "beds.place_id", "plants.common_name", "plants.variety"])
        .where("persistent_bed_plants.id", "in", persistentBedPlantIds)
        .execute();
      for (const persistent of persistentPlants) {
        summaries.set(targetSummaryKey("persistent_bed_plant", persistent.id), {
          targetType: "persistent_bed_plant",
          targetId: persistent.id,
          label: formatPlantName(persistent.common_name, persistent.variety),
          placeId: persistent.place_id
        });
      }
    }

    return summaries;
  }
}

function targetIdsForType(rows: SelectedActivityTarget[], targetType: TargetType): UUID[] {
  return rows.filter((row) => row.target_type === targetType).map((row) => row.target_id);
}

function targetSummaryKey(targetType: TargetType, targetId: UUID): string {
  return `${targetType}:${targetId}`;
}

function toActivity(row: SelectedActivity): Activity {
  return {
    id: row.id,
    accountId: row.account_id,
    placeId: row.place_id,
    type: row.type as ActivityType,
    performedAt: row.performed_at,
    targetScopeType: row.target_scope_type as TargetScopeType,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toActivityTarget(row: SelectedActivityTarget): ActivityTarget {
  return {
    id: row.id,
    activityId: row.activity_id,
    targetType: row.target_type as TargetType,
    targetId: row.target_id,
    createdAt: row.created_at
  };
}

function toActivityProductUsage(row: SelectedActivityProductUsage): ActivityProductUsage {
  return {
    id: row.id,
    activityId: row.activity_id,
    productId: row.product_id,
    productUsageRuleId: row.product_usage_rule_id,
    quantityUsed: Number(row.quantity_used),
    unit: row.unit as SimpleUnit,
    createdStockMovement: row.created_stock_movement,
    createdQuarantine: row.created_quarantine,
    createdFollowupSuggestion: row.created_followup_suggestion,
    notes: row.notes,
    createdAt: row.created_at
  };
}

function toInventoryMovementSummary(row: SelectedInventoryMovement): InventoryMovementSummary {
  return {
    id: row.id,
    productId: row.product_id,
    inventoryLotId: row.inventory_lot_id,
    movementType: "consumption",
    quantity: Number(row.quantity),
    unit: row.unit as SimpleUnit,
    activityId: row.activity_id,
    occurredAt: row.occurred_at,
    notes: row.notes,
    createdAt: row.created_at
  };
}

function toQuarantinePeriod(row: SelectedQuarantinePeriod): QuarantinePeriod {
  return {
    id: row.id,
    accountId: row.account_id,
    placeId: row.place_id,
    activityId: row.activity_id,
    activityProductUsageId: row.activity_product_usage_id,
    productId: row.product_id,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    notes: row.notes,
    createdAt: row.created_at
  };
}

function toSuggestedTask(row: SelectedTask): SuggestedTask {
  return {
    id: row.id,
    accountId: row.account_id,
    placeId: row.place_id,
    type: row.type as TaskType,
    dueDate: row.due_date,
    notes: row.notes,
    sourceType: "activity",
    sourceReferenceId: row.source_reference_id as UUID,
    targetScopeType: row.target_scope_type as TargetScopeType,
    status: "suggested",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toCount(row: CountRow | undefined): number {
  return row === undefined ? 0 : Number(row.count);
}

function formatCountSummary(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function formatPlantName(commonName: string | null | undefined, variety: string | null | undefined): string | null {
  if (commonName === null || commonName === undefined) {
    return null;
  }

  return variety === null || variety === undefined ? commonName : `${commonName} - ${variety}`;
}
