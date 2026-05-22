import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyPersistentBedPlantsRepository } from "../../src/modules/plantings/persistent-bed-plants.repository.js";
import type { ListPersistentBedPlantsFilters } from "../../src/modules/plantings/persistent-bed-plants.types.js";
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
  mintA: "55555555-5555-5555-5555-555555555555",
  strawberryB: "66666666-6666-6666-6666-666666666666"
} as const;

const BedIds = {
  bedA: "77777777-7777-7777-7777-777777777777",
  otherPlaceA: "88888888-8888-8888-8888-888888888888",
  bedB: "99999999-9999-9999-9999-999999999999"
} as const;

const PersistentPlantIds = {
  activeA: "10101010-1010-1010-1010-101010101010",
  removedA: "12121212-1212-1212-1212-121212121212",
  archivedA: "13131313-1313-1313-1313-131313131313",
  otherBedA: "14141414-1414-1414-1414-141414141414",
  activeB: "15151515-1515-1515-1515-151515151515",
  corruptedPlantA: "16161616-1616-1616-1616-161616161616"
} as const;

describeDatabase("KyselyPersistentBedPlantsRepository", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let repository: KyselyPersistentBedPlantsRepository;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertBasePlacesPlantsAndBeds(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    repository = new KyselyPersistentBedPlantsRepository(dbClient);
  });

  afterEach(async () => {
    await dbClient.destroy();
    await pool.end();
  });

  it("lists only unarchived account-owned persistent plants for the requested bed by default", async () => {
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.activeA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.strawberryA,
      plantedYear: 2020,
      quantity: 10
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.mintA,
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.otherBedA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.otherPlaceA,
      plantId: PlantIds.mintA
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.activeB,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.bedB,
      plantId: PlantIds.strawberryB
    });

    const result = await repository.listByBed(AccountFixtureIds.accountA, BedIds.bedA, defaultFilters());

    expect(result).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        id: PersistentPlantIds.activeA,
        accountId: AccountFixtureIds.accountA,
        bedId: BedIds.bedA,
        plantId: PlantIds.strawberryA,
        plantName: "Strawberry",
        plantedYear: 2020,
        quantity: 10,
        archivedAt: null
      })
    ]);
  });

  it("supports status filters, pagination, and archived status listing inside the account scope", async () => {
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.activeA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.strawberryA
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.removedA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.mintA,
      status: "removed",
      quantity: 2
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.mintA,
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });

    const removed = await repository.listByBed(AccountFixtureIds.accountA, BedIds.bedA, {
      ...defaultFilters(),
      status: "removed",
      pageSize: 1
    });
    const archived = await repository.listByBed(AccountFixtureIds.accountA, BedIds.bedA, {
      ...defaultFilters(),
      status: "archived"
    });

    expect(removed).toMatchObject({
      total: 1,
      pageSize: 1
    });
    expect(removed.items).toEqual([expect.objectContaining({ id: PersistentPlantIds.removedA, status: "removed" })]);
    expect(archived.items).toEqual([expect.objectContaining({ id: PersistentPlantIds.archivedA, status: "archived" })]);
  });

  it("creates, updates, and archives persistent bed plants without hard deleting them", async () => {
    const created = await repository.create({
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.strawberryA,
      plantedYear: 2021,
      quantity: 8,
      notes: "Runner patch"
    });

    expect(created).toMatchObject({
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.strawberryA,
      status: "active",
      plantedYear: 2021,
      quantity: 8
    });

    const updated = await repository.update(AccountFixtureIds.accountA, created.id, {
      plantId: PlantIds.mintA,
      plantedYear: 2022,
      quantity: null,
      notes: null,
      status: "removed"
    });

    expect(updated).toMatchObject({
      id: created.id,
      plantId: PlantIds.mintA,
      plantedYear: 2022,
      quantity: null,
      notes: null,
      status: "removed"
    });

    await expect(repository.archive(AccountFixtureIds.accountA, created.id)).resolves.toBe(true);
    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toBeNull();

    const archivedRow = await pool.query<{ status: string; archived_at: Date | null }>(
      "select status, archived_at from persistent_bed_plants where id = $1",
      [created.id]
    );
    expect(archivedRow.rowCount).toBe(1);
    expect(archivedRow.rows[0]).toMatchObject({ status: "archived" });
    expect(archivedRow.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("findManyByIds and listActiveByBed preserve account and active-row boundaries", async () => {
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.activeA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.strawberryA
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.removedA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.mintA,
      status: "removed"
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.mintA,
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.activeB,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.bedB,
      plantId: PlantIds.strawberryB
    });

    const byIds = await repository.findManyByIds(AccountFixtureIds.accountA, [
      PersistentPlantIds.activeA,
      PersistentPlantIds.removedA,
      PersistentPlantIds.archivedA,
      PersistentPlantIds.activeB
    ]);
    const active = await repository.listActiveByBed(AccountFixtureIds.accountA, BedIds.bedA);

    expect(byIds.map((persistentPlant) => persistentPlant.id).sort()).toEqual(
      [PersistentPlantIds.activeA, PersistentPlantIds.removedA].sort()
    );
    expect(active.map((persistentPlant) => persistentPlant.id)).toEqual([PersistentPlantIds.activeA]);
  });

  it("does not update or archive cross-account persistent bed plants", async () => {
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.activeB,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.bedB,
      plantId: PlantIds.strawberryB
    });

    await expect(repository.findById(AccountFixtureIds.accountA, PersistentPlantIds.activeB)).resolves.toBeNull();
    await expect(
      repository.update(AccountFixtureIds.accountA, PersistentPlantIds.activeB, { notes: "Nope" })
    ).resolves.toBeNull();
    await expect(repository.archive(AccountFixtureIds.accountA, PersistentPlantIds.activeB)).resolves.toBe(false);
  });

  it("does not join plant details across accounts when stored references are inconsistent", async () => {
    await pool.query("alter table persistent_bed_plants disable trigger trg_persistent_bed_plants_validate_consistency");
    try {
      await insertPersistentBedPlant(pool, {
        id: PersistentPlantIds.corruptedPlantA,
        accountId: AccountFixtureIds.accountA,
        bedId: BedIds.bedA,
        plantId: PlantIds.strawberryB
      });
    } finally {
      await pool.query("alter table persistent_bed_plants enable trigger trg_persistent_bed_plants_validate_consistency");
    }

    const listed = await repository.listByBed(AccountFixtureIds.accountA, BedIds.bedA, defaultFilters());

    expect(listed).toMatchObject({
      items: [],
      total: 0
    });
    await expect(repository.findById(AccountFixtureIds.accountA, PersistentPlantIds.corruptedPlantA)).resolves.toBeNull();
  });

  it("keeps older persistent plants active across year changes until explicitly archived", async () => {
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.activeA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.strawberryA,
      plantedYear: 2020
    });

    const active = await repository.listActiveByBed(AccountFixtureIds.accountA, BedIds.bedA);

    expect(active).toEqual([
      expect.objectContaining({
        id: PersistentPlantIds.activeA,
        plantedYear: 2020,
        status: "active"
      })
    ]);
  });

  it("can operate on an explicit transaction handle", async () => {
    const created = await dbClient.transaction(async (trx) =>
      repository.create(
        {
          accountId: AccountFixtureIds.accountA,
          bedId: BedIds.bedA,
          plantId: PlantIds.strawberryA,
          notes: "Transaction persistent plant"
        },
        trx
      )
    );

    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toMatchObject({
      id: created.id,
      notes: "Transaction persistent plant"
    });
  });
});

