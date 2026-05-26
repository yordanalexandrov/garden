import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { BackendTargetResolver } from "../../src/modules/targets/target-resolver.service.js";
import { KyselyTargetResolverRepository } from "../../src/modules/targets/target-resolver.repository.js";
import { AppError } from "../../src/shared/errors/app-error.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const Ids = {
  placeA: "11111111-1111-4111-8111-111111111111",
  emptyPlaceA: "12121212-1212-4121-8121-121212121212",
  placeB: "13131313-1313-4131-8131-131313131313",
  plantA: "22222222-2222-4222-8222-222222222222",
  plantB: "23232323-2323-4232-8232-232323232323",
  perennialA: "33333333-3333-4333-8333-333333333333",
  perennialArchivedA: "34343434-3434-4343-8343-343434343434",
  perennialOtherPlaceA: "35353535-3535-4353-8353-353535353535",
  perennialB: "36363636-3636-4363-8363-363636363636",
  bedA: "44444444-4444-4444-8444-444444444444",
  bedArchivedA: "45454545-4545-4454-8454-454545454545",
  bedOtherPlaceA: "46464646-4646-4464-8464-464646464646",
  bedB: "47474747-4747-4474-8474-474747474747",
  yearlyA: "55555555-5555-4555-8555-555555555555",
  yearlyArchivedA: "56565656-5656-4565-8565-565656565656",
  yearlyOtherPlaceA: "57575757-5757-4575-8575-575757575757",
  yearlyB: "58585858-5858-4585-8585-585858585858",
  persistentA: "66666666-6666-4666-8666-666666666666",
  persistentArchivedA: "67676767-6767-4676-8676-676767676767",
  persistentOtherPlaceA: "68686868-6868-4686-8686-686868686868",
  persistentB: "69696969-6969-4696-8696-696969696969"
} as const;

