import { sql, type Selectable } from "kysely";

import type {
  TaskDetailView,
  TaskRemindersTable,
  TasksTable,
  TaskTargetsTable,
  WeatherEventsTable
} from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { UUID } from "../auth/auth.types.js";
import type { TargetScopeType, TargetSummary, TargetType } from "../targets/target-resolver.types.js";
import type {
  CreateTaskInput,
  CreateTaskReminderInput,
  CreateTaskTargetInput,
  ListTasksFilters,
  PaginatedTasks,
  ReminderStatus,
  ReminderType,
  Task,
  TaskDetail,
  TaskListItem,
  TaskReminder,
  TaskTarget,
  TasksRepository,
  TaskSourceType,
  TaskStatus,
  TaskType,
  TaskWeatherEventSummary,
  UpdateTaskInput
} from "./tasks.types.js";

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
  "updated_at",
  "confirmed_at",
  "completed_at"
] as const;

const TASK_TARGET_COLUMNS = ["id", "task_id", "target_type", "target_id", "created_at"] as const;
const TASK_REMINDER_COLUMNS = ["id", "task_id", "reminder_type", "scheduled_for", "sent_at", "status", "created_at"] as const;
const WEATHER_EVENT_COLUMNS = [
  "id",
  "event_type",
  "forecasted_rain",
  "observed_rain",
  "user_confirmation_status",
  "created_at"
] as const;

type SelectedTask = Pick<Selectable<TasksTable>, (typeof TASK_COLUMNS)[number]>;
type SelectedTaskTarget = Pick<Selectable<TaskTargetsTable>, (typeof TASK_TARGET_COLUMNS)[number]>;
type SelectedTaskReminder = Pick<Selectable<TaskRemindersTable>, (typeof TASK_REMINDER_COLUMNS)[number]>;
type SelectedWeatherEvent = Pick<Selectable<WeatherEventsTable>, (typeof WEATHER_EVENT_COLUMNS)[number]>;
type SelectedTaskDetailView = Pick<
  Selectable<TaskDetailView>,
  | "id"
  | "place_id"
  | "type"
  | "due_date"
  | "notes"
  | "source_type"
  | "target_scope_type"
  | "status"
  | "target_count"
>;
type CountRow = { count: string | number | bigint };

