import { sql, type Selectable, type Updateable } from "kysely";

import type { PlantsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  CreatePlantInput,
  ListPlantsFilters,
  PaginatedPlants,
  Plant,
  PlantsRepository,
  UpdatePlantInput
} from "./plants.types.js";

const PLANT_COLUMNS = [
  "id",
  "account_id",
  "common_name",
  "variety",
  "plant_category",
  "lifecycle_type",
  "growing_style",
  "notes",
  "created_at",
  "updated_at",
  "archived_at"
] as const;

type SelectedPlant = Pick<Selectable<PlantsTable>, (typeof PLANT_COLUMNS)[number]>;
type CountRow = { count: string | number | bigint };

export class KyselyPlantsRepository implements PlantsRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async list(accountId: UUID, filters: ListPlantsFilters, db: DbHandle = this.dbHandle): Promise<PaginatedPlants> {
    let itemsQuery = db.db
      .selectFrom("plants")
      .select(PLANT_COLUMNS)
      .where("account_id", "=", accountId)
      .orderBy("common_name", "asc")
      .orderBy("variety", "asc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db.selectFrom("plants").select(sql<string>`count(*)`.as("count")).where("account_id", "=", accountId);

    if (!filters.includeArchived) {
      itemsQuery = itemsQuery.where("archived_at", "is", null);
      countQuery = countQuery.where("archived_at", "is", null);
    }

    if (filters.q !== undefined) {
      const pattern = `%${filters.q}%`;
      itemsQuery = itemsQuery.where((eb) =>
        eb.or([
          eb("common_name", "ilike", pattern),
          eb("variety", "ilike", pattern),
          eb("plant_category", "ilike", pattern),
          eb("notes", "ilike", pattern)
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("common_name", "ilike", pattern),
          eb("variety", "ilike", pattern),
          eb("plant_category", "ilike", pattern),
          eb("notes", "ilike", pattern)
        ])
      );
    }

    if (filters.lifecycleType !== undefined) {
      itemsQuery = itemsQuery.where("lifecycle_type", "=", filters.lifecycleType);
      countQuery = countQuery.where("lifecycle_type", "=", filters.lifecycleType);
    }

    if (filters.growingStyle !== undefined) {
      itemsQuery = itemsQuery.where("growing_style", "=", filters.growingStyle);
      countQuery = countQuery.where("growing_style", "=", filters.growingStyle);
    }

    const rows = await itemsQuery.execute();
    const totalRow = await countQuery.executeTakeFirst();

    return {
      items: rows.map(toPlant),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async findById(accountId: UUID, plantId: UUID, db: DbHandle = this.dbHandle): Promise<Plant | null> {
    const row = await db.db
      .selectFrom("plants")
      .select(PLANT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "=", plantId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return row === undefined ? null : toPlant(row);
  }

  async create(input: CreatePlantInput, db: DbHandle = this.dbHandle): Promise<Plant> {
    const row = await db.db
      .insertInto("plants")
      .values({
        account_id: input.accountId,
        common_name: input.commonName,
        variety: input.variety ?? null,
        plant_category: input.plantCategory ?? null,
        lifecycle_type: input.lifecycleType,
        growing_style: input.growingStyle,
        notes: input.notes ?? null
      })
      .returning(PLANT_COLUMNS)
      .executeTakeFirstOrThrow();

    return toPlant(row);
  }

  async update(
    accountId: UUID,
    plantId: UUID,
    patch: UpdatePlantInput,
    db: DbHandle = this.dbHandle
  ): Promise<Plant | null> {
    const row = await db.db
      .updateTable("plants")
      .set(toPlantUpdate(patch))
      .where("account_id", "=", accountId)
      .where("id", "=", plantId)
      .where("archived_at", "is", null)
      .returning(PLANT_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toPlant(row);
  }

  async archive(accountId: UUID, plantId: UUID, db: DbHandle = this.dbHandle): Promise<boolean> {
    const row = await db.db
      .updateTable("plants")
      .set({ archived_at: new Date() })
      .where("account_id", "=", accountId)
      .where("id", "=", plantId)
      .where("archived_at", "is", null)
      .returning("id")
      .executeTakeFirst();

    return row !== undefined;
  }
}

function toPlant(row: SelectedPlant): Plant {
  return {
    id: row.id,
    accountId: row.account_id,
    commonName: row.common_name,
    variety: row.variety,
    plantCategory: row.plant_category,
    lifecycleType: row.lifecycle_type as Plant["lifecycleType"],
    growingStyle: row.growing_style as Plant["growingStyle"],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at
  };
}

function toPlantUpdate(patch: UpdatePlantInput): Updateable<PlantsTable> {
  const update: Updateable<PlantsTable> = {};

  if (patch.commonName !== undefined) {
    update.common_name = patch.commonName;
  }

  if (patch.variety !== undefined) {
    update.variety = patch.variety;
  }

  if (patch.plantCategory !== undefined) {
    update.plant_category = patch.plantCategory;
  }

  if (patch.lifecycleType !== undefined) {
    update.lifecycle_type = patch.lifecycleType;
  }

  if (patch.growingStyle !== undefined) {
    update.growing_style = patch.growingStyle;
  }

  if (patch.notes !== undefined) {
    update.notes = patch.notes;
  }

  return update;
}

function toCount(row: CountRow | undefined): number {
  return Number(row?.count ?? 0);
}
