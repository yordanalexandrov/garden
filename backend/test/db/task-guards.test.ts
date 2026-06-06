import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FixtureIds, insertGrowingStructureFixture } from "./helpers/fixtures.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "./helpers/test-database.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

describeDatabase("task database guards", () => {
  let pool: Pool;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertGrowingStructureFixture(pool);
  });

  afterEach(async () => {
    await pool.end();
  });

  it("rejects reminders for non-planned tasks and cross-place task targets", async () => {
    await pool.query(
      `insert into tasks (id, account_id, place_id, type, due_date, target_scope_type, status)
       values ($1, $2, $3, 'spraying', '2026-05-20', 'whole_place', 'suggested')`,
      [FixtureIds.taskA, FixtureIds.accountA, FixtureIds.placeA]
    );

    await expect(
      pool.query(
        `insert into task_reminders (task_id, reminder_type, scheduled_for, status)
         values ($1, 'same_day', now(), 'scheduled')`,
        [FixtureIds.taskA]
      )
    ).rejects.toThrow(/task reminders may only be attached to planned tasks/);

    await expect(
      pool.query("insert into task_targets (task_id, target_type, target_id) values ($1, 'bed', $2)", [
        FixtureIds.taskA,
        FixtureIds.bedB
      ])
    ).rejects.toThrow(/task target must belong to same account as task/);
  });
});