export class KyselyTasksRepository implements TasksRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async list(accountId: UUID, filters: ListTasksFilters, db: DbHandle = this.dbHandle): Promise<PaginatedTasks> {
    let itemsQuery = db.db
      .selectFrom("task_detail_view")
      .select([
        "id",
        "place_id",
        "type",
        "due_date",
        "notes",
        "source_type",
        "target_scope_type",
        "status",
        "target_count"
      ])
      .where("account_id", "=", accountId)
      .orderBy("due_date", "asc")
      .orderBy("created_at", "desc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db
      .selectFrom("task_detail_view")
      .select(sql<string>`count(*)`.as("count"))
      .where("account_id", "=", accountId);

    if (filters.placeId !== undefined) {
      itemsQuery = itemsQuery.where("place_id", "=", filters.placeId);
      countQuery = countQuery.where("place_id", "=", filters.placeId);
    }

    if (filters.status !== undefined) {
      itemsQuery = itemsQuery.where("status", "=", filters.status);
      countQuery = countQuery.where("status", "=", filters.status);
    }

    if (filters.type !== undefined) {
      itemsQuery = itemsQuery.where("type", "=", filters.type);
      countQuery = countQuery.where("type", "=", filters.type);
    }

    if (filters.sourceType !== undefined) {
      itemsQuery = itemsQuery.where("source_type", "=", filters.sourceType);
      countQuery = countQuery.where("source_type", "=", filters.sourceType);
    }

    if (filters.dueFrom !== undefined) {
      itemsQuery = itemsQuery.where("due_date", ">=", filters.dueFrom);
      countQuery = countQuery.where("due_date", ">=", filters.dueFrom);
    }

    if (filters.dueTo !== undefined) {
      itemsQuery = itemsQuery.where("due_date", "<=", filters.dueTo);
      countQuery = countQuery.where("due_date", "<=", filters.dueTo);
    }

    const rows = await itemsQuery.execute();
    const totalRow = await countQuery.executeTakeFirst();

    return {
      items: rows.map(toTaskListItem),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async findById(accountId: UUID, taskId: UUID, db: DbHandle = this.dbHandle): Promise<Task | null> {
    const row = await db.db
      .selectFrom("tasks")
      .select(TASK_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "=", taskId)
      .executeTakeFirst();

    return row === undefined ? null : toTask(row);
  }

  async getDetail(accountId: UUID, taskId: UUID, db: DbHandle = this.dbHandle): Promise<TaskDetail | null> {
    const task = await this.findById(accountId, taskId, db);

    if (task === null) {
      return null;
    }

    const [targets, reminders, weatherEvents] = await Promise.all([
      this.listTargetSummaries(task.id, db),
      this.listReminders(task.id, db),
      this.listWeatherEvents(accountId, task.id, db)
    ]);

    return {
      ...task,
      targets,
      reminders,
      weatherEvents
    };
  }

  async create(input: CreateTaskInput, db: DbHandle = this.dbHandle): Promise<Task> {
    const row = await db.db
      .insertInto("tasks")
      .values({
        account_id: input.accountId,
        place_id: input.placeId,
        type: input.type,
        due_date: input.dueDate,
        notes: input.notes ?? null,
        source_type: input.sourceType,
        source_reference_id: input.sourceReferenceId ?? null,
        target_scope_type: input.targetScopeType,
        status: input.status,
        confirmed_at: input.confirmedAt ?? null,
        completed_at: input.completedAt ?? null
      })
      .returning(TASK_COLUMNS)
      .executeTakeFirstOrThrow();

    return toTask(row);
  }

  async update(accountId: UUID, taskId: UUID, patch: UpdateTaskInput, db: DbHandle = this.dbHandle): Promise<Task | null> {
    const values = {
      ...(patch.type === undefined ? {} : { type: patch.type }),
      ...(patch.dueDate === undefined ? {} : { due_date: patch.dueDate }),
      ...(patch.notes === undefined ? {} : { notes: patch.notes }),
      ...(patch.targetScopeType === undefined ? {} : { target_scope_type: patch.targetScopeType }),
      ...(patch.status === undefined ? {} : { status: patch.status }),
      ...(patch.confirmedAt === undefined ? {} : { confirmed_at: patch.confirmedAt }),
      ...(patch.completedAt === undefined ? {} : { completed_at: patch.completedAt })
    };

    const row = await db.db
      .updateTable("tasks")
      .set(values)
      .where("account_id", "=", accountId)
      .where("id", "=", taskId)
      .returning(TASK_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toTask(row);
  }

  async replaceTargets(taskId: UUID, targets: CreateTaskTargetInput[], db: DbHandle = this.dbHandle): Promise<TaskTarget[]> {
    await db.db.deleteFrom("task_targets").where("task_id", "=", taskId).execute();

    if (targets.length === 0) {
      return [];
    }

    const rows = await db.db
      .insertInto("task_targets")
      .values(targets.map((target) => ({ task_id: target.taskId, target_type: target.targetType, target_id: target.targetId })))
      .returning(TASK_TARGET_COLUMNS)
      .execute();

    return rows.map(toTaskTarget);
  }

  async createReminders(inputs: CreateTaskReminderInput[], db: DbHandle = this.dbHandle): Promise<TaskReminder[]> {
    if (inputs.length === 0) {
      return [];
    }

    const rows = await db.db
      .insertInto("task_reminders")
      .values(
        inputs.map((input) => ({
          task_id: input.taskId,
          reminder_type: input.reminderType,
          scheduled_for: input.scheduledFor,
          status: input.status
        }))
      )
      .returning(TASK_REMINDER_COLUMNS)
      .execute();

    return rows.map(toTaskReminder);
  }

  async listReminders(taskId: UUID, db: DbHandle = this.dbHandle): Promise<TaskReminder[]> {
    const rows = await db.db
      .selectFrom("task_reminders")
      .select(TASK_REMINDER_COLUMNS)
      .where("task_id", "=", taskId)
      .orderBy("scheduled_for", "asc")
      .execute();

    return rows.map(toTaskReminder);
  }

  async deleteReminders(taskId: UUID, db: DbHandle = this.dbHandle): Promise<void> {
    await db.db.deleteFrom("task_reminders").where("task_id", "=", taskId).execute();
  }

  async cancelScheduledReminders(taskId: UUID, db: DbHandle = this.dbHandle): Promise<void> {
    await db.db
      .updateTable("task_reminders")
      .set({ status: "canceled" })
      .where("task_id", "=", taskId)
      .where("status", "=", "scheduled")
      .execute();
  }

  async getPlaceTimezone(accountId: UUID, placeId: UUID | null, db: DbHandle = this.dbHandle): Promise<string | null> {
    if (placeId === null) {
      return null;
    }

    const row = await db.db
      .selectFrom("places")
      .select("timezone")
      .where("account_id", "=", accountId)
      .where("id", "=", placeId)
      .executeTakeFirst();

    return row?.timezone ?? null;
  }

  private async listTargetSummaries(taskId: UUID, db: DbHandle): Promise<TargetSummary[]> {
    const rows = await db.db
      .selectFrom("task_targets")
      .select(TASK_TARGET_COLUMNS)
      .where("task_id", "=", taskId)
      .orderBy("created_at", "asc")
      .execute();

    const summariesByKey = await this.loadTargetSummariesByKey(rows, db);

    return rows.map((row) => {
      const summary = summariesByKey.get(targetSummaryKey(row.target_type as TargetType, row.target_id));

      if (summary === undefined) {
        throw new AppError("INTERNAL_ERROR", "Persisted task target could not be loaded");
      }

      return summary;
    });
  }

  private async listWeatherEvents(accountId: UUID, taskId: UUID, db: DbHandle): Promise<TaskWeatherEventSummary[]> {
    const rows = await db.db
      .selectFrom("weather_events")
      .select(WEATHER_EVENT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("related_entity_type", "=", "task")
      .where("related_entity_id", "=", taskId)
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toTaskWeatherEventSummary);
  }

  private async loadTargetSummariesByKey(rows: SelectedTaskTarget[], db: DbHandle): Promise<Map<string, TargetSummary>> {
    const summaries = new Map<string, TargetSummary>();
    const placeIds = targetIdsForType(rows, "place");
    const bedIds = targetIdsForType(rows, "bed");
    const perennialIds = targetIdsForType(rows, "perennial");
    const yearlyPlantingIds = targetIdsForType(rows, "yearly_bed_planting");
    const persistentBedPlantIds = targetIdsForType(rows, "persistent_bed_plant");

    if (placeIds.length > 0) {
      const places = await db.db.selectFrom("places").select(["id", "name"]).where("id", "in", placeIds).execute();
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
      const beds = await db.db.selectFrom("beds").select(["id", "name", "place_id"]).where("id", "in", bedIds).execute();
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

function toTask(row: SelectedTask): Task {
  return {
    id: row.id,
    accountId: row.account_id,
    placeId: row.place_id,
    type: row.type as TaskType,
    dueDate: row.due_date,
    notes: row.notes,
    sourceType: row.source_type as TaskSourceType | null,
    sourceReferenceId: row.source_reference_id,
    targetScopeType: row.target_scope_type as TargetScopeType,
    status: row.status as TaskStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at,
    completedAt: row.completed_at
  };
}

function toTaskListItem(row: SelectedTaskDetailView): TaskListItem {
  return {
    id: row.id,
    placeId: row.place_id,
    type: row.type as TaskType,
    dueDate: row.due_date,
    status: row.status as TaskStatus,
    targetScopeType: row.target_scope_type as TargetScopeType,
    targetSummary: formatCountSummary(Number(row.target_count), "target"),
    sourceType: row.source_type as TaskSourceType | null,
    notes: row.notes
  };
}

function toTaskReminder(row: SelectedTaskReminder): TaskReminder {
  return {
    id: row.id,
    taskId: row.task_id,
    reminderType: row.reminder_type as ReminderType,
    scheduledFor: row.scheduled_for,
    sentAt: row.sent_at,
    status: row.status as ReminderStatus,
    createdAt: row.created_at
  };
}

function toTaskWeatherEventSummary(row: SelectedWeatherEvent): TaskWeatherEventSummary {
  return {
    id: row.id,
    eventType: row.event_type,
    forecastedRain: row.forecasted_rain,
    observedRain: row.observed_rain,
    userConfirmationStatus: row.user_confirmation_status,
    createdAt: row.created_at
  };
}

function toTaskTarget(row: SelectedTaskTarget): TaskTarget {
  return {
    id: row.id,
    taskId: row.task_id,
    targetType: row.target_type as TargetType,
    targetId: row.target_id,
    createdAt: row.created_at
  };
}

function targetIdsForType(rows: SelectedTaskTarget[], targetType: TargetType): UUID[] {
  return rows.filter((row) => row.target_type === targetType).map((row) => row.target_id);
}

function targetSummaryKey(targetType: TargetType, targetId: UUID): string {
  return `${targetType}:${targetId}`;
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
