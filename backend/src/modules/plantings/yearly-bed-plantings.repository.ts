import { sql, type Selectable, type Updateable } from "kysely";

import type { PlantsTable, YearlyBedPlantingsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  CreateYearlyBedPlantingInput,
  ListYearlyBedPlantingsFilters,
  PaginatedYearlyBedPlantings,
  UpdateYearlyBedPlantingInput,
  YearlyBedPlanting,
  YearlyBedPlantingsRepository,
  YearlyBedPlantingWithPlant
} from "./yearly-bed-plantings.types.js";

const YEARLY_BED_PLANTING_COLUMNS = [
  "id",
  "account_id",
  "bed_id",
  "plant_id",
  "year",
  "quantity",
  "notes",
  "status",
  "created_at",
  "updated_at",
  "archived_at"
] as const;

const YEARLY_BED_PLANTING_WITH_PLANT_COLUMNS = [
  "yearly_bed_plantings.id",
  "yearly_bed_plantings.account_id",
  "yearly_bed_plantings.bed_id",
  "yearly_bed_plantings.plant_id",
  "yearly_bed_plantings.year",
  "yearly_bed_plantings.quantity",
  "yearly_bed_plantings.notes",
  "yearly_bed_plantings.status",
  "yearly_bed_plantings.created_at",
  "yearly_bed_plantings.updated_at",
  "yearly_bed_plantings.archived_at",
  "plants.common_name",
  "plants.variety"
] as const;

const CURRENT_YEARLY_BED_PLANTING_STATUSES = ["planned", "planted", "harvested"] as const;

type SelectedYearlyBedPlanting = Pick<
  Selectable<YearlyBedPlantingsTable>,
  (typeof YEARLY_BED_PLANTING_COLUMNS)[number]
>;
type SelectedYearlyBedPlantingWithPlant = SelectedYearlyBedPlanting & Pick<Selectable<PlantsTable>, "common_name" | "variety">;
type CountRow = { count: string | number | bigint };