describeDatabase("BackendTargetResolver", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let resolver: BackendTargetResolver;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertTargetResolverFixture(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    resolver = new BackendTargetResolver(new KyselyTargetResolverRepository(dbClient));
  });

  afterEach(async () => {
    await dbClient.destroy();
    await pool.end();
  });

  it("resolves whole place as exactly one place target", async () => {
    await expect(
      resolver.resolveActivityTargets(AccountFixtureIds.accountA, {
        placeId: Ids.placeA,
        targetScopeType: "whole_place"
      })
    ).resolves.toEqual([
      {
        targetType: "place",
        targetId: Ids.placeA,
        summary: {
          targetType: "place",
          targetId: Ids.placeA,
          label: "Place A",
          placeId: Ids.placeA
        }
      }
    ]);
  });

  it("rejects missing or cross-account place context", async () => {
    await expectInvalidTargets({
      placeId: Ids.placeB,
      targetScopeType: "whole_place"
    });
    await expectInvalidTargets({
      placeId: "77777777-7777-4777-8777-777777777777",
      targetScopeType: "whole_place"
    });
  });

  it("resolves active perennials and beds in one requested place only", async () => {
    const perennials = await resolver.resolveActivityTargets(AccountFixtureIds.accountA, {
      placeId: Ids.placeA,
      targetScopeType: "all_perennials_in_place"
    });
    const beds = await resolver.resolveActivityTargets(AccountFixtureIds.accountA, {
      placeId: Ids.placeA,
      targetScopeType: "all_beds_in_place"
    });

    expect(perennials.map((target) => target.targetId)).toEqual([Ids.perennialA]);
    expect(perennials).toEqual([expect.objectContaining({ targetType: "perennial" })]);
    expect(beds.map((target) => target.targetId)).toEqual([Ids.bedA]);
    expect(beds).toEqual([expect.objectContaining({ targetType: "bed" })]);
  });

  it("rejects empty whole-group target results", async () => {
    await expectInvalidTargets({
      placeId: Ids.emptyPlaceA,
      targetScopeType: "all_perennials_in_place"
    });
    await expectInvalidTargets({
      placeId: Ids.emptyPlaceA,
      targetScopeType: "all_beds_in_place"
    });
  });

  it("resolves selected perennials and rejects partial selected perennial success", async () => {
    await expect(
      resolver.resolveActivityTargets(AccountFixtureIds.accountA, {
        placeId: Ids.placeA,
        targetScopeType: "selected_perennials",
        targetSelection: { perennialIds: [Ids.perennialA] }
      })
    ).resolves.toEqual([expect.objectContaining({ targetType: "perennial", targetId: Ids.perennialA })]);

    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_perennials",
      targetSelection: { perennialIds: [Ids.perennialA, Ids.perennialArchivedA] }
    });
    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_perennials",
      targetSelection: { perennialIds: [Ids.perennialOtherPlaceA] }
    });
    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_perennials",
      targetSelection: { perennialIds: [Ids.perennialB] }
    });
  });

  it("resolves selected and single beds while rejecting invalid selected bed sets", async () => {
    await expect(
      resolver.resolveActivityTargets(AccountFixtureIds.accountA, {
        placeId: Ids.placeA,
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedA] }
      })
    ).resolves.toEqual([expect.objectContaining({ targetType: "bed", targetId: Ids.bedA })]);

    await expect(
      resolver.resolveActivityTargets(AccountFixtureIds.accountA, {
        placeId: Ids.placeA,
        targetScopeType: "single_bed",
        targetSelection: { bedIds: [Ids.bedA] }
      })
    ).resolves.toEqual([expect.objectContaining({ targetType: "bed", targetId: Ids.bedA })]);

    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_beds",
      targetSelection: { bedIds: [Ids.bedArchivedA] }
    });
    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_beds",
      targetSelection: { bedIds: [Ids.bedOtherPlaceA] }
    });
    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_beds",
      targetSelection: { bedIds: [Ids.bedB] }
    });
    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "single_bed",
      targetSelection: { bedIds: [Ids.bedA, Ids.bedOtherPlaceA] }
    });
  });

  it("resolves selected yearly plantings through their bed place and rejects invalid sets", async () => {
    await expect(
      resolver.resolveTaskTargets(AccountFixtureIds.accountA, {
        placeId: Ids.placeA,
        targetScopeType: "selected_yearly_plantings",
        targetSelection: { yearlyPlantingIds: [Ids.yearlyA] }
      })
    ).resolves.toEqual([expect.objectContaining({ targetType: "yearly_bed_planting", targetId: Ids.yearlyA })]);

    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_yearly_plantings",
      targetSelection: { yearlyPlantingIds: [Ids.yearlyArchivedA] }
    });
    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_yearly_plantings",
      targetSelection: { yearlyPlantingIds: [Ids.yearlyOtherPlaceA] }
    });
    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_yearly_plantings",
      targetSelection: { yearlyPlantingIds: [Ids.yearlyB] }
    });
  });

  it("resolves selected persistent bed plants through their bed place and rejects invalid sets", async () => {
    await expect(
      resolver.resolveTaskTargets(AccountFixtureIds.accountA, {
        placeId: Ids.placeA,
        targetScopeType: "selected_persistent_bed_plants",
        targetSelection: { persistentBedPlantIds: [Ids.persistentA] }
      })
    ).resolves.toEqual([expect.objectContaining({ targetType: "persistent_bed_plant", targetId: Ids.persistentA })]);

    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_persistent_bed_plants",
      targetSelection: { persistentBedPlantIds: [Ids.persistentArchivedA] }
    });
    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_persistent_bed_plants",
      targetSelection: { persistentBedPlantIds: [Ids.persistentOtherPlaceA] }
    });
    await expectInvalidTargets({
      placeId: Ids.placeA,
      targetScopeType: "selected_persistent_bed_plants",
      targetSelection: { persistentBedPlantIds: [Ids.persistentB] }
    });
  });

  it("runs target resolution inside an existing transaction", async () => {
    const result = await dbClient.transaction((trx) =>
      resolver.resolveActivityTargets(
        AccountFixtureIds.accountA,
        {
          placeId: Ids.placeA,
          targetScopeType: "selected_beds",
          targetSelection: { bedIds: [Ids.bedA] }
        },
        trx
      )
    );

    expect(result).toEqual([expect.objectContaining({ targetType: "bed", targetId: Ids.bedA })]);
  });

  async function expectInvalidTargets(input: Parameters<BackendTargetResolver["resolveTargets"]>[1]): Promise<void> {
    await expect(resolver.resolveActivityTargets(AccountFixtureIds.accountA, input)).rejects.toBeInstanceOf(AppError);
  }
});

