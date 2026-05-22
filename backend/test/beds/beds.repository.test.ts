import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyBedsRepository } from "../../src/modules/beds/beds.repository.js";
import type { ListBedsFilters } from "../../src/modules/beds/beds.types.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const PlaceIds = {
  placeA: "11111111-1111-1111-1111-111111111111",
  otherPlaceA: "22222222-2222-2222-2222-222222222222",
  placeB: "33333333-3333-3333-3333-333333333333"
} as const;

const PlantIds = {
  strawberryA: "44444444-4444-4444-4444-444444444444",
  tomatoA: "55555555-5555-5555-5555-555555555555",
  pepperA: "66666666-6666-6666-6666-666666666666",
  tomatoB: "77777777-7777-7777-7777-777777777777"
} as const;

const BedIds = {
  activeA: "88888888-8888-8888-8888-888888888888",
  removedA: "99999999-9999-9999-9999-999999999999",
  archivedA: "10101010-1010-1010-1010-101010101010",
  inconsistentArchivedA: "11110000-1111-1111-1111-111111111111",
  otherPlaceA: "12121212-1212-1212-1212-121212121212",
  activeB: "13131313-1313-1313-1313-131313131313"
} as const;

const PersistentPlantIds = {
  strawberryA: "14141414-1414-1414-1414-141414141414",
  removedA: "15151515-1515-1515-1515-151515151515"
} as const;

const YearlyPlantingIds = {
  tomato2025A: "16161616-1616-1616-1616-161616161616",
  pepper2026A: "17171717-1717-1717-1717-171717171717",
  removed2026A: "18181818-1818-1818-1818-181818181818"
} as const;

