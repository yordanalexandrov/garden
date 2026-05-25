import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FixtureIds, insertCoreFixture, insertInventoryLot } from "./helpers/fixtures.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "./helpers/test-database.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

describeDatabase("inventory database guards", () => {
  let pool: Pool;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertCoreFixture(pool);
  });

  afterEach(async () => {
    await pool.end();
  });

  it("rejects negative remaining quantity", async () => {
    await expect(
      pool.query(
        `insert into inventory_lots (id, account_id, product_id, quantity_initial, quantity_remaining, unit)
         values ($1, $2, $3, 10, -1, 'g')`,
        ["31313131-3131-4131-8131-313131313131", FixtureIds.accountA, FixtureIds.productA]
      )
    ).rejects.toMatchObject({ constraint: "inventory_lots_quantity_remaining_chk" });
  });

  it("rejects inventory lot product/account mismatches", async () => {
    await expect(
      pool.query(
        `insert into inventory_lots (id, account_id, product_id, quantity_initial, quantity_remaining, unit)
         values ($1, $2, $3, 10, 10, 'g')`,
        ["32323232-3232-4232-8232-323232323232", FixtureIds.accountA, FixtureIds.productB]
      )
    ).rejects.toThrow(/inventory_lot\.account_id must match product\.account_id/);
  });

  it("rejects inventory movement account and lot/product mismatches", async () => {
    await insertInventoryLot(pool, FixtureIds.lotA, FixtureIds.accountA, FixtureIds.productA, 100);

    await expect(
      pool.query(
        `insert into inventory_movements (
           id, account_id, product_id, inventory_lot_id, movement_type, quantity, unit, occurred_at
         )
         values ($1, $2, $3, $4, 'manual_adjustment', 1, 'g', now())`,
        ["33333333-3333-4333-8333-333333333333", FixtureIds.accountB, FixtureIds.productA, FixtureIds.lotA]
      )
    ).rejects.toThrow(/inventory_movement\.account_id must match product\.account_id/);

    await expect(
      pool.query(
        `insert into inventory_movements (
           id, account_id, product_id, inventory_lot_id, movement_type, quantity, unit, occurred_at
         )
         values ($1, $2, $3, $4, 'manual_adjustment', 1, 'g', now())`,
        ["34343434-3434-4434-8434-343434343434", FixtureIds.accountA, FixtureIds.productB, FixtureIds.lotA]
      )
    ).rejects.toThrow(/inventory_movement\.account_id must match product\.account_id/);
  });
});
