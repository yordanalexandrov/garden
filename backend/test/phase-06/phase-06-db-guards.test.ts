import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  FixtureIds,
  insertBed,
  insertCoreFixture
} from "../db/helpers/fixtures.js";
import {
  createTestPool,
  hasTestDatabase,
  resetAndApplyBaseline
} from "../db/helpers/test-database.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

describeDatabase("Phase 6 database account consistency guards", () => {
  let pool: Pool;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertCoreFixture(pool);
    await insertBed(pool, {
      id: FixtureIds.bedA,
      accountId: FixtureIds.accountA,
      placeId: FixtureIds.placeA,
      name: "Fixture Bed A"
    });
  });

  afterEach(async () => {
    await pool.end();
  });

  it("rejects representative mismatched account references for growing structure rows", async () => {
    await expect(
      pool.query(
        `insert into perennials (id, account_id, place_id, plant_id, status)
         values ($1, $2, $3, $4, 'active')`,
        [FixtureIds.perennialA, FixtureIds.accountA, FixtureIds.placeB, FixtureIds.plantA]
      )
    ).rejects.toThrow(/perennial\.account_id must match place\.account_id/);

    await expect(
      pool.query(
        `insert into beds (id, account_id, place_id, name, status)
         values ($1, $2, $3, 'Cross account bed', 'active')`,
        [FixtureIds.bedB, FixtureIds.accountA, FixtureIds.placeB]
      )
    ).rejects.toThrow(/bed\.account_id must match place\.account_id/);

    await expect(
      pool.query(
        `insert into persistent_bed_plants (id, account_id, bed_id, plant_id, status)
         values ($1, $2, $3, $4, 'active')`,
        [FixtureIds.persistentBedPlantA, FixtureIds.accountA, FixtureIds.bedA, FixtureIds.plantB]
      )
    ).rejects.toThrow(/persistent_bed_plant\.account_id must match plant\.account_id/);

    await expect(
      pool.query(
        `insert into yearly_bed_plantings (id, account_id, bed_id, plant_id, year, status)
         values ($1, $2, $3, $4, 2026, 'planted')`,
        [FixtureIds.yearlyBedPlantingA2026, FixtureIds.accountA, FixtureIds.bedA, FixtureIds.plantB]
      )
    ).rejects.toThrow(/yearly_bed_planting\.account_id must match plant\.account_id/);
  });
});
