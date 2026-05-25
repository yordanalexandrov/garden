import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyProductsRepository } from "../../src/modules/products/products.repository.js";
import type { ListProductsFilters } from "../../src/modules/products/products.types.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const ProductIds = {
  copperA: "11111111-1111-4111-8111-111111111111",
  archivedA: "22222222-2222-4222-8222-222222222222",
  sulfurA: "33333333-3333-4333-8333-333333333333",
  copperB: "44444444-4444-4444-8444-444444444444"
} as const;

const PlantIds = {
  tomatoA: "55555555-5555-4555-8555-555555555555",
  pepperA: "66666666-6666-4666-8666-666666666666"
} as const;

describeDatabase("KyselyProductsRepository", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let repository: KyselyProductsRepository;

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
    repository = new KyselyProductsRepository(dbClient);
  });

  afterEach(async () => {
    await dbClient.destroy();
    await pool.end();
  });

  it("lists active account products by default with active rule counts", async () => {
    await insertProduct(pool, {
      id: ProductIds.copperA,
      accountId: AccountFixtureIds.accountA,
      name: "Copper Fungicide",
      category: "fungicide"
    });
    await insertProduct(pool, {
      id: ProductIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      name: "Old Copper",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertProduct(pool, {
      id: ProductIds.copperB,
      accountId: AccountFixtureIds.accountB,
      name: "Other Account Copper"
    });
    await insertPlant(pool, PlantIds.tomatoA, AccountFixtureIds.accountA, "Tomato");
    await insertPlant(pool, PlantIds.pepperA, AccountFixtureIds.accountA, "Pepper");
    await insertUsageRule(pool, AccountFixtureIds.accountA, ProductIds.copperA, PlantIds.tomatoA);
    await insertUsageRule(pool, AccountFixtureIds.accountA, ProductIds.copperA, PlantIds.pepperA);

    const result = await repository.list(AccountFixtureIds.accountA, defaultFilters());

    expect(result).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        id: ProductIds.copperA,
        accountId: AccountFixtureIds.accountA,
        name: "Copper Fungicide",
        category: "fungicide",
        defaultUnit: "g",
        rulesCount: 2,
        archivedAt: null
      })
    ]);
  });

  it("supports q, category, pagination, and includeArchived inside account scope", async () => {
    await insertProduct(pool, {
      id: ProductIds.copperA,
      accountId: AccountFixtureIds.accountA,
      name: "Copper Fungicide",
      category: "fungicide",
      activeSubstance: "Copper"
    });
    await insertProduct(pool, {
      id: ProductIds.sulfurA,
      accountId: AccountFixtureIds.accountA,
      name: "Sulfur Fungicide",
      category: "fungicide"
    });
    await insertProduct(pool, {
      id: ProductIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      name: "Archived Copper",
      category: "fungicide",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertProduct(pool, {
      id: ProductIds.copperB,
      accountId: AccountFixtureIds.accountB,
      name: "Copper Fungicide",
      category: "fungicide"
    });

    const result = await repository.list(AccountFixtureIds.accountA, {
      ...defaultFilters(),
      q: "copper",
      category: "fungicide",
      includeArchived: true,
      pageSize: 1
    });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: ProductIds.archivedA,
      name: "Archived Copper"
    });
  });

  it("creates, updates, archives, and does not hard-delete products", async () => {
    const created = await repository.create({
      accountId: AccountFixtureIds.accountA,
      name: "Copper Fungicide",
      category: "fungicide",
      activeSubstance: "Copper",
      manufacturer: "Example Co",
      formulation: "WG",
      defaultUnit: "g",
      notes: "Use with care"
    });

    expect(created).toMatchObject({
      accountId: AccountFixtureIds.accountA,
      name: "Copper Fungicide",
      category: "fungicide"
    });

    const updated = await repository.update(AccountFixtureIds.accountA, created.id, {
      manufacturer: null,
      notes: "Updated"
    });

    expect(updated).toMatchObject({
      id: created.id,
      manufacturer: null,
      notes: "Updated"
    });

    await expect(repository.archive(AccountFixtureIds.accountA, created.id)).resolves.toBe(true);
    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toBeNull();

    const archivedRow = await pool.query<{ archived_at: Date | null }>("select archived_at from products where id = $1", [
      created.id
    ]);
    expect(archivedRow.rowCount).toBe(1);
    expect(archivedRow.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("does not find, update, or archive cross-account products", async () => {
    await insertProduct(pool, {
      id: ProductIds.copperB,
      accountId: AccountFixtureIds.accountB,
      name: "Other Account Copper"
    });

    await expect(repository.findById(AccountFixtureIds.accountA, ProductIds.copperB)).resolves.toBeNull();
    await expect(repository.update(AccountFixtureIds.accountA, ProductIds.copperB, { name: "Nope" })).resolves.toBeNull();
    await expect(repository.archive(AccountFixtureIds.accountA, ProductIds.copperB)).resolves.toBe(false);
  });

  it("can operate on an explicit transaction handle", async () => {
    const created = await dbClient.transaction(async (trx) =>
      repository.create(
        {
          accountId: AccountFixtureIds.accountA,
          name: "Transaction Product",
          category: "fertilizer",
          defaultUnit: "ml"
        },
        trx
      )
    );

    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toMatchObject({
      id: created.id,
      name: "Transaction Product"
    });
  });
});

function defaultFilters(): ListProductsFilters {
  return {
    includeArchived: false,
    page: 1,
    pageSize: 20
  };
}

async function insertProduct(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    name: string;
    category?: string;
    activeSubstance?: string | null;
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into products (id, account_id, name, category, active_substance, default_unit, archived_at)
     values ($1, $2, $3, $4, $5, 'g', $6)`,
    [
      input.id,
      input.accountId,
      input.name,
      input.category ?? "fungicide",
      input.activeSubstance ?? null,
      input.archivedAt ?? null
    ]
  );
}

async function insertPlant(pool: Pool, id: string, accountId: string, name: string): Promise<void> {
  await pool.query(
    `insert into plants (id, account_id, common_name, lifecycle_type, growing_style)
     values ($1, $2, $3, 'annual', 'vegetable')`,
    [id, accountId, name]
  );
}

async function insertUsageRule(pool: Pool, accountId: string, productId: string, plantId: string): Promise<void> {
  await pool.query(
    `insert into product_usage_rules (account_id, product_id, plant_id, dose_value, dose_unit)
     values ($1, $2, $3, 20, 'g')`,
    [accountId, productId, plantId]
  );
}