export class KyselyYearlyBedPlantingsRepository implements YearlyBedPlantingsRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async listByBed(
    accountId: UUID,
    bedId: UUID,
    filters: ListYearlyBedPlantingsFilters,
    db: DbHandle = this.dbHandle
  ): Promise<PaginatedYearlyBedPlantings> {
    let itemsQuery = db.db
      .selectFrom("yearly_bed_plantings")
      .innerJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "yearly_bed_plantings.plant_id")
          .onRef("plants.account_id", "=", "yearly_bed_plantings.account_id")
      )
      .select(YEARLY_BED_PLANTING_WITH_PLANT_COLUMNS)
      .where("yearly_bed_plantings.account_id", "=", accountId)
      .where("yearly_bed_plantings.bed_id", "=", bedId)
      .orderBy("yearly_bed_plantings.year", "desc")
      .orderBy("plants.common_name", "asc")
      .orderBy("plants.variety", "asc")
      .orderBy("yearly_bed_plantings.created_at", "asc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db
      .selectFrom("yearly_bed_plantings")
      .innerJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "yearly_bed_plantings.plant_id")
          .onRef("plants.account_id", "=", "yearly_bed_plantings.account_id")
      )
      .select(sql<string>`count(*)`.as("count"))
      .where("yearly_bed_plantings.account_id", "=", accountId)
      .where("yearly_bed_plantings.bed_id", "=", bedId);

    if (filters.year !== undefined) {
      itemsQuery = itemsQuery.where("yearly_bed_plantings.year", "=", filters.year);
      countQuery = countQuery.where("yearly_bed_plantings.year", "=", filters.year);
    }

    if (filters.status === undefined) {
      itemsQuery = itemsQuery
        .where("yearly_bed_plantings.archived_at", "is", null)
        .where("yearly_bed_plantings.status", "!=", "archived");
      countQuery = countQuery
        .where("yearly_bed_plantings.archived_at", "is", null)
        .where("yearly_bed_plantings.status", "!=", "archived");
    } else {
      itemsQuery = itemsQuery.where("yearly_bed_plantings.status", "=", filters.status);
      countQuery = countQuery.where("yearly_bed_plantings.status", "=", filters.status);

      if (filters.status === "archived") {
        itemsQuery = itemsQuery.where("yearly_bed_plantings.archived_at", "is not", null);
        countQuery = countQuery.where("yearly_bed_plantings.archived_at", "is not", null);
      } else {
        itemsQuery = itemsQuery.where("yearly_bed_plantings.archived_at", "is", null);
        countQuery = countQuery.where("yearly_bed_plantings.archived_at", "is", null);
      }
    }

    const rows = await itemsQuery.execute();
    const totalRow = await countQuery.executeTakeFirst();

    return {
      items: rows.map(toYearlyBedPlantingWithPlant),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async listByBedAndYear(
    accountId: UUID,
    bedId: UUID,
    year: number,
    db: DbHandle = this.dbHandle
  ): Promise<YearlyBedPlanting[]> {
    const rows = await db.db
      .selectFrom("yearly_bed_plantings")
      .select(YEARLY_BED_PLANTING_COLUMNS)
      .where("account_id", "=", accountId)
      .where("bed_id", "=", bedId)
      .where("year", "=", year)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toYearlyBedPlanting);
  }

  async listCurrentByBedAndYear(
    accountId: UUID,
    bedId: UUID,
    year: number,
    db: DbHandle = this.dbHandle
  ): Promise<YearlyBedPlanting[]> {
    const rows = await db.db
      .selectFrom("yearly_bed_plantings")
      .select(YEARLY_BED_PLANTING_COLUMNS)
      .where("account_id", "=", accountId)
      .where("bed_id", "=", bedId)
      .where("year", "=", year)
      .where("status", "in", CURRENT_YEARLY_BED_PLANTING_STATUSES)
      .where("archived_at", "is", null)
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toYearlyBedPlanting);
  }

  async findById(accountId: UUID, id: UUID, db: DbHandle = this.dbHandle): Promise<YearlyBedPlantingWithPlant | null> {
    const row = await db.db
      .selectFrom("yearly_bed_plantings")
      .innerJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "yearly_bed_plantings.plant_id")
          .onRef("plants.account_id", "=", "yearly_bed_plantings.account_id")
      )
      .select(YEARLY_BED_PLANTING_WITH_PLANT_COLUMNS)
      .where("yearly_bed_plantings.account_id", "=", accountId)
      .where("yearly_bed_plantings.id", "=", id)
      .where("yearly_bed_plantings.archived_at", "is", null)
      .where("yearly_bed_plantings.status", "!=", "archived")
      .executeTakeFirst();

    return row === undefined ? null : toYearlyBedPlantingWithPlant(row);
  }

  async findManyByIds(accountId: UUID, ids: UUID[], db: DbHandle = this.dbHandle): Promise<YearlyBedPlanting[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await db.db
      .selectFrom("yearly_bed_plantings")
      .select(YEARLY_BED_PLANTING_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "in", ids)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toYearlyBedPlanting);
  }

  async create(input: CreateYearlyBedPlantingInput, db: DbHandle = this.dbHandle): Promise<YearlyBedPlanting> {
    const row = await db.db
      .insertInto("yearly_bed_plantings")
      .values({
        account_id: input.accountId,
        bed_id: input.bedId,
        plant_id: input.plantId,
        year: input.year,
        quantity: input.quantity ?? null,
        notes: input.notes ?? null,
        status: input.status
      })
      .returning(YEARLY_BED_PLANTING_COLUMNS)
      .executeTakeFirstOrThrow();

    return toYearlyBedPlanting(row);
  }

  async update(
    accountId: UUID,
    id: UUID,
    patch: UpdateYearlyBedPlantingInput,
    db: DbHandle = this.dbHandle
  ): Promise<YearlyBedPlanting | null> {
    const row = await db.db
      .updateTable("yearly_bed_plantings")
      .set(toYearlyBedPlantingUpdate(patch))
      .where("account_id", "=", accountId)
      .where("id", "=", id)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .returning(YEARLY_BED_PLANTING_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toYearlyBedPlanting(row);
  }

  async archive(accountId: UUID, id: UUID, db: DbHandle = this.dbHandle): Promise<boolean> {
    const row = await db.db
      .updateTable("yearly_bed_plantings")
      .set({
        status: "archived",
        archived_at: new Date()
      })
      .where("account_id", "=", accountId)
      .where("id", "=", id)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .returning("id")
      .executeTakeFirst();

    return row !== undefined;
  }
}

function toYearlyBedPlanting(row: SelectedYearlyBedPlanting): YearlyBedPlanting {
  return {
    id: row.id,
    accountId: row.account_id,
    bedId: row.bed_id,
    plantId: row.plant_id,
    year: row.year,
    quantity: toNullableNumber(row.quantity),
    notes: row.notes,
    status: row.status as YearlyBedPlanting["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at
  };
}

function toYearlyBedPlantingWithPlant(row: SelectedYearlyBedPlantingWithPlant): YearlyBedPlantingWithPlant {
  return {
    ...toYearlyBedPlanting(row),
    plantName: formatPlantName(row.common_name, row.variety)
  };
}

function toYearlyBedPlantingUpdate(patch: UpdateYearlyBedPlantingInput): Updateable<YearlyBedPlantingsTable> {
  const update: Updateable<YearlyBedPlantingsTable> = {};

  if (patch.plantId !== undefined) {
    update.plant_id = patch.plantId;
  }

  if (patch.year !== undefined) {
    update.year = patch.year;
  }

  if (patch.quantity !== undefined) {
    update.quantity = patch.quantity;
  }

  if (patch.notes !== undefined) {
    update.notes = patch.notes;
  }

  if (patch.status !== undefined) {
    update.status = patch.status;

    if (patch.status === "archived") {
      update.archived_at = new Date();
    }
  }

  return update;
}

function formatPlantName(commonName: string, variety: string | null): string {
  const trimmedVariety = variety?.trim();
  return trimmedVariety === undefined || trimmedVariety.length === 0 ? commonName : `${commonName} (${trimmedVariety})`;
}

function toNullableNumber(value: string | number | null): number | null {
  return value === null ? null : Number(value);
}

function toCount(row: CountRow | undefined): number {
  return Number(row?.count ?? 0);
}
