import { sql, type Selectable, type Updateable } from "kysely";

import type { PerennialsTable, PlantsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  CreatePerennialInput,
  ListPerennialsFilters,
  PaginatedPerennials,
  Perennial,
  PerennialsRepository,
  PerennialWithPlant,
  UpdatePerennialInput
} from "./perennials.types.js";

const PERENNIAL_COLUMNS = [
  "id",
  "account_id",
  "place_id",
  "plant_id",
  "label",
  "planted_year",
  "notes",
  "status",
  "created_at",
  "updated_at",
  "archived_at"
] as const;

const PERENNIAL_WITH_PLANT_COLUMNS = [
  "perennials.id",
  "perennials.account_id",
  "perennials.place_id",
  "perennials.plant_id",
  "perennials.label",
  "perennials.planted_year",
  "perennials.notes",
  "perennials.status",
  "perennials.created_at",
  "perennials.updated_at",
  "perennials.archived_at",
  "plants.common_name",
  "plants.variety"
] as const;

type SelectedPerennial = Pick<Selectable<PerennialsTable>, (typeof PERENNIAL_COLUMNS)[number]>;
type SelectedPerennialWithPlant = SelectedPerennial & Pick<Selectable<PlantsTable>, "common_name" | "variety">;
type CountRow = { count: string | number | bigint };

export class KyselyPerennialsRepository implements PerennialsRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async listByPlace(
    accountId: UUID,
    placeId: UUID,
    filters: ListPerennialsFilters,
    db: DbHandle = this.dbHandle
  ): Promise<PaginatedPerennials> {
    let itemsQuery = db.db
      .selectFrom("perennials")
      .innerJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "perennials.plant_id")
          .onRef("plants.account_id", "=", "perennials.account_id")
      )
      .select(PERENNIAL_WITH_PLANT_COLUMNS)
      .where("perennials.account_id", "=", accountId)
      .where("perennials.place_id", "=", placeId)
      .orderBy("perennials.label", "asc")
      .orderBy("plants.common_name", "asc")
      .orderBy("perennials.created_at", "desc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db
      .selectFrom("perennials")
      .innerJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "perennials.plant_id")
          .onRef("plants.account_id", "=", "perennials.account_id")
      )
      .select(sql<string>`count(*)`.as("count"))
      .where("perennials.account_id", "=", accountId)
      .where("perennials.place_id", "=", placeId);

    if (filters.status === undefined) {
      itemsQuery = itemsQuery.where("perennials.archived_at", "is", null).where("perennials.status", "!=", "archived");
      countQuery = countQuery.where("perennials.archived_at", "is", null).where("perennials.status", "!=", "archived");
    } else {
      itemsQuery = itemsQuery.where("perennials.status", "=", filters.status);
      countQuery = countQuery.where("perennials.status", "=", filters.status);

      if (filters.status !== "archived") {
        itemsQuery = itemsQuery.where("perennials.archived_at", "is", null);
        countQuery = countQuery.where("perennials.archived_at", "is", null);
      }
    }

    if (filters.q !== undefined) {
      const pattern = `%${filters.q}%`;
      itemsQuery = itemsQuery.where((eb) =>
        eb.or([
          eb("perennials.label", "ilike", pattern),
          eb("perennials.notes", "ilike", pattern),
          eb("plants.common_name", "ilike", pattern),
          eb("plants.variety", "ilike", pattern)
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("perennials.label", "ilike", pattern),
          eb("perennials.notes", "ilike", pattern),
          eb("plants.common_name", "ilike", pattern),
          eb("plants.variety", "ilike", pattern)
        ])
      );
    }

    const rows = await itemsQuery.execute();
    const totalRow = await countQuery.executeTakeFirst();

    return {
      items: rows.map(toPerennialWithPlant),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async findById(accountId: UUID, perennialId: UUID, db: DbHandle = this.dbHandle): Promise<PerennialWithPlant | null> {
    const row = await db.db
      .selectFrom("perennials")
      .innerJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "perennials.plant_id")
          .onRef("plants.account_id", "=", "perennials.account_id")
      )
      .select(PERENNIAL_WITH_PLANT_COLUMNS)
      .where("perennials.account_id", "=", accountId)
      .where("perennials.id", "=", perennialId)
      .where("perennials.archived_at", "is", null)
      .where("perennials.status", "!=", "archived")
      .executeTakeFirst();

    return row === undefined ? null : toPerennialWithPlant(row);
  }

  async findManyByIds(accountId: UUID, ids: UUID[], db: DbHandle = this.dbHandle): Promise<Perennial[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await db.db
      .selectFrom("perennials")
      .select(PERENNIAL_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "in", ids)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toPerennial);
  }

  async listActiveByPlace(accountId: UUID, placeId: UUID, db: DbHandle = this.dbHandle): Promise<Perennial[]> {
    const rows = await db.db
      .selectFrom("perennials")
      .select(PERENNIAL_COLUMNS)
      .where("account_id", "=", accountId)
      .where("place_id", "=", placeId)
      .where("status", "=", "active")
      .where("archived_at", "is", null)
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toPerennial);
  }

  async create(input: CreatePerennialInput, db: DbHandle = this.dbHandle): Promise<Perennial> {
    const row = await db.db
      .insertInto("perennials")
      .values({
        account_id: input.accountId,
        place_id: input.placeId,
        plant_id: input.plantId,
        label: input.label ?? null,
        planted_year: input.plantedYear ?? null,
        notes: input.notes ?? null,
        status: "active"
      })
      .returning(PERENNIAL_COLUMNS)
      .executeTakeFirstOrThrow();

    return toPerennial(row);
  }

  async update(
    accountId: UUID,
    perennialId: UUID,
    patch: UpdatePerennialInput,
    db: DbHandle = this.dbHandle
  ): Promise<Perennial | null> {
    const row = await db.db
      .updateTable("perennials")
      .set(toPerennialUpdate(patch))
      .where("account_id", "=", accountId)
      .where("id", "=", perennialId)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .returning(PERENNIAL_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toPerennial(row);
  }

  async archive(accountId: UUID, perennialId: UUID, db: DbHandle = this.dbHandle): Promise<boolean> {
    const row = await db.db
      .updateTable("perennials")
      .set({
        status: "archived",
        archived_at: new Date()
      })
      .where("account_id", "=", accountId)
      .where("id", "=", perennialId)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .returning("id")
      .executeTakeFirst();

    return row !== undefined;
  }
}

function toPerennial(row: SelectedPerennial): Perennial {
  return {
    id: row.id,
    accountId: row.account_id,
    placeId: row.place_id,
    plantId: row.plant_id,
    label: row.label,
    plantedYear: row.planted_year,
    notes: row.notes,
    status: row.status as Perennial["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at
  };
}

function toPerennialWithPlant(row: SelectedPerennialWithPlant): PerennialWithPlant {
  return {
    ...toPerennial(row),
    plantName: formatPlantName(row.common_name, row.variety)
  };
}

function toPerennialUpdate(patch: UpdatePerennialInput): Updateable<PerennialsTable> {
  const update: Updateable<PerennialsTable> = {};

  if (patch.plantId !== undefined) {
    update.plant_id = patch.plantId;
  }

  if (patch.label !== undefined) {
    update.label = patch.label;
  }

  if (patch.plantedYear !== undefined) {
    update.planted_year = patch.plantedYear;
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

function toCount(row: CountRow | undefined): number {
  return Number(row?.count ?? 0);
}
