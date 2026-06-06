import { sql } from "kysely";

import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  DashboardActivityItem,
  DashboardLowStockProductItem,
  DashboardPlaceItem,
  DashboardProblemItem,
  DashboardQuery,
  DashboardQuarantinePeriodItem,
  DashboardRepository,
  DashboardTaskItem
} from "./dashboard.types.js";

const DASHBOARD_LIMIT = 10;

export class KyselyDashboardRepository implements DashboardRepository {
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

  async listUpcomingTasks(accountId: UUID, query: DashboardQuery, db: DbHandle = this.dbHandle): Promise<DashboardTaskItem[]> {
    return this.listTasksByStatus(accountId, "planned", query, db);
  }

  async listSuggestedTasks(accountId: UUID, query: DashboardQuery, db: DbHandle = this.dbHandle): Promise<DashboardTaskItem[]> {
    return this.listTasksByStatus(accountId, "suggested", query, db);
  }

  async listActiveQuarantinePeriods(
    accountId: UUID,
    query: DashboardQuery,
    db: DbHandle = this.dbHandle
  ): Promise<DashboardQuarantinePeriodItem[]> {
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
      .where(sql<boolean>`current_date between qp.starts_on and qp.ends_on`)
      .orderBy("qp.ends_on", "asc")
      .orderBy("qp.id", "asc")
      .limit(DASHBOARD_LIMIT);

    if (query.placeId !== undefined) {
      builder = builder.where("qp.place_id", "=", query.placeId);
    }

    const rows = await builder.execute();

    return rows.map((row) => ({
      id: row.id,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      title: `Quarantine: ${row.product_name}`,
      activityId: row.activity_id,
      productId: row.product_id,
      placeId: row.place_id
    }));
  }

  async listRecentActivities(accountId: UUID, query: DashboardQuery, db: DbHandle = this.dbHandle): Promise<DashboardActivityItem[]> {
    let builder = db.db
      .selectFrom("activities as a")
      .select((eb) => [
        "a.id",
        "a.type",
        "a.performed_at",
        "a.place_id",
        eb
          .selectFrom("activity_targets as at")
          .select(sql<string>`count(*)`.as("target_count"))
          .whereRef("at.activity_id", "=", "a.id")
          .as("target_count")
      ])
      .where("a.account_id", "=", accountId)
      .orderBy("a.performed_at", "desc")
      .orderBy("a.id", "asc")
      .limit(DASHBOARD_LIMIT);

    if (query.placeId !== undefined) {
      builder = builder.where("a.place_id", "=", query.placeId);
    }

    const rows = await builder.execute();

    return rows.map((row) => ({
      id: row.id,
      type: row.type as DashboardActivityItem["type"],
      performedAt: row.performed_at,
      title: titleFromType(row.type),
      placeId: row.place_id,
      targetSummary: targetSummary(row.target_count)
    }));
  }

  async listOpenProblems(accountId: UUID, query: DashboardQuery, db: DbHandle = this.dbHandle): Promise<DashboardProblemItem[]> {
    let builder = db.db
      .selectFrom("problems")
      .select(["id", "type", "title", "status", "observed_at", "place_id"])
      .where("account_id", "=", accountId)
      .where("status", "in", ["open", "monitoring"])
      .orderBy("observed_at", "desc")
      .orderBy("id", "asc")
      .limit(DASHBOARD_LIMIT);

    if (query.placeId !== undefined) {
      builder = builder.where("place_id", "=", query.placeId);
    }

    const rows = await builder.execute();

    return rows.map((row) => ({
      id: row.id,
      type: row.type as DashboardProblemItem["type"],
      title: row.title,
      status: row.status as DashboardProblemItem["status"],
      observedAt: row.observed_at,
      placeId: row.place_id
    }));
  }

  async listLowStockProducts(
    accountId: UUID,
    _query: DashboardQuery,
    db: DbHandle = this.dbHandle
  ): Promise<DashboardLowStockProductItem[]> {
    const rows = await db.db
      .selectFrom("inventory_product_balances")
      .selectAll()
      .where("account_id", "=", accountId)
      .where("quantity_remaining", "<=", "0")
      .orderBy("product_name", "asc")
      .limit(DASHBOARD_LIMIT)
      .execute();

    return rows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      category: row.category as DashboardLowStockProductItem["category"],
      defaultUnit: row.default_unit as DashboardLowStockProductItem["defaultUnit"],
      quantityRemaining: row.quantity_remaining,
      activeLotCount: Number(row.active_lot_count),
      nextExpiryDate: row.next_expiry_date
    }));
  }

  async listPlaces(accountId: UUID, query: DashboardQuery, db: DbHandle = this.dbHandle): Promise<DashboardPlaceItem[]> {
    let builder = db.db
      .selectFrom("places")
      .select(["id", "name", "weather_enabled"])
      .where("account_id", "=", accountId)
      .where("archived_at", "is", null)
      .orderBy("name", "asc");

    if (query.placeId !== undefined) {
      builder = builder.where("id", "=", query.placeId);
    }

    const rows = await builder.execute();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      weatherEnabled: row.weather_enabled
    }));
  }

  private async listTasksByStatus(
    accountId: UUID,
    status: "planned" | "suggested",
    query: DashboardQuery,
    db: DbHandle
  ): Promise<DashboardTaskItem[]> {
    let builder = db.db
      .selectFrom("tasks as t")
      .select((eb) => [
        "t.id",
        "t.type",
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
      .where("t.status", "=", status)
      .orderBy("t.due_date", "asc")
      .orderBy("t.id", "asc")
      .limit(DASHBOARD_LIMIT);

    if (query.placeId !== undefined) {
      builder = builder.where("t.place_id", "=", query.placeId);
    }

    const rows = await builder.execute();

    return rows.map((row) => ({
      id: row.id,
      type: row.type as DashboardTaskItem["type"],
      dueDate: row.due_date,
      status: row.status as DashboardTaskItem["status"],
      title: titleFromType(row.type),
      placeId: row.place_id,
      targetSummary: targetSummary(row.target_count)
    }));
  }
}

function titleFromType(value: string): string {
  return value
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

function targetSummary(value: string | number | bigint | null): string {
  const count = Number(value ?? 0);
  return count === 1 ? "1 target" : `${count} targets`;
}
