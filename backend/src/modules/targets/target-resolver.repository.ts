import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type { TargetLookupRow, TargetResolverRepository } from "./target-resolver.types.js";

export class KyselyTargetResolverRepository implements TargetResolverRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async findPlaceTarget(accountId: UUID, placeId: UUID, db: DbHandle = this.dbHandle): Promise<TargetLookupRow | null> {
    const row = await db.db
      .selectFrom("places")
      .select(["id", "name"])
      .where("account_id", "=", accountId)
      .where("id", "=", placeId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    if (row === undefined) {
      return null;
    }

    return {
      targetType: "place",
      targetId: row.id,
      label: row.name,
      placeId: row.id
    };
  }

  async listActivePerennialTargetsInPlace(
    accountId: UUID,
    placeId: UUID,
    db: DbHandle = this.dbHandle
  ): Promise<TargetLookupRow[]> {
    const rows = await db.db
      .selectFrom("perennials")
      .leftJoin("plants", (join) =>
        join.onRef("plants.id", "=", "perennials.plant_id").onRef("plants.account_id", "=", "perennials.account_id")
      )
      .select(["perennials.id", "perennials.place_id", "perennials.label", "plants.common_name", "plants.variety"])
      .where("perennials.account_id", "=", accountId)
      .where("perennials.place_id", "=", placeId)
      .where("perennials.status", "=", "active")
      .where("perennials.archived_at", "is", null)
      .orderBy("perennials.created_at", "asc")
      .execute();

    return rows.map((row) => ({
      targetType: "perennial",
      targetId: row.id,
      label: row.label ?? formatPlantName(row.common_name, row.variety),
      placeId: row.place_id
    }));
  }

  async listSelectedPerennialTargets(
    accountId: UUID,
    placeId: UUID,
    perennialIds: UUID[],
    db: DbHandle = this.dbHandle
  ): Promise<TargetLookupRow[]> {
    if (perennialIds.length === 0) {
      return [];
    }

    const rows = await db.db
      .selectFrom("perennials")
      .leftJoin("plants", (join) =>
        join.onRef("plants.id", "=", "perennials.plant_id").onRef("plants.account_id", "=", "perennials.account_id")
      )
      .select(["perennials.id", "perennials.place_id", "perennials.label", "plants.common_name", "plants.variety"])
      .where("perennials.account_id", "=", accountId)
      .where("perennials.place_id", "=", placeId)
      .where("perennials.id", "in", perennialIds)
      .where("perennials.status", "=", "active")
      .where("perennials.archived_at", "is", null)
      .execute();

    return rows.map((row) => ({
      targetType: "perennial",
      targetId: row.id,
      label: row.label ?? formatPlantName(row.common_name, row.variety),
      placeId: row.place_id
    }));
  }

  async listActiveBedTargetsInPlace(
    accountId: UUID,
    placeId: UUID,
    db: DbHandle = this.dbHandle
  ): Promise<TargetLookupRow[]> {
    const rows = await db.db
      .selectFrom("beds")
      .select(["id", "place_id", "name"])
      .where("account_id", "=", accountId)
      .where("place_id", "=", placeId)
      .where("status", "=", "active")
      .where("archived_at", "is", null)
      .orderBy("name", "asc")
      .orderBy("created_at", "asc")
      .execute();

    return rows.map((row) => ({
      targetType: "bed",
      targetId: row.id,
      label: row.name,
      placeId: row.place_id
    }));
  }

  async listSelectedBedTargets(
    accountId: UUID,
    placeId: UUID,
    bedIds: UUID[],
    db: DbHandle = this.dbHandle
  ): Promise<TargetLookupRow[]> {
    if (bedIds.length === 0) {
      return [];
    }

    const rows = await db.db
      .selectFrom("beds")
      .select(["id", "place_id", "name"])
      .where("account_id", "=", accountId)
      .where("place_id", "=", placeId)
      .where("id", "in", bedIds)
      .where("status", "=", "active")
      .where("archived_at", "is", null)
      .execute();

    return rows.map((row) => ({
      targetType: "bed",
      targetId: row.id,
      label: row.name,
      placeId: row.place_id
    }));
  }

  async listSelectedYearlyPlantingTargets(
    accountId: UUID,
    placeId: UUID,
    yearlyPlantingIds: UUID[],
    db: DbHandle = this.dbHandle
  ): Promise<TargetLookupRow[]> {
    if (yearlyPlantingIds.length === 0) {
      return [];
    }

    const rows = await db.db
      .selectFrom("yearly_bed_plantings")
      .innerJoin("beds", (join) =>
        join.onRef("beds.id", "=", "yearly_bed_plantings.bed_id").onRef("beds.account_id", "=", "yearly_bed_plantings.account_id")
      )
      .leftJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "yearly_bed_plantings.plant_id")
          .onRef("plants.account_id", "=", "yearly_bed_plantings.account_id")
      )
      .select(["yearly_bed_plantings.id", "yearly_bed_plantings.year", "beds.place_id", "plants.common_name", "plants.variety"])
      .where("yearly_bed_plantings.account_id", "=", accountId)
      .where("yearly_bed_plantings.id", "in", yearlyPlantingIds)
      .where("yearly_bed_plantings.archived_at", "is", null)
      .where("yearly_bed_plantings.status", "!=", "archived")
      .where("beds.place_id", "=", placeId)
      .where("beds.archived_at", "is", null)
      .where("beds.status", "=", "active")
      .execute();

    return rows.map((row) => ({
      targetType: "yearly_bed_planting",
      targetId: row.id,
      label: `${formatPlantName(row.common_name, row.variety) ?? "Yearly planting"} ${row.year}`,
      placeId: row.place_id
    }));
  }

  async listSelectedPersistentBedPlantTargets(
    accountId: UUID,
    placeId: UUID,
    persistentBedPlantIds: UUID[],
    db: DbHandle = this.dbHandle
  ): Promise<TargetLookupRow[]> {
    if (persistentBedPlantIds.length === 0) {
      return [];
    }

    const rows = await db.db
      .selectFrom("persistent_bed_plants")
      .innerJoin("beds", (join) =>
        join.onRef("beds.id", "=", "persistent_bed_plants.bed_id").onRef("beds.account_id", "=", "persistent_bed_plants.account_id")
      )
      .leftJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "persistent_bed_plants.plant_id")
          .onRef("plants.account_id", "=", "persistent_bed_plants.account_id")
      )
      .select(["persistent_bed_plants.id", "beds.place_id", "plants.common_name", "plants.variety"])
      .where("persistent_bed_plants.account_id", "=", accountId)
      .where("persistent_bed_plants.id", "in", persistentBedPlantIds)
      .where("persistent_bed_plants.status", "=", "active")
      .where("persistent_bed_plants.archived_at", "is", null)
      .where("beds.place_id", "=", placeId)
      .where("beds.archived_at", "is", null)
      .where("beds.status", "=", "active")
      .execute();

    return rows.map((row) => ({
      targetType: "persistent_bed_plant",
      targetId: row.id,
      label: formatPlantName(row.common_name, row.variety),
      placeId: row.place_id
    }));
  }
}

function formatPlantName(commonName: string | null, variety: string | null): string | null {
  if (commonName === null) {
    return null;
  }

  return variety === null ? commonName : `${commonName} - ${variety}`;
}
