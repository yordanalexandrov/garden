import { sql, type Selectable, type Updateable } from "kysely";

import type { PersistentBedPlantsTable, PlantsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  CreatePersistentBedPlantInput,
  ListPersistentBedPlantsFilters,
  PaginatedPersistentBedPlants,
  PersistentBedPlant,
  PersistentBedPlantsRepository,
  PersistentBedPlantWithPlant,
  UpdatePersistentBedPlantInput
} from "./persistent-bed-plants.types.js";

const PERSISTENT_BED_PLANT_COLUMNS = [
  "id",
  "account_id",
  "bed_id",
  "plant_id",
  "planted_year",
  "quantity",
  "notes",
  "status",
  "created_at",
  "updated_at",
  "archived_at"
] as const;

const PERSISTENT_BED_PLANT_WITH_PLANT_COLUMNS = [
  "persistent_bed_plants.id",
  "persistent_bed_plants.account_id",
  "persistent_bed_plants.bed_id",
  "persistent_bed_plants.plant_id",
  "persistent_bed_plants.planted_year",
  "persistent_bed_plants.quantity",
  "persistent_bed_plants.notes",
  "persistent_bed_plants.status",
  "persistent_bed_plants.created_at",
  "persistent_bed_plants.updated_at",
  "persistent_bed_plants.archived_at",
  "plants.common_name",
  "plants.variety"
] as const;

type SelectedPersistentBedPlant = Pick<
  Selectable<PersistentBedPlantsTable>,
  (typeof PERSISTENT_BED_PLANT_COLUMNS)[number]
>;
type SelectedPersistentBedPlantWithPlant = SelectedPersistentBedPlant & Pick<Selectable<PlantsTable>, "common_name" | "variety">;
type CountRow = { count: string | number | bigint };

