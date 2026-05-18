import { sql, type Selectable, type Updateable } from "kysely";

import type { PlacesTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  CreatePlaceInput,
  ListPlacesFilters,
  PaginatedPlaces,
  Place,
  PlaceCountsDto,
  PlacesRepository,
  UpdatePlaceInput
} from "./places.types.js";

const PLACE_COLUMNS = [
  "id",
  "account_id",
  "name",
  "description",
  "notes",
  "weather_enabled",
  "weather_location_label",
  "latitude",
  "longitude",
  "timezone",
  "created_at",
  "updated_at",
  "archived_at"
] as const;

type SelectedPlace = Pick<Selectable<PlacesTable>, (typeof PLACE_COLUMNS)[number]>;
type CountRow = { count: string | number | bigint };

export class KyselyPlacesRepository implements PlacesRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async list(accountId: UUID, filters: ListPlacesFilters, db: DbHandle = this.dbHandle): Promise<PaginatedPlaces> {
    let itemsQuery = db.db
      .selectFrom("places")
      .select(PLACE_COLUMNS)
      .where("account_id", "=", accountId)
      .orderBy("name", "asc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db.selectFrom("places").select(sql<string>`count(*)`.as("count")).where("account_id", "=", accountId);

    if (!filters.includeArchived) {
      itemsQuery = itemsQuery.where("archived_at", "is", null);
      countQuery = countQuery.where("archived_at", "is", null);
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

    return {
      items: rows.map(toPlace),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async findById(accountId: UUID, placeId: UUID, db: DbHandle = this.dbHandle): Promise<Place | null> {
    const row = await db.db
      .selectFrom("places")
      .select(PLACE_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "=", placeId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return row === undefined ? null : toPlace(row);
  }

  async countDetails(accountId: UUID, placeId: UUID, db: DbHandle = this.dbHandle): Promise<PlaceCountsDto> {
    const perennials = await db.db
      .selectFrom("perennials")
      .select(sql<string>`count(*)`.as("count"))
      .where("account_id", "=", accountId)
      .where("place_id", "=", placeId)
      .where("archived_at", "is", null)
      .where("status", "=", "active")
      .executeTakeFirst();
    const beds = await db.db
      .selectFrom("beds")
      .select(sql<string>`count(*)`.as("count"))
      .where("account_id", "=", accountId)
      .where("place_id", "=", placeId)
      .where("archived_at", "is", null)
      .where("status", "=", "active")
      .executeTakeFirst();
    const openProblems = await db.db
      .selectFrom("problems")
      .select(sql<string>`count(*)`.as("count"))
      .where("account_id", "=", accountId)
      .where("place_id", "=", placeId)
      .where("type", "=", "problem")
      .where("status", "=", "open")
      .executeTakeFirst();
    const upcomingTasks = await db.db
      .selectFrom("tasks")
      .select(sql<string>`count(*)`.as("count"))
      .where("account_id", "=", accountId)
      .where("place_id", "=", placeId)
      .where("due_date", ">=", sql<string>`current_date`)
      .where("status", "in", ["suggested", "planned"])
      .executeTakeFirst();

    return {
      perennials: toCount(perennials),
      beds: toCount(beds),
      openProblems: toCount(openProblems),
      upcomingTasks: toCount(upcomingTasks)
    };
  }

  async create(input: CreatePlaceInput, db: DbHandle = this.dbHandle): Promise<Place> {
    const row = await db.db
      .insertInto("places")
      .values({
        account_id: input.accountId,
        name: input.name,
        description: input.description ?? null,
        notes: input.notes ?? null,
        weather_enabled: input.weatherEnabled,
        weather_location_label: input.weatherLocationLabel ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        timezone: input.timezone ?? null
      })
      .returning(PLACE_COLUMNS)
      .executeTakeFirstOrThrow();

    return toPlace(row);
  }

  async update(
    accountId: UUID,
    placeId: UUID,
    patch: UpdatePlaceInput,
    db: DbHandle = this.dbHandle
  ): Promise<Place | null> {
    const update = toPlaceUpdate(patch);
    const row = await db.db
      .updateTable("places")
      .set(update)
      .where("account_id", "=", accountId)
      .where("id", "=", placeId)
      .where("archived_at", "is", null)
      .returning(PLACE_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toPlace(row);
  }

  async archive(accountId: UUID, placeId: UUID, db: DbHandle = this.dbHandle): Promise<boolean> {
    const row = await db.db
      .updateTable("places")
      .set({ archived_at: new Date() })
      .where("account_id", "=", accountId)
      .where("id", "=", placeId)
      .where("archived_at", "is", null)
      .returning("id")
      .executeTakeFirst();

    return row !== undefined;
  }
}

function toPlace(row: SelectedPlace): Place {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    description: row.description,
    notes: row.notes,
    weatherEnabled: row.weather_enabled,
    weatherLocationLabel: row.weather_location_label,
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at
  };
}

function toPlaceUpdate(patch: UpdatePlaceInput): Updateable<PlacesTable> {
  const update: Updateable<PlacesTable> = {};

  if (patch.name !== undefined) {
    update.name = patch.name;
  }

  if (patch.description !== undefined) {
    update.description = patch.description;
  }

  if (patch.notes !== undefined) {
    update.notes = patch.notes;
  }

  if (patch.weatherEnabled !== undefined) {
    update.weather_enabled = patch.weatherEnabled;
  }

  if (patch.weatherLocationLabel !== undefined) {
    update.weather_location_label = patch.weatherLocationLabel;
  }

  if (patch.latitude !== undefined) {
    update.latitude = patch.latitude;
  }

  if (patch.longitude !== undefined) {
    update.longitude = patch.longitude;
  }

  if (patch.timezone !== undefined) {
    update.timezone = patch.timezone;
  }

  return update;
}

function toNullableNumber(value: string | null): number | null {
  return value === null ? null : Number(value);
}

function toCount(row: CountRow | undefined): number {
  return Number(row?.count ?? 0);
}
