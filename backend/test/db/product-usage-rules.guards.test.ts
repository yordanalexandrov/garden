import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FixtureIds, insertCoreFixture, insertProductUsageRule } from "./helpers/fixtures.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "./helpers/test-database.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

describeDatabase("product usage rule database guards", () => {
  let pool: Pool;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertCoreFixture(pool);
  });

  afterEach(async () => {
    await pool.end();
  });

  it("rejects product and plant account mismatches", async () => {
    await expect(
      pool.query(
        `insert into product_usage_rules (id, account_id, product_id, plant_id, dose_value, dose_unit)
         values ($1, $2, $3, $4, 20, 'g')`,
        ["31313131-3131-4131-8131-313131313131", FixtureIds.accountA, FixtureIds.productB, FixtureIds.plantA]
      )
    ).rejects.toThrow(/product_usage_rule\.account_id must match product\.account_id/);

    await expect(
      pool.query(
        `insert into product_usage_rules (id, account_id, product_id, plant_id, dose_value, dose_unit)
         values ($1, $2, $3, $4, 20, 'g')`,
        ["32323232-3232-4232-8232-323232323232", FixtureIds.accountA, FixtureIds.productA, FixtureIds.plantB]
      )
    ).rejects.toThrow(/product_usage_rule\.account_id must match plant\.account_id/);
  });

  it("enforces one active product+plant rule and allows replacement after archive", async () => {
    await insertProductUsageRule(pool, FixtureIds.ruleA, FixtureIds.accountA, FixtureIds.productA, FixtureIds.plantA);

    await expect(
      pool.query(
        `insert into product_usage_rules (id, account_id, product_id, plant_id, dose_value, dose_unit)
         values ($1, $2, $3, $4, 25, 'g')`,
        ["33333333-3333-4333-8333-333333333333", FixtureIds.accountA, FixtureIds.productA, FixtureIds.plantA]
      )
    ).rejects.toMatchObject({
      code: "23505",
      constraint: "uq_product_usage_rules_product_plant_active"
    });

    await pool.query("update product_usage_rules set archived_at = now() where id = $1", [FixtureIds.ruleA]);

    await expect(
      pool.query(
        `insert into product_usage_rules (id, account_id, product_id, plant_id, dose_value, dose_unit)
         values ($1, $2, $3, $4, 25, 'g')`,
        ["34343434-3434-4434-8434-343434343434", FixtureIds.accountA, FixtureIds.productA, FixtureIds.plantA]
      )
    ).resolves.toBeDefined();
  });
});