describeDatabase("KyselyBedsRepository", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let repository: KyselyBedsRepository;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertBasePlacesAndPlants(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    repository = new KyselyBedsRepository(dbClient);
  });

  afterEach(async () => {
    await dbClient.destroy();
    await pool.end();
  });

  it("lists only unarchived account-owned beds for the requested place by default", async () => {
    await insertBed(pool, {
      id: BedIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Bed A"
    });
    await insertBed(pool, {
      id: BedIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Archived bed",
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertBed(pool, {
      id: BedIds.otherPlaceA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.otherPlaceA,
      name: "Other place bed"
    });
    await insertBed(pool, {
      id: BedIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      name: "Other account bed"
    });

    const result = await repository.listByPlace(AccountFixtureIds.accountA, PlaceIds.placeA, defaultFilters());

    expect(result).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        id: BedIds.activeA,
        accountId: AccountFixtureIds.accountA,
        placeId: PlaceIds.placeA,
        name: "Bed A",
        archivedAt: null,
        currentContents: {
          persistentPlants: [],
          yearlyPlantings: []
        }
      })
    ]);
  });

  it("supports q, status filters, pagination, and archived status listing inside the account scope", async () => {
    await insertBed(pool, {
      id: BedIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "North Bed",
      notes: "For tomatoes"
    });
    await insertBed(pool, {
      id: BedIds.removedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Old South Bed",
      status: "removed",
      notes: "Removed after path widening"
    });
    await insertBed(pool, {
      id: BedIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Archived South Bed",
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertBed(pool, {
      id: BedIds.inconsistentArchivedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Inconsistent archived bed",
      status: "archived"
    });

    const removed = await repository.listByPlace(AccountFixtureIds.accountA, PlaceIds.placeA, {
      ...defaultFilters(),
      q: "path",
      status: "removed",
      pageSize: 1
    });
    const archived = await repository.listByPlace(AccountFixtureIds.accountA, PlaceIds.placeA, {
      ...defaultFilters(),
      status: "archived"
    });

    expect(removed).toMatchObject({
      total: 1,
      pageSize: 1
    });
    expect(removed.items).toEqual([expect.objectContaining({ id: BedIds.removedA })]);
    expect(archived.items).toEqual([expect.objectContaining({ id: BedIds.archivedA, status: "archived" })]);
  });

  it("creates, updates, and archives beds without hard deleting them", async () => {
    const created = await repository.create({
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "New bed",
      description: "East side",
      notes: "Mulched",
      widthM: 1.2,
      lengthM: 4,
      areaM2: 4.8
    });

    expect(created).toMatchObject({
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      status: "active",
      areaM2: 4.8
    });

    const updated = await repository.update(AccountFixtureIds.accountA, created.id, {
      name: "Updated bed",
      status: "removed",
      notes: null
    });

    expect(updated).toMatchObject({
      id: created.id,
      name: "Updated bed",
      status: "removed",
      notes: null
    });

    await expect(repository.archive(AccountFixtureIds.accountA, created.id)).resolves.toBe(true);
    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toBeNull();

    const archivedRow = await pool.query<{ status: string; archived_at: Date | null }>(
      "select status, archived_at from beds where id = $1",
      [created.id]
    );
    expect(archivedRow.rowCount).toBe(1);
    expect(archivedRow.rows[0]).toMatchObject({ status: "archived" });
    expect(archivedRow.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("returns selected-year current contents without mutating historical planting rows", async () => {
    await insertBed(pool, {
      id: BedIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Bed A"
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.strawberryA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.strawberryA,
      quantity: 10
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.removedA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.strawberryA,
      status: "removed",
      quantity: 2
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2025A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.tomatoA,
      year: 2025,
      quantity: 12
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.pepper2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.pepperA,
      year: 2026,
      quantity: 8,
      status: "planned"
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.removed2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.tomatoA,
      year: 2026,
      quantity: 4,
      status: "removed"
    });

    const listed2025 = await repository.listByPlace(AccountFixtureIds.accountA, PlaceIds.placeA, {
      ...defaultFilters(),
      year: 2025
    });
    const detail2026 = await repository.findById(AccountFixtureIds.accountA, BedIds.activeA, 2026);
    const historicalRows = await pool.query<{ count: string }>(
      "select count(*) from yearly_bed_plantings where bed_id = $1",
      [BedIds.activeA]
    );

    expect(listed2025.items[0]?.currentContents).toEqual({
      persistentPlants: [
        {
          id: PersistentPlantIds.strawberryA,
          plantName: "Strawberry",
          quantity: 10
        }
      ],
      yearlyPlantings: [
        {
          id: YearlyPlantingIds.tomato2025A,
          plantName: "Tomato (Roma)",
          year: 2025,
          quantity: 12,
          status: "planted"
        }
      ]
    });
    expect(detail2026?.currentContents.yearlyPlantings).toEqual([
      {
        id: YearlyPlantingIds.pepper2026A,
        plantName: "Pepper",
        year: 2026,
        quantity: 8,
        status: "planned"
      }
    ]);
    expect(Number(historicalRows.rows[0]?.count)).toBe(3);
  });

  it("findManyByIds and listActiveByPlace preserve account and active-row boundaries", async () => {
    await insertBed(pool, {
      id: BedIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Active bed"
    });
    await insertBed(pool, {
      id: BedIds.removedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Removed bed",
      status: "removed"
    });
    await insertBed(pool, {
      id: BedIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Archived bed",
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertBed(pool, {
      id: BedIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      name: "Other account bed"
    });

    const byIds = await repository.findManyByIds(AccountFixtureIds.accountA, [
      BedIds.activeA,
      BedIds.removedA,
      BedIds.archivedA,
      BedIds.activeB
    ]);
    const active = await repository.listActiveByPlace(AccountFixtureIds.accountA, PlaceIds.placeA);

    expect(byIds.map((bed) => bed.id).sort()).toEqual([BedIds.activeA, BedIds.removedA].sort());
    expect(active.map((bed) => bed.id)).toEqual([BedIds.activeA]);
  });

  it("does not update or archive cross-account beds", async () => {
    await insertBed(pool, {
      id: BedIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      name: "Other account bed"
    });

    await expect(repository.findById(AccountFixtureIds.accountA, BedIds.activeB)).resolves.toBeNull();
    await expect(repository.update(AccountFixtureIds.accountA, BedIds.activeB, { name: "Nope" })).resolves.toBeNull();
    await expect(repository.archive(AccountFixtureIds.accountA, BedIds.activeB)).resolves.toBe(false);
  });

  it("can operate on an explicit transaction handle", async () => {
    const created = await dbClient.transaction(async (trx) =>
      repository.create(
        {
          accountId: AccountFixtureIds.accountA,
          placeId: PlaceIds.placeA,
          name: "Transaction bed"
        },
        trx
      )
    );

    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toMatchObject({
      id: created.id,
      name: "Transaction bed"
    });
  });
});

function defaultFilters(): ListBedsFilters {
  return {
    page: 1,
    pageSize: 20
  };
}

async function insertBasePlacesAndPlants(pool: Pool): Promise<void> {
  await insertPlace(pool, {
    id: PlaceIds.placeA,
    accountId: AccountFixtureIds.accountA,
    name: "Home Garden"
  });
  await insertPlace(pool, {
    id: PlaceIds.otherPlaceA,
    accountId: AccountFixtureIds.accountA,
    name: "Allotment"
  });
  await insertPlace(pool, {
    id: PlaceIds.placeB,
    accountId: AccountFixtureIds.accountB,
    name: "Other Account Garden"
  });
  await insertPlant(pool, {
    id: PlantIds.strawberryA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Strawberry",
    lifecycleType: "perennial",
    growingStyle: "berry"
  });
  await insertPlant(pool, {
    id: PlantIds.tomatoA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Tomato",
    variety: "Roma"
  });
  await insertPlant(pool, {
    id: PlantIds.pepperA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Pepper"
  });
  await insertPlant(pool, {
    id: PlantIds.tomatoB,
    accountId: AccountFixtureIds.accountB,
    commonName: "Tomato"
  });
}

async function insertPlace(pool: Pool, input: { id: string; accountId: string; name: string }): Promise<void> {
  await pool.query("insert into places (id, account_id, name) values ($1, $2, $3)", [
    input.id,
    input.accountId,
    input.name
  ]);
}

async function insertPlant(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    commonName: string;
    variety?: string | null;
    lifecycleType?: "annual" | "biennial" | "perennial";
    growingStyle?: "tree" | "shrub" | "vine" | "herb" | "vegetable" | "berry" | "flower" | "other";
  }
): Promise<void> {
  await pool.query(
    `insert into plants (id, account_id, common_name, variety, lifecycle_type, growing_style)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      input.id,
      input.accountId,
      input.commonName,
      input.variety ?? null,
      input.lifecycleType ?? "annual",
      input.growingStyle ?? "vegetable"
    ]
  );
}

async function insertBed(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    placeId: string;
    name: string;
    description?: string | null;
    notes?: string | null;
    widthM?: number | null;
    lengthM?: number | null;
    areaM2?: number | null;
    status?: "active" | "removed" | "archived";
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into beds (
       id, account_id, place_id, name, description, notes, width_m, length_m, area_m2, status, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      input.id,
      input.accountId,
      input.placeId,
      input.name,
      input.description ?? null,
      input.notes ?? null,
      input.widthM ?? null,
      input.lengthM ?? null,
      input.areaM2 ?? null,
      input.status ?? "active",
      input.archivedAt ?? null
    ]
  );
}

async function insertPersistentBedPlant(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    bedId: string;
    plantId: string;
    quantity?: number | null;
    status?: "active" | "removed" | "archived";
  }
): Promise<void> {
  await pool.query(
    `insert into persistent_bed_plants (id, account_id, bed_id, plant_id, quantity, status)
     values ($1, $2, $3, $4, $5, $6)`,
    [input.id, input.accountId, input.bedId, input.plantId, input.quantity ?? null, input.status ?? "active"]
  );
}

async function insertYearlyBedPlanting(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    bedId: string;
    plantId: string;
    year: number;
    quantity?: number | null;
    status?: "planned" | "planted" | "removed" | "harvested" | "archived";
  }
): Promise<void> {
  await pool.query(
    `insert into yearly_bed_plantings (id, account_id, bed_id, plant_id, year, quantity, status)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [input.id, input.accountId, input.bedId, input.plantId, input.year, input.quantity ?? null, input.status ?? "planted"]
  );
}