async function insertTargetResolverFixture(pool: Pool): Promise<void> {
  await pool.query("insert into places (id, account_id, name) values ($1, $2, 'Place A')", [
    Ids.placeA,
    AccountFixtureIds.accountA
  ]);
  await pool.query("insert into places (id, account_id, name) values ($1, $2, 'Empty Place A')", [
    Ids.emptyPlaceA,
    AccountFixtureIds.accountA
  ]);
  await pool.query("insert into places (id, account_id, name) values ($1, $2, 'Place B')", [
    Ids.placeB,
    AccountFixtureIds.accountB
  ]);
  await pool.query(
    "insert into plants (id, account_id, common_name, lifecycle_type, growing_style) values ($1, $2, 'Tomato', 'annual', 'vegetable')",
    [Ids.plantA, AccountFixtureIds.accountA]
  );
  await pool.query(
    "insert into plants (id, account_id, common_name, lifecycle_type, growing_style) values ($1, $2, 'Pepper', 'annual', 'vegetable')",
    [Ids.plantB, AccountFixtureIds.accountB]
  );

  await insertPerennial(pool, Ids.perennialA, AccountFixtureIds.accountA, Ids.placeA, Ids.plantA, "Pear A");
  await insertPerennial(
    pool,
    Ids.perennialArchivedA,
    AccountFixtureIds.accountA,
    Ids.placeA,
    Ids.plantA,
    "Archived pear",
    "archived",
    new Date("2026-01-01T00:00:00.000Z")
  );
  await insertPerennial(pool, Ids.perennialOtherPlaceA, AccountFixtureIds.accountA, Ids.emptyPlaceA, Ids.plantA, "Other pear");
  await insertPerennial(pool, Ids.perennialB, AccountFixtureIds.accountB, Ids.placeB, Ids.plantB, "Foreign pear");

  await insertBed(pool, Ids.bedA, AccountFixtureIds.accountA, Ids.placeA, "Bed A");
  await insertBed(
    pool,
    Ids.bedArchivedA,
    AccountFixtureIds.accountA,
    Ids.placeA,
    "Archived Bed A",
    "archived",
    new Date("2026-01-01T00:00:00.000Z")
  );
  await insertBed(pool, Ids.bedOtherPlaceA, AccountFixtureIds.accountA, Ids.emptyPlaceA, "Other Place Bed A");
  await insertBed(pool, Ids.bedB, AccountFixtureIds.accountB, Ids.placeB, "Bed B");

  await insertYearly(pool, Ids.yearlyA, AccountFixtureIds.accountA, Ids.bedA, Ids.plantA, "planted");
  await insertYearly(
    pool,
    Ids.yearlyArchivedA,
    AccountFixtureIds.accountA,
    Ids.bedA,
    Ids.plantA,
    "archived",
    new Date("2026-01-01T00:00:00.000Z")
  );
  await insertYearly(pool, Ids.yearlyOtherPlaceA, AccountFixtureIds.accountA, Ids.bedOtherPlaceA, Ids.plantA, "planted");
  await insertYearly(pool, Ids.yearlyB, AccountFixtureIds.accountB, Ids.bedB, Ids.plantB, "planted");

  await insertPersistent(pool, Ids.persistentA, AccountFixtureIds.accountA, Ids.bedA, Ids.plantA, "active");
  await insertPersistent(
    pool,
    Ids.persistentArchivedA,
    AccountFixtureIds.accountA,
    Ids.bedA,
    Ids.plantA,
    "archived",
    new Date("2026-01-01T00:00:00.000Z")
  );
  await insertPersistent(pool, Ids.persistentOtherPlaceA, AccountFixtureIds.accountA, Ids.bedOtherPlaceA, Ids.plantA, "active");
  await insertPersistent(pool, Ids.persistentB, AccountFixtureIds.accountB, Ids.bedB, Ids.plantB, "active");
}

async function insertPerennial(
  pool: Pool,
  id: string,
  accountId: string,
  placeId: string,
  plantId: string,
  label: string,
  status = "active",
  archivedAt: Date | null = null
): Promise<void> {
  await pool.query(
    `insert into perennials (id, account_id, place_id, plant_id, label, status, archived_at)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [id, accountId, placeId, plantId, label, status, archivedAt]
  );
}

async function insertBed(
  pool: Pool,
  id: string,
  accountId: string,
  placeId: string,
  name: string,
  status = "active",
  archivedAt: Date | null = null
): Promise<void> {
  await pool.query(
    `insert into beds (id, account_id, place_id, name, status, archived_at)
     values ($1, $2, $3, $4, $5, $6)`,
    [id, accountId, placeId, name, status, archivedAt]
  );
}

async function insertYearly(
  pool: Pool,
  id: string,
  accountId: string,
  bedId: string,
  plantId: string,
  status: string,
  archivedAt: Date | null = null
): Promise<void> {
  await pool.query(
    `insert into yearly_bed_plantings (id, account_id, bed_id, plant_id, year, status, archived_at)
     values ($1, $2, $3, $4, 2026, $5, $6)`,
    [id, accountId, bedId, plantId, status, archivedAt]
  );
}

async function insertPersistent(
  pool: Pool,
  id: string,
  accountId: string,
  bedId: string,
  plantId: string,
  status: string,
  archivedAt: Date | null = null
): Promise<void> {
  await pool.query(
    `insert into persistent_bed_plants (id, account_id, bed_id, plant_id, status, archived_at)
     values ($1, $2, $3, $4, $5, $6)`,
    [id, accountId, bedId, plantId, status, archivedAt]
  );
}
