import { sql, type Selectable, type Updateable } from "kysely";

import type { BedsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  Bed,
  BedCurrentContents,
  BedCurrentPersistentPlant,
  BedCurrentYearlyPlanting,
  BedsRepository,
  BedWithCurrentContents,
  CreateBedInput,
  ListBedsFilters,
  PaginatedBeds,
  UpdateBedInput
} from "./beds.types.js";

const BED_COLUMNS = [
  "id",
  "account_id",
  "place_id",
  "name",
  "description",
  "notes",
  "width_m",
  "length_m",
  "area_m2",
  "status",
  "created_at",
  "updated_at",
  "archived_at"
] as const;

const CURRENT_YEARLY_CONTENT_STATUSES = ["planned", "planted", "harvested"] as const;

type SelectedBed = Pick<Selectable<BedsTable>, (typeof BED_COLUMNS)[number]>;
type CountRow = { count: string | number | bigint };
type SelectedPersistentContent = {
  bed_id: UUID;
  id: UUID;
  common_name: string;
  variety: string | null;
  quantity: string | number | null;
};
type SelectedYearlyContent = SelectedPersistentContent & {
  year: number;
  status: string;
};

export class KyselyBedsRepository implements BedsRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async listByPlace(
    accountId: UUID,
    placeId: UUID,
    filters: ListBedsFilters,
    db: DbHandle = this.dbHandle
  ): Promise<PaginatedBeds> {
    let itemsQuery = db.db
      .selectFrom("beds")
      .select(BED_COLUMNS)
      .where("account_id", "=", accountId)
      .where("place_id", "=", placeId)
      .orderBy("name", "asc")
      .orderBy("created_at", "desc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db
      .selectFrom("beds")
      .select(sql<string>`count(*)`.as("count"))
      .where("account_id", "=", accountId)
      .where("place_id", "=", placeId);

    if (filters.status === undefined) {
      itemsQuery = itemsQuery.where("archived_at", "is", null).where("status", "!=", "archived");
      countQuery = countQuery.where("archived_at", "is", null).where("status", "!=", "archived");
    } else {
      itemsQuery = itemsQuery.where("status", "=", filters.status);
      countQuery = countQuery.where("status", "=", filters.status);

      if (filters.status !== "archived") {
        itemsQuery = itemsQuery.where("archived_at", "is", null);
        countQuery = countQuery.where("archived_at", "is", null);
      }
    }

    if (filters.q !== undefined) {
      const pattern = `%${filters.q}%`;
      itemsQuery = itemsQuery.where((eb) =>
        eb.or([eb("name", "ilike", pattern), eb("description", "ilike", pattern), eb("notes", "ilike", pattern)])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([eb("name", "ilike", pattern), eb("description", "ilike", pattern), eb("notes", "ilike", pattern)])
      );
    }

    const rows = await itemsQuery.execute();
    const totalRow = await countQuery.executeTakeFirst();
    const contentsByBedId = await this.loadCurrentContents(
      accountId,
      rows.map((row) => row.id),
      selectedYear(filters.year),
      db
    );

    return {
      items: rows.map((row) => withCurrentContents(row, contentsByBedId.get(row.id))),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async listActiveByPlace(accountId: UUID, placeId: UUID, db: DbHandle = this.dbHandle): Promise<Bed[]> {
    const rows = await db.db
      .selectFrom("beds")
      .select(BED_COLUMNS)
      .where("account_id", "=", accountId)
      .where("place_id", "=", placeId)
      .where("status", "=", "active")
      .where("archived_at", "is", null)
      .orderBy("name", "asc")
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toBed);
  }

  async findById(
    accountId: UUID,
    bedId: UUID,
    year?: number,
    db: DbHandle = this.dbHandle
  ): Promise<BedWithCurrentContents | null> {
    const row = await db.db
      .selectFrom("beds")
      .select(BED_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "=", bedId)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .executeTakeFirst();

    if (row === undefined) {
      return null;
    }

    const contentsByBedId = await this.loadCurrentContents(accountId, [row.id], selectedYear(year), db);

    return withCurrentContents(row, contentsByBedId.get(row.id));
  }

  async findManyByIds(accountId: UUID, ids: UUID[], db: DbHandle = this.dbHandle): Promise<Bed[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await db.db
      .selectFrom("beds")
      .select(BED_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "in", ids)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toBed);
  }

  async create(input: CreateBedInput, db: DbHandle = this.dbHandle): Promise<Bed> {
    const row = await db.db
      .insertInto("beds")
      .values({
        account_id: input.accountId,
        place_id: input.placeId,
        name: input.name,
        description: input.description ?? null,
        notes: input.notes ?? null,
        width_m: input.widthM ?? null,
        length_m: input.lengthM ?? null,
        area_m2: input.areaM2 ?? null,
        status: "active"
      })
      .returning(BED_COLUMNS)
      .executeTakeFirstOrThrow();

    return toBed(row);
  }

  async update(accountId: UUID, bedId: UUID, patch: UpdateBedInput, db: DbHandle = this.dbHandle): Promise<Bed | null> {
    const row = await db.db
      .updateTable("beds")
      .set(toBedUpdate(patch))
      .where("account_id", "=", accountId)
      .where("id", "=", bedId)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .returning(BED_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toBed(row);
  }

  async archive(accountId: UUID, bedId: UUID, db: DbHandle = this.dbHandle): Promise<boolean> {
    const row = await db.db
      .updateTable("beds")
      .set({
        status: "archived",
        archived_at: new Date()
      })
      .where("account_id", "=", accountId)
      .where("id", "=", bedId)
      .where("archived_at", "is", null)
      .where("status", "!=", "archived")
      .returning("id")
      .executeTakeFirst();

    return row !== undefined;
  }

  private async loadCurrentContents(
    accountId: UUID,
    bedIds: UUID[],
    year: number,
    db: DbHandle
  ): Promise<Map<UUID, BedCurrentContents>> {
    const contentsByBedId = new Map<UUID, BedCurrentContents>();

    for (const bedId of bedIds) {
      contentsByBedId.set(bedId, emptyCurrentContents());
    }

    if (bedIds.length === 0) {
      return contentsByBedId;
    }

    const persistentRows = await db.db
      .selectFrom("persistent_bed_plants")
      .innerJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "persistent_bed_plants.plant_id")
          .onRef("plants.account_id", "=", "persistent_bed_plants.account_id")
      )
      .select([
        "persistent_bed_plants.bed_id as bed_id",
        "persistent_bed_plants.id as id",
        "plants.common_name as common_name",
        "plants.variety as variety",
        "persistent_bed_plants.quantity as quantity"
      ])
      .where("persistent_bed_plants.account_id", "=", accountId)
      .where("persistent_bed_plants.bed_id", "in", bedIds)
      .where("persistent_bed_plants.status", "=", "active")
      .where("persistent_bed_plants.archived_at", "is", null)
      .where("plants.archived_at", "is", null)
      .orderBy("plants.common_name", "asc")
      .orderBy("persistent_bed_plants.created_at", "asc")
      .execute();

    const yearlyRows = await db.db
      .selectFrom("yearly_bed_plantings")
      .innerJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "yearly_bed_plantings.plant_id")
          .onRef("plants.account_id", "=", "yearly_bed_plantings.account_id")
      )
      .select([
        "yearly_bed_plantings.bed_id as bed_id",
        "yearly_bed_plantings.id as id",
        "plants.common_name as common_name",
        "plants.variety as variety",
        "yearly_bed_plantings.quantity as quantity",
        "yearly_bed_plantings.year as year",
        "yearly_bed_plantings.status as status"
      ])
      .where("yearly_bed_plantings.account_id", "=", accountId)
      .where("yearly_bed_plantings.bed_id", "in", bedIds)
      .where("yearly_bed_plantings.year", "=", year)
      .where("yearly_bed_plantings.status", "in", CURRENT_YEARLY_CONTENT_STATUSES)
      .where("yearly_bed_plantings.archived_at", "is", null)
      .where("plants.archived_at", "is", null)
      .orderBy("plants.common_name", "asc")
      .orderBy("yearly_bed_plantings.created_at", "asc")
      .execute();

    for (const row of persistentRows) {
      const contents = contentsByBedId.get(row.bed_id);
      contents?.persistentPlants.push(toCurrentPersistentPlant(row));
    }

    for (const row of yearlyRows) {
      const contents = contentsByBedId.get(row.bed_id);
      contents?.yearlyPlantings.push(toCurrentYearlyPlanting(row));
    }

    return contentsByBedId;
  }
}

