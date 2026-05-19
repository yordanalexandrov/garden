import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyPlantsRepository } from "../../src/modules/plants/plants.repository.js";
import type { ListPlantsFilters } from "../../src/modules/plants/plants.types.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const PlantIds = {
  tomatoA: "11111111-1111-1111-1111-111111111111",
  archivedA: "22222222-2222-2222-2222-222222222222",
  pepperA: "33333333-3333-3333-3333-333333333333",
  tomatoB: "44444444-4444-4444-4444-444444444444"
} as const;

describeDatabase("KyselyPlantsRepository", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let repository: KyselyPlantsRepository;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    repository = new KyselyPlantsRepository(dbClient);
  });

  afterEach(async () => {
    await dbClient.destroy();
    await pool.end();
  });

  it("lists only active plants for the requested account by default", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato"
    });
    await insertPlant(pool, {
      id: PlantIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Old Tomato",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertPlant(pool, {
      id: PlantIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      commonName: "Other Account Tomato"
    });

    const result = await repository.list(AccountFixtureIds.accountA, defaultFilters());

    expect(result).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        id: PlantIds.tomatoA,
        accountId: AccountFixtureIds.accountA,
        commonName: "Tomato",
        archivedAt: null
      })
    ]);
  });

  it("includes archived account plants only when includeArchived is explicit", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato"
    });
    await insertPlant(pool, {
      id: PlantIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Old Tomato",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertPlant(pool, {
      id: PlantIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      commonName: "Other Account Tomato"
    });

    const result = await repository.list(AccountFixtureIds.accountA, {
      ...defaultFilters(),
      includeArchived: true
    });

    expect(result.total).toBe(2);
    expect(result.items.map((plant) => plant.id).sort()).toEqual([PlantIds.archivedA, PlantIds.tomatoA].sort());
  });

  it("applies q, lifecycleType, growingStyle, and pagination inside the account scope", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato",
      variety: "Roma",
      plantCategory: "vegetable",
      lifecycleType: "annual",
      growingStyle: "vegetable",
      notes: "Seed indoors"
    });
    await insertPlant(pool, {
      id: PlantIds.pepperA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Pepper",
      plantCategory: "vegetable",
      lifecycleType: "annual",
      growingStyle: "vegetable"
    });
    await insertPlant(pool, {
      id: PlantIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      commonName: "Tomato",
      variety: "Roma",
      plantCategory: "vegetable",
      lifecycleType: "annual",
      growingStyle: "vegetable"
    });

    const result = await repository.list(AccountFixtureIds.accountA, {
      ...defaultFilters(),
      q: "roma",
      lifecycleType: "annual",
      growingStyle: "vegetable",
      pageSize: 1
    });

    expect(result.total).toBe(1);
    expect(result.items).toEqual([
      expect.objectContaining({
        id: PlantIds.tomatoA,
        commonName: "Tomato",
        variety: "Roma",
        plantCategory: "vegetable"
      })
    ]);
  });

  it("creates, updates, archives, and allows duplicate names without hard deleting plants", async () => {
    const created = await repository.create({
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato",
      variety: "Roma",
      plantCategory: "vegetable",
      lifecycleType: "annual",
      growingStyle: "vegetable",
      notes: "Seed indoors"
    });

    expect(created).toMatchObject({
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato",
      variety: "Roma"
    });

    const duplicate = await repository.create({
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato",
      lifecycleType: "annual",
      growingStyle: "vegetable"
    });

    expect(duplicate.id).not.toBe(created.id);
    expect(duplicate.commonName).toBe("Tomato");

    const updated = await repository.update(AccountFixtureIds.accountA, created.id, {
      variety: "San Marzano",
      notes: null
    });

    expect(updated).toMatchObject({
      id: created.id,
      variety: "San Marzano",
      notes: null
    });

    await expect(repository.archive(AccountFixtureIds.accountA, created.id)).resolves.toBe(true);
    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toBeNull();

    const archivedRow = await pool.query<{ archived_at: Date | null }>("select archived_at from plants where id = $1", [
      created.id
    ]);
    expect(archivedRow.rowCount).toBe(1);
    expect(archivedRow.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("does not update or archive cross-account plants", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      commonName: "Other Account Tomato"
    });

    await expect(repository.findById(AccountFixtureIds.accountA, PlantIds.tomatoB)).resolves.toBeNull();
    await expect(repository.update(AccountFixtureIds.accountA, PlantIds.tomatoB, { commonName: "Nope" })).resolves.toBeNull();
    await expect(repository.archive(AccountFixtureIds.accountA, PlantIds.tomatoB)).resolves.toBe(false);
  });

  it("can operate on an explicit transaction handle", async () => {
    const created = await dbClient.transaction(async (trx) =>
      repository.create(
        {
          accountId: AccountFixtureIds.accountA,
          commonName: "Transaction Plant",
          lifecycleType: "perennial",
          growingStyle: "herb"
        },
        trx
      )
    );

    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toMatchObject({
      id: created.id,
      commonName: "Transaction Plant"
    });
  });
});

function defaultFilters(): ListPlantsFilters {
  return {
    includeArchived: false,
    page: 1,
    pageSize: 20
  };
}

async function insertPlant(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    commonName: string;
    variety?: string | null;
    plantCategory?: string | null;
    lifecycleType?: string;
    growingStyle?: string;
    notes?: string | null;
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into plants (
       id, account_id, common_name, variety, plant_category, lifecycle_type,
       growing_style, notes, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.id,
      input.accountId,
      input.commonName,
      input.variety ?? null,
      input.plantCategory ?? null,
      input.lifecycleType ?? "annual",
      input.growingStyle ?? "vegetable",
      input.notes ?? null,
      input.archivedAt ?? null
    ]
  );
}
