import { sql } from "kysely";

import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import { targetSummary, titleFromType } from "../../shared/formatting/read-model-helpers.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  CalendarActivityItem,
  CalendarQuery,
  CalendarQuarantinePeriodItem,
  CalendarRepository,
  CalendarTaskItem,
  CalendarWeatherEventItem
} from "./calendar.types.js";

export class KyselyCalendarRepository implements CalendarRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async ensurePlaceBelongsToAccount(accountId: UUID, placeId: UUID, db: DbHandle = this.dbHandle): Promise<void> {
    const row = await db.db
      .selectFrom("places")
      .select("id")
      .where("account_id", "=", accountId)
      .where("id", "=", placeId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    if (row === undefined) {
      throw new AppError("NOT_FOUND", "Place not found");
    }
  }

  async listActivities(accountId: UUID, query: CalendarQuery, db: DbHandle = this.dbHandle): Promise<CalendarActivityItem[]> {
    let builder = db.db
      .selectFrom("activities as a")
      .select((eb) => [
        "a.id",
        "a.type as activity_type",
        "a.performed_at",
        "a.place_id",
        eb
          .selectFrom("activity_targets as at")
          .select(sql<string>`count(*)`.as("target_count"))
          .whereRef("at.activity_id", "=", "a.id")
          .as("target_count")
      ])
      .where("a.account_id", "=", accountId)
      .where(sql<boolean>`a.performed_at >= ${query.from}::date`)
      .where(sql<boolean>`a.performed_at < (${query.to}::date + interval '1 day')`)
      .orderBy("a.performed_at", "asc")
      .orderBy("a.id", "asc");

    if (query.placeId !== undefined) {
      builder = builder.where("a.place_id", "=", query.placeId);
    }

    const rows = await builder.execute();

    return rows.map((row) => ({
      id: row.id,
      type: "activity",
      activityType: row.activity_type as CalendarActivityItem["activityType"],
      dateTime: row.performed_at,
      title: titleFromType(row.activity_type),
      placeId: row.place_id,
      targetSummary: targetSummary(row.target_count)
    }));
  }

  async listTasks(accountId: UUID, query: CalendarQuery, db: DbHandle = this.dbHandle): Promise<CalendarTaskItem[]> {
    let builder = db.db
      .selectFrom("tasks as t")
      .select((eb) => [
        "t.id",
        "t.type as task_type",
        "t.due_date",
        "t.status",
        "t.place_id",
        eb
          .selectFrom("task_targets as tt")
          .select(sql<string>`count(*)`.as("target_count"))
          .whereRef("tt.task_id", "=", "t.id")
          .as("target_count")
      ])
      .where("t.account_id", "=", accountId)
      .where("t.due_date", ">=", query.from)
      .where("t.due_date", "<=", query.to)
      .orderBy("t.due_date", "asc")
      .orderBy("t.id", "asc");

    if (query.placeId !== undefined) {
      builder = builder.where("t.place_id", "=", query.placeId);
    }

    const rows = await builder.execute();

    return rows.map((row) => ({
      id: row.id,
      type: "task",
      taskType: row.task_type as CalendarTaskItem["taskType"],
      dueDate: row.due_date,
      status: row.status as CalendarTaskItem["status"],
      title: titleFromType(row.task_type),
      placeId: row.place_id,
      targetSummary: targetSummary(row.target_count)
    }));
  }

  async listQuarantinePeriods(
    accountId: UUID,
    query: CalendarQuery,
    db: DbHandle = this.dbHandle
  ): Promise<CalendarQuarantinePeriodItem[]> {
    let builder = db.db
      .selectFrom("quarantine_periods as qp")
      .innerJoin("products as p", "p.id", "qp.product_id")
      .select([
        "qp.id",
        "qp.starts_on",
        "qp.ends_on",
        "qp.activity_id",
        "qp.product_id",
        "qp.place_id",
        "p.name as product_name"
      ])
      .where("qp.account_id", "=", accountId)
      .where("qp.starts_on", "<=", query.to)
      .where("qp.ends_on", ">=", query.from)
      .orderBy("qp.starts_on", "asc")
      .orderBy("qp.id", "asc");

    if (query.placeId !== undefined) {
      builder = builder.where("qp.place_id", "=", query.placeId);
    }

    const rows = await builder.execute();

    return rows.map((row) => ({
      id: row.id,
      type: "quarantine",
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      title: `Quarantine: ${row.product_name}`,
      activityId: row.activity_id,
      productId: row.product_id,
      placeId: row.place_id
    }));
  }

  async listWeatherEvents(accountId: UUID, query: CalendarQuery, db: DbHandle = this.dbHandle): Promise<CalendarWeatherEventItem[]> {
    const eventDate = sql<string>`coalesce(t.due_date, a.performed_at::date, we.created_at::date)`;
    let builder = db.db
      .selectFrom("weather_events as we")
      .leftJoin("tasks as t", (join) =>
        join.onRef("t.id", "=", "we.related_entity_id").on("we.related_entity_type", "=", "task")
      )
      .leftJoin("activities as a", (join) =>
        join.onRef("a.id", "=", "we.related_entity_id").on("we.related_entity_type", "=", "activity")
      )
      .select(["we.id", "we.place_id", "we.event_type", "we.user_confirmation_status"])
      .select(eventDate.as("event_date"))
      .where("we.account_id", "=", accountId)
      .where(sql<boolean>`${eventDate} >= ${query.from}::date`)
      .where(sql<boolean>`${eventDate} <= ${query.to}::date`)
      .orderBy("event_date", "asc")
      .orderBy("we.id", "asc");

    if (query.placeId !== undefined) {
      builder = builder.where("we.place_id", "=", query.placeId);
    }

    const rows = await builder.execute();

    return rows.map((row) => ({
      id: row.id,
      type: "weather",
      date: row.event_date,
      eventType: row.event_type,
      userConfirmationStatus: row.user_confirmation_status,
      placeId: row.place_id
    }));
  }
}