function toBed(row: SelectedBed): Bed {
  return {
    id: row.id,
    accountId: row.account_id,
    placeId: row.place_id,
    name: row.name,
    description: row.description,
    notes: row.notes,
    widthM: toNullableNumber(row.width_m),
    lengthM: toNullableNumber(row.length_m),
    areaM2: toNullableNumber(row.area_m2),
    status: row.status as Bed["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at
  };
}

function withCurrentContents(row: SelectedBed, currentContents: BedCurrentContents | undefined): BedWithCurrentContents {
  return {
    ...toBed(row),
    currentContents: currentContents ?? emptyCurrentContents()
  };
}

function toBedUpdate(patch: UpdateBedInput): Updateable<BedsTable> {
  const update: Updateable<BedsTable> = {};

  if (patch.name !== undefined) {
    update.name = patch.name;
  }

  if (patch.description !== undefined) {
    update.description = patch.description;
  }

  if (patch.notes !== undefined) {
    update.notes = patch.notes;
  }

  if (patch.widthM !== undefined) {
    update.width_m = patch.widthM;
  }

  if (patch.lengthM !== undefined) {
    update.length_m = patch.lengthM;
  }

  if (patch.areaM2 !== undefined) {
    update.area_m2 = patch.areaM2;
  }

  if (patch.status !== undefined) {
    update.status = patch.status;

    if (patch.status === "archived") {
      update.archived_at = new Date();
    }
  }

  return update;
}

function toCurrentPersistentPlant(row: SelectedPersistentContent): BedCurrentPersistentPlant {
  return {
    id: row.id,
    plantName: formatPlantName(row.common_name, row.variety),
    quantity: toNullableNumber(row.quantity)
  };
}

function toCurrentYearlyPlanting(row: SelectedYearlyContent): BedCurrentYearlyPlanting {
  return {
    id: row.id,
    plantName: formatPlantName(row.common_name, row.variety),
    year: row.year,
    quantity: toNullableNumber(row.quantity),
    status: row.status
  };
}

function selectedYear(year: number | undefined): number {
  return year ?? new Date().getFullYear();
}

function emptyCurrentContents(): BedCurrentContents {
  return {
    persistentPlants: [],
    yearlyPlantings: []
  };
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