export class KyselyPersistentBedPlantsRepository implements PersistentBedPlantsRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async listByBed(
    accountId: UUID,
    bedId: UUID,
    filters: ListPersistentBedPlantsFilters,
    db: DbHandle = this.dbHandle
  ): Promise<PaginatedPersistentBedPlants> {
    let itemsQuery = db.db
      .selectFrom("persistent_bed_plants")
      .innerJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "persistent_bed_plants.plant_id")
          .onRef("plants.account_id", "=", "persistent_bed_plants.account_id")
      )
      .select(PERSISTENT_BED_PLANT_WITH_PLANT_COLUMNS)
      .where("persistent_bed_plants.account_id", "=", accountId)
      .where("persistent_bed_plants.bed_id", "=", bedId)
      .orderBy("plants.common_name", "asc")
      .orderBy("plants.variety", "asc")
      .orderBy("persistent_bed_plants.created_at", "asc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db
      .selectFrom("persistent_bed_plants")
      .innerJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "persistent_bed_plants.plant_id")
          .onRef("plants.account_id", "=", "persistent_bed_plants.account_id")
      )
      .select(sql<string>`count(*)`.as("count"))
      .where("persistent_bed_plants.account_id", "=", accountId)
      .where("persistent_bed_plants.bed_id", "=", bedId);

    if (filters.status === undefined) {
      itemsQuery = itemsQuery
        .where("persistent_bed_plants.archived_at", "is", null)
        .where("persistent_bed_plants.status", "!=", "archived");
      countQuery = countQuery
        .where("persistent_bed_plants.archived_at", "is", null)
        .where("persistent_bed_plants.status", "!=", "archived");
    } else {
      itemsQuery = itemsQuery.where("persistent_bed_plants.status", "=", filters.status);
      countQuery = countQuery.where("persistent_bed_plants.status", "=", filters.status);

      if (filters.status === "archived") {
        itemsQuery = itemsQuery.where("persistent_bed_plants.archived_at", "is not", null);
        countQuery = countQuery.where("persistent_bed_plants.archived_at", "is not", null);
      } else {
        itemsQuery = itemsQuery.where("persistent_bed_plants.archived_at", "is", null);
        countQuery = countQuery.where("persistent_bed_plants.archived_at", "is", null);
      }
    }

    const rows = await itemsQuery.execute();
    const totalRow = await countQuery.executeTakeFirst();

    return {
      items: rows.map(toPersistentBedPlantWithPlant),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async listActiveByBed(accountId: UUID, bedId: UUID, db: DbHandle = this.dbHandle): Promise<PersistentBedPlant[]> {
    const rows = await db.db
      .selectFrom("persistent_bed_plants")
      .select(PERSISTENT_BED_PLANT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("bed_id", "=", bedId)
      .where("status", "=", "active")
      .where("archived_at", "is", null)
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toPersistentBedPlant);
  }

  async findById(
    accountId: UUID,
    id: UUID,
    db: DbHandle = this.dbHandle
  ): Promise<PersistentBedPlantWithPlant | null> {
    const row = await db.db
      .selectFrom("persistent_bed_plants")
      .innerJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "persistent_bed_plants.plant_id")
          .onRef("plants.account_id", "=", "persistent_bed_plants.account_id")
      )
      .select(PERSISTENT_BED_PLANT_WITH_PLANT_COLUMNS)
      .where("persistent_bed_plants.account_id", "=", accountId)
      .where("persistent_bed_plants.id", "=", id)
      .where("persistent_bed_plants.archived_at", "is", null)
      .where("persistent_bed_plants.status", "!=", "archived")
      .executeTakeFirst();

    return row === undefined ? null : toPersistentBedPlantWithPlant(row);
  }

  async findManyByIds(accountId: UUID, ids: UUID[], db: DbHandle = this.dbHandle): Promise<PersistentBedPlant[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await db.db
      .selectFrom("persistent_bed_plants")
      .select(PERSISTENT_BED_PLANT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "in", ids)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toPersistentBedPlant);
  }

  async create(input: CreatePersistentBedPlantInput, db: DbHandle = this.dbHandle): Promise<PersistentBedPlant> {
    const row = await db.db
      .insertInto("persistent_bed_plants")
      .values({
        account_id: input.accountId,
        bed_id: input.bedId,
        plant_id: input.plantId,
        planted_year: input.plantedYear ?? null,
        quantity: input.quantity ?? null,
        notes: input.notes ?? null,
        status: "active"
      })
      .returning(PERSISTENT_BED_PLANT_COLUMNS)
      .executeTakeFirstOrThrow();

    return toPersistentBedPlant(row);
  }

  async update(
    accountId: UUID,
    id: UUID,
    patch: UpdatePersistentBedPlantInput,
    db: DbHandle = this.dbHandle
  ): Promise<PersistentBedPlant | null> {
    const row = await db.db
      .updateTable("persistent_bed_plants")
      .set(toPersistentBedPlantUpdate(patch))
      .where("account_id", "=", accountId)
      .where("id", "=", id)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .returning(PERSISTENT_BED_PLANT_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toPersistentBedPlant(row);
  }

  async archive(accountId: UUID, id: UUID, db: DbHandle = this.dbHandle): Promise<boolean> {
    const row = await db.db
      .updateTable("persistent_bed_plants")
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

function toPersistentBedPlant(row: SelectedPersistentBedPlant): PersistentBedPlant {
  return {
    id: row.id,
    accountId: row.account_id,
    bedId: row.bed_id,
    plantId: row.plant_id,
    plantedYear: row.planted_year,
    quantity: toNullableNumber(row.quantity),
    notes: row.notes,
    status: row.status as PersistentBedPlant["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at
  };
}

function toPersistentBedPlantWithPlant(row: SelectedPersistentBedPlantWithPlant): PersistentBedPlantWithPlant {
  return {
    ...toPersistentBedPlant(row),
    plantName: formatPlantName(row.common_name, row.variety)
  };
}

function toPersistentBedPlantUpdate(patch: UpdatePersistentBedPlantInput): Updateable<PersistentBedPlantsTable> {
  const update: Updateable<PersistentBedPlantsTable> = {};

  if (patch.plantId !== undefined) {
    update.plant_id = patch.plantId;
  }

  if (patch.plantedYear !== undefined) {
    update.planted_year = patch.plantedYear;
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
