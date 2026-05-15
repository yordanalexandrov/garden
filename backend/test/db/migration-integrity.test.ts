import type { Pool, QueryResult, QueryResultRow } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import {
  applyBaselineMigrations,
  MIGRATIONS_TABLE_NAME,
  resetPublicSchema
} from "../../src/db/migrations/migrator.js";
import {
  FixtureIds,
  insertActivity,
  insertCoreFixture,
  insertInventoryLot,
  insertProblem,
  insertProductUsageRule,
  insertTask
} from "./helpers/fixtures.js";
import {
  applySeedAgain,
  createTestPool,
  hasTestDatabase,
  resetAndApplyBaseline
} from "./helpers/test-database.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;
const demoAccountId = "00000000-0000-0000-0000-000000000001";
const demoProductId = "70000000-0000-0000-0000-000000000001";
const demoPlantId = "10000000-0000-0000-0000-000000000006";

describeDatabase("phase 2 database migration integrity", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
  });

  beforeEach(async () => {
    await resetAndApplyBaseline(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("applies all baseline migrations to an empty database in order", async () => {
    const tables = await pool.query<{ table_name: string }>(
      `select table_name
       from information_schema.tables
       where table_schema = 'public' and table_type = 'BASE TABLE'
       order by table_name`
    );
    const views = await pool.query<{ table_name: string }>(
      `select table_name
       from information_schema.views
       where table_schema = 'public'
       order by table_name`
    );

    expect(tables.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        MIGRATIONS_TABLE_NAME,
        "accounts",
        "products",
        "inventory_lots",
        "activities",
        "tasks",
        "problem_photos"
      ])
    );
    expect(views.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining(["inventory_product_balances", "activity_detail_view", "task_detail_view"])
    );
  });

  it("skips already applied baseline migrations on rerun", async () => {
    const applied = await applyBaselineMigrations(pool);
    const migrationRecords = await pool.query<{ count: string }>(`select count(*) from ${MIGRATIONS_TABLE_NAME}`);

    expect(applied).toEqual([]);
    expect(firstRow(migrationRecords).count).toBe("4");
  });

  it("serializes concurrent baseline migration runs with an advisory lock", async () => {
    await resetPublicSchema(pool);

    const [first, second] = await Promise.all([applyBaselineMigrations(pool), applyBaselineMigrations(pool)]);
    const migrationRecords = await pool.query<{ count: string }>(`select count(*) from ${MIGRATIONS_TABLE_NAME}`);

    expect([first.length, second.length].sort()).toEqual([0, 4]);
    expect(firstRow(migrationRecords).count).toBe("4");
  });

  it("applies seed data deterministically for local/dev/test use", async () => {
    await applySeedAgain(pool);

    const result = await pool.query<{ count: string }>("select count(*) from accounts where id = $1", [demoAccountId]);

    expect(firstRow(result).count).toBe("1");
  });

  it("updates updated_at through the trigger on mutable records", async () => {
    const beforeUpdate = await pool.query<{ updated_at: Date }>("select updated_at from products where id = $1", [
      demoProductId
    ]);

    await pool.query("select pg_sleep(0.02)");
    await pool.query("update products set notes = 'updated by trigger test' where id = $1", [demoProductId]);

    const afterUpdate = await pool.query<{ updated_at: Date }>("select updated_at from products where id = $1", [
      demoProductId
    ]);

    expect(firstRow(afterUpdate).updated_at.getTime()).toBeGreaterThan(firstRow(beforeUpdate).updated_at.getTime());
  });

  it("rejects representative enum and check constraint violations", async () => {
    await expect(
      pool.query(
        "insert into products (account_id, name, category, default_unit) values ($1, 'Invalid Product', 'invalid', 'g')",
        [demoAccountId]
      )
    ).rejects.toMatchObject({ code: "23514" });

    await expect(
      pool.query(
        `insert into inventory_lots (account_id, product_id, quantity_initial, quantity_remaining, unit)
         values ($1, $2, 100, -1, 'g')`,
        [demoAccountId, demoProductId]
      )
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("rejects duplicate active product usage rules and allows replacement after archive", async () => {
    await expect(
      pool.query(
        `insert into product_usage_rules (account_id, product_id, plant_id, dose_value, dose_unit)
         values ($1, $2, $3, 20, 'g')`,
        [demoAccountId, demoProductId, demoPlantId]
      )
    ).rejects.toMatchObject({ code: "23505" });

    await pool.query("update product_usage_rules set archived_at = now() where product_id = $1 and plant_id = $2", [
      demoProductId,
      demoPlantId
    ]);
    await expect(
      pool.query(
        `insert into product_usage_rules (account_id, product_id, plant_id, dose_value, dose_unit)
         values ($1, $2, $3, 20, 'g')`,
        [demoAccountId, demoProductId, demoPlantId]
      )
    ).resolves.toBeDefined();
  });

  it("rejects duplicate activity target rows", async () => {
    await insertCoreFixture(pool);
    await insertActivity(pool, FixtureIds.activityA, FixtureIds.accountA, FixtureIds.placeA);

    await pool.query("insert into activity_targets (activity_id, target_type, target_id) values ($1, 'place', $2)", [
      FixtureIds.activityA,
      FixtureIds.placeA
    ]);

    await expect(
      pool.query("insert into activity_targets (activity_id, target_type, target_id) values ($1, 'place', $2)", [
        FixtureIds.activityA,
        FixtureIds.placeA
      ])
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("rejects duplicate task target rows", async () => {
    await insertCoreFixture(pool);
    await insertTask(pool, FixtureIds.taskA, FixtureIds.accountA, FixtureIds.placeA);

    await pool.query("insert into task_targets (task_id, target_type, target_id) values ($1, 'place', $2)", [
      FixtureIds.taskA,
      FixtureIds.placeA
    ]);

    await expect(
      pool.query("insert into task_targets (task_id, target_type, target_id) values ($1, 'place', $2)", [
        FixtureIds.taskA,
        FixtureIds.placeA
      ])
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("rejects reminders for non-planned tasks", async () => {
    await insertCoreFixture(pool);
    await insertTask(pool, FixtureIds.taskA, FixtureIds.accountA, FixtureIds.placeA, "suggested");

    await expect(
      pool.query(
        `insert into task_reminders (task_id, reminder_type, scheduled_for, status)
         values ($1, 'same_day', now(), 'scheduled')`,
        [FixtureIds.taskA]
      )
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("rejects problem photos for observations", async () => {
    await insertCoreFixture(pool);
    await insertProblem(pool, FixtureIds.problemA, FixtureIds.accountA, FixtureIds.placeA, "observation");

    await expect(
      pool.query("insert into problem_photos (problem_id, storage_key) values ($1, 'problems/observation.jpg')", [
        FixtureIds.problemA
      ])
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("rejects representative cross-account product mismatch guards", async () => {
    await insertCoreFixture(pool);

    await expect(
      insertProductUsageRule(pool, FixtureIds.ruleA, FixtureIds.accountA, FixtureIds.productB, FixtureIds.plantA)
    ).rejects.toMatchObject({ code: "23514" });

    await expect(
      insertInventoryLot(pool, FixtureIds.lotA, FixtureIds.accountA, FixtureIds.productB)
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("commits successful DbClient.transaction callbacks", async () => {
    const client = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );

    try {
      const insertedId = await client.transaction(async (trx) => {
        await trx.db
          .insertInto("accounts")
          .values({
            id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            email: "committed@example.com",
            display_name: "Committed"
          })
          .execute();

        return "cccccccc-cccc-cccc-cccc-cccccccccccc";
      });
      const result = await pool.query<{ count: string }>("select count(*) from accounts where id = $1", [insertedId]);

      expect(firstRow(result).count).toBe("1");
    } finally {
      await client.destroy();
    }
  });

  it("rolls back failed DbClient.transaction callbacks", async () => {
    const client = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );

    try {
      await expect(
        client.transaction(async (trx) => {
          await trx.db
            .insertInto("accounts")
            .values({
              id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              email: "rolled-back@example.com",
              display_name: "Rolled Back"
            })
            .execute();

          throw new Error("force rollback");
        })
      ).rejects.toThrow("force rollback");

      const result = await pool.query<{ count: string }>("select count(*) from accounts where id = $1", [
        "dddddddd-dddd-dddd-dddd-dddddddddddd"
      ]);

      expect(firstRow(result).count).toBe("0");
    } finally {
      await client.destroy();
    }
  });
});

function firstRow<T extends QueryResultRow>(result: QueryResult<T>): T {
  const row = result.rows[0];

  if (row === undefined) {
    throw new Error("Expected query to return at least one row");
  }

  return row;
}
