import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyProductsRepository } from "../../src/modules/products/products.repository.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const ProductIds = {
  productA: "11111111-1111-4111-8111-111111111111",
  productB: "22222222-2222-4222-8222-222222222222"
} as const;

const PlantIds = {
  tomatoA: "33333333-3333-4333-8333-333333333333",
  pepperA: "44444444-4444-4444-8444-444444444444",
  tomatoB: "55555555-5555-4555-8555-555555555555"
} as const;

const RuleIds = {
  tomatoA: "66666666-6666-4666-8666-666666666666",
  pepperA: "77777777-7777-4777-8777-777777777777",
  tomatoB: "88888888-8888-4888-8888-888888888888"
} as const;

describeDatabase("KyselyProductsRepository product usage rules", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let repository: KyselyProductsRepository;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertProduct(pool, ProductIds.productA, AccountFixtureIds.accountA, "Product A");
    await insertProduct(pool, ProductIds.productB, AccountFixtureIds.accountB, "Product B");
    await insertPlant(pool, PlantIds.tomatoA, AccountFixtureIds.accountA, "Tomato");
    await insertPlant(pool, PlantIds.pepperA, AccountFixtureIds.accountA, "Pepper");
    await insertPlant(pool, PlantIds.tomatoB, AccountFixtureIds.accountB, "Other Tomato");
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

  it("lists only active rules for the requested account and product", async () => {
    await insertUsageRule(pool, RuleIds.tomatoA, AccountFixtureIds.accountA, ProductIds.productA, PlantIds.tomatoA);
    await insertUsageRule(pool, RuleIds.pepperA, AccountFixtureIds.accountA, ProductIds.productA, PlantIds.pepperA, {
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertUsageRule(pool, RuleIds.tomatoB, AccountFixtureIds.accountB, ProductIds.productB, PlantIds.tomatoB);

    const rules = await repository.listUsageRules(AccountFixtureIds.accountA, ProductIds.productA);

    expect(rules).toEqual([
      expect.objectContaining({
        id: RuleIds.tomatoA,
        accountId: AccountFixtureIds.accountA,
        productId: ProductIds.productA,
        plantId: PlantIds.tomatoA,
        doseValue: 20,
        doseUnit: "g",
        archivedAt: null
      })
    ]);
  });

  it("finds, creates, updates, and archives account-scoped usage rules without hard delete", async () => {
    const created = await repository.createUsageRule({
      accountId: AccountFixtureIds.accountA,
      productId: ProductIds.productA,
      plantId: PlantIds.tomatoA,
      doseValue: 20,
      doseUnit: "g",
      dilutionText: "20 g / 10 l water",
      applicationMethod: "foliar spray",
      reapplicationIntervalDays: 10,
      quarantinePeriodDays: 14,
      notes: "Rule notes"
    });

    expect(created).toMatchObject({
      accountId: AccountFixtureIds.accountA,
      productId: ProductIds.productA,
      plantId: PlantIds.tomatoA,
      doseValue: 20,
      quarantinePeriodDays: 14
    });

    await expect(repository.findUsageRuleById(AccountFixtureIds.accountA, created.id)).resolves.toMatchObject({
      id: created.id
    });

    const updated = await repository.updateUsageRule(AccountFixtureIds.accountA, created.id, {
      doseValue: 25,
      reapplicationIntervalDays: null,
      notes: null
    });

    expect(updated).toMatchObject({
      id: created.id,
      doseValue: 25,
      reapplicationIntervalDays: null,
      notes: null
    });

    await expect(repository.archiveUsageRule(AccountFixtureIds.accountA, created.id)).resolves.toBe(true);
    await expect(repository.findUsageRuleById(AccountFixtureIds.accountA, created.id)).resolves.toBeNull();

    const archivedRow = await pool.query<{ archived_at: Date | null }>(
      "select archived_at from product_usage_rules where id = $1",
      [created.id]
    );
    expect(archivedRow.rowCount).toBe(1);
    expect(archivedRow.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("detects active duplicates and ignores an excluded current rule", async () => {
    await insertUsageRule(pool, RuleIds.tomatoA, AccountFixtureIds.accountA, ProductIds.productA, PlantIds.tomatoA);

    await expect(
      repository.findActiveUsageRuleForProductPlant(
        AccountFixtureIds.accountA,
        ProductIds.productA,
        PlantIds.tomatoA
      )
    ).resolves.toMatchObject({
      id: RuleIds.tomatoA
    });
    await expect(
      repository.findActiveUsageRuleForProductPlant(
        AccountFixtureIds.accountA,
        ProductIds.productA,
        PlantIds.tomatoA,
        RuleIds.tomatoA
      )
    ).resolves.toBeNull();
  });

  it("does not find, update, or archive cross-account usage rules", async () => {
    await insertUsageRule(pool, RuleIds.tomatoB, AccountFixtureIds.accountB, ProductIds.productB, PlantIds.tomatoB);

    await expect(repository.findUsageRuleById(AccountFixtureIds.accountA, RuleIds.tomatoB)).resolves.toBeNull();
    await expect(
      repository.updateUsageRule(AccountFixtureIds.accountA, RuleIds.tomatoB, {
        doseValue: 30
      })
    ).resolves.toBeNull();
    await expect(repository.archiveUsageRule(AccountFixtureIds.accountA, RuleIds.tomatoB)).resolves.toBe(false);
  });

  it("allows replacement after an active rule is archived", async () => {
    await insertUsageRule(pool, RuleIds.tomatoA, AccountFixtureIds.accountA, ProductIds.productA, PlantIds.tomatoA);

    await expect(
      repository.createUsageRule({
        accountId: AccountFixtureIds.accountA,
        productId: ProductIds.productA,
        plantId: PlantIds.tomatoA,
        doseValue: 25,
        doseUnit: "g"
      })
    ).rejects.toMatchObject({
      code: "23505",
      constraint: "uq_product_usage_rules_product_plant_active"
    });

    await repository.archiveUsageRule(AccountFixtureIds.accountA, RuleIds.tomatoA);

    await expect(
      repository.createUsageRule({
        accountId: AccountFixtureIds.accountA,
        productId: ProductIds.productA,
        plantId: PlantIds.tomatoA,
        doseValue: 25,
        doseUnit: "g"
      })
    ).resolves.toMatchObject({
      productId: ProductIds.productA,
      plantId: PlantIds.tomatoA
    });
  });
});

async function insertProduct(pool: Pool, id: string, accountId: string, name: string): Promise<void> {
  await pool.query(
    "insert into products (id, account_id, name, category, default_unit) values ($1, $2, $3, 'fungicide', 'g')",
    [id, accountId, name]
  );
}

async function insertPlant(pool: Pool, id: string, accountId: string, name: string): Promise<void> {
  await pool.query(
    `insert into plants (id, account_id, common_name, lifecycle_type, growing_style)
     values ($1, $2, $3, 'annual', 'vegetable')`,
    [id, accountId, name]
  );
}

async function insertUsageRule(
  pool: Pool,
  id: string,
  accountId: string,
  productId: string,
  plantId: string,
  options: { archivedAt?: Date | null } = {}
): Promise<void> {
  await pool.query(
    `insert into product_usage_rules (id, account_id, product_id, plant_id, dose_value, dose_unit, archived_at)
     values ($1, $2, $3, $4, 20, 'g', $5)`,
    [id, accountId, productId, plantId, options.archivedAt ?? null]
  );
}