function defaultFilters(): ListPersistentBedPlantsFilters {
  return {
    page: 1,
    pageSize: 20
  };
}

async function insertBasePlacesPlantsAndBeds(pool: Pool): Promise<void> {
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
    id: PlantIds.mintA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Mint",
    variety: "Garden"
  });
  await insertPlant(pool, {
    id: PlantIds.strawberryB,
    accountId: AccountFixtureIds.accountB,
    commonName: "Strawberry"
  });
  await insertBed(pool, {
    id: BedIds.bedA,
    accountId: AccountFixtureIds.accountA,
    placeId: PlaceIds.placeA,
    name: "Bed A"
  });
  await insertBed(pool, {
    id: BedIds.otherPlaceA,
    accountId: AccountFixtureIds.accountA,
    placeId: PlaceIds.otherPlaceA,
    name: "Other place bed"
  });
  await insertBed(pool, {
    id: BedIds.bedB,
    accountId: AccountFixtureIds.accountB,
    placeId: PlaceIds.placeB,
    name: "Other account bed"
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
  }
): Promise<void> {
  await pool.query("insert into beds (id, account_id, place_id, name, status) values ($1, $2, $3, $4, 'active')", [
    input.id,
    input.accountId,
    input.placeId,
    input.name
  ]);
}

async function insertPersistentBedPlant(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    bedId: string;
    plantId: string;
    plantedYear?: number | null;
    quantity?: number | null;
    notes?: string | null;
    status?: "active" | "removed" | "archived";
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into persistent_bed_plants (
       id, account_id, bed_id, plant_id, planted_year, quantity, notes, status, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.id,
      input.accountId,
      input.bedId,
      input.plantId,
      input.plantedYear ?? null,
      input.quantity ?? null,
      input.notes ?? null,
      input.status ?? "active",
      input.archivedAt ?? null
    ]
  );
}
