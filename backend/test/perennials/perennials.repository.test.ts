import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyPerennialsRepository } from "../../src/modules/perennials/perennials.repository.js";
import type { ListPerennialsFilters } from "../../src/modules/perennials/perennials.types.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const PlaceIds = {
  placeA: "11111111-1111-1111-1111-111111111111",
  otherPlaceA: "22222222-2222-2222-2222-222222222222",
  placeB: "33333333-3333-3333-3333-333333333333"
} as const;

const PlantIds = {
  pearA: "44444444-4444-4444-4444-444444444444",
  cherryA: "55555555-5555-5555-5555-555555555555",
  pearB: "66666666-6666-6666-6666-666666666666"
} as const;

const PerennialIds = {
  activeA: "77777777-7777-7777-7777-777777777777",
  removedA: "88888888-8888-8888-8888-888888888888",
  deadA: "99999999-9999-9999-9999-999999999999",
  archivedA: "10101010-1010-1010-1010-101010101010",
  otherPlaceA: "12121212-1212-1212-1212-121212121212",
  activeB: "13131313-1313-1313-1313-131313131313"
} as const;

describeDatabase("KyselyPerennialsRepository", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let repository: KyselyPerennialsRepository;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertBasePlacesAndPlants(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    repository = new KyselyPerennialsRepository(dbClient);
  });

  afterEach(async () => {
    await dbClient.destroy();
    await pool.end();
  });

  it("lists only unarchived account-owned perennials for the requested place by default", async () => {
    await insertPerennial(pool, {
      id: PerennialIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.pearA,
      label: "Pear near fence"
    });
    await insertPerennial(pool, {
      id: PerennialIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.cherryA,
      label: "Old cherry",
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertPerennial(pool, {
      id: PerennialIds.otherPlaceA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.otherPlaceA,
      plantId: PlantIds.pearA,
      label: "Pear in other place"
    });
    await insertPerennial(pool, {
      id: PerennialIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      plantId: PlantIds.pearB,
      label: "Other account pear"
    });

    const result = await repository.listByPlace(AccountFixtureIds.accountA, PlaceIds.placeA, defaultFilters());

    expect(result).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        id: PerennialIds.activeA,
        accountId: AccountFixtureIds.accountA,
        placeId: PlaceIds.placeA,
        plantName: "Pear (Williams)",
        archivedAt: null
      })
    ]);
  });

  it("supports q, status filters, pagination, and archived status listing inside the account scope", async () => {
    await insertPerennial(pool, {
      id: PerennialIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.pearA,
      label: "Pear near fence",
      notes: "Espalier"
    });
    await insertPerennial(pool, {
      id: PerennialIds.removedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.cherryA,
      label: "Cherry stump",
      status: "removed",
      notes: "Removed after storm"
    });
    await insertPerennial(pool, {
      id: PerennialIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.cherryA,
      label: "Archived cherry",
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });

    const removed = await repository.listByPlace(AccountFixtureIds.accountA, PlaceIds.placeA, {
      ...defaultFilters(),
      q: "storm",
      status: "removed",
      pageSize: 1
    });
    const archived = await repository.listByPlace(AccountFixtureIds.accountA, PlaceIds.placeA, {
      ...defaultFilters(),
      status: "archived"
    });

    expect(removed).toMatchObject({
      total: 1,
      pageSize: 1
    });
    expect(removed.items).toEqual([expect.objectContaining({ id: PerennialIds.removedA })]);
    expect(archived.items).toEqual([expect.objectContaining({ id: PerennialIds.archivedA, status: "archived" })]);
  });

  it("creates, updates, and archives perennials without hard deleting them", async () => {
    const created = await repository.create({
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.pearA,
      label: "New pear",
      plantedYear: 2022,
      notes: "Water deeply"
    });

    expect(created).toMatchObject({
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.pearA,
      status: "active"
    });

    const updated = await repository.update(AccountFixtureIds.accountA, created.id, {
      label: "Updated pear",
      status: "removed",
      notes: null
    });

    expect(updated).toMatchObject({
      id: created.id,
      label: "Updated pear",
      status: "removed",
      notes: null
    });

    await expect(repository.archive(AccountFixtureIds.accountA, created.id)).resolves.toBe(true);
    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toBeNull();

    const archivedRow = await pool.query<{ status: string; archived_at: Date | null }>(
      "select status, archived_at from perennials where id = $1",
      [created.id]
    );
    expect(archivedRow.rowCount).toBe(1);
    expect(archivedRow.rows[0]).toMatchObject({ status: "archived" });
    expect(archivedRow.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("findManyByIds and listActiveByPlace preserve account and active-row boundaries", async () => {
    await insertPerennial(pool, {
      id: PerennialIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.pearA,
      label: "Active pear"
    });
    await insertPerennial(pool, {
      id: PerennialIds.removedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.cherryA,
      label: "Removed cherry",
      status: "removed"
    });
    await insertPerennial(pool, {
      id: PerennialIds.deadA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.cherryA,
      label: "Dead cherry",
      status: "dead"
    });
    await insertPerennial(pool, {
      id: PerennialIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.cherryA,
      label: "Archived cherry",
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertPerennial(pool, {
      id: PerennialIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      plantId: PlantIds.pearB,
      label: "Other account pear"
    });

    const byIds = await repository.findManyByIds(AccountFixtureIds.accountA, [
      PerennialIds.activeA,
      PerennialIds.removedA,
      PerennialIds.archivedA,
      PerennialIds.activeB
    ]);
    const active = await repository.listActiveByPlace(AccountFixtureIds.accountA, PlaceIds.placeA);

    expect(byIds.map((perennial) => perennial.id).sort()).toEqual([PerennialIds.activeA, PerennialIds.removedA].sort());
    expect(active.map((perennial) => perennial.id)).toEqual([PerennialIds.activeA]);
  });

  it("does not update or archive cross-account perennials", async () => {
    await insertPerennial(pool, {
      id: PerennialIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      plantId: PlantIds.pearB,
      label: "Other account pear"
    });

    await expect(repository.findById(AccountFixtureIds.accountA, PerennialIds.activeB)).resolves.toBeNull();
    await expect(
      repository.update(AccountFixtureIds.accountA, PerennialIds.activeB, { label: "Nope" })
    ).resolves.toBeNull();
    await expect(repository.archive(AccountFixtureIds.accountA, PerennialIds.activeB)).resolves.toBe(false);
  });

  it("can operate on an explicit transaction handle", async () => {
    const created = await dbClient.transaction(async (trx) =>
      repository.create(
        {
          accountId: AccountFixtureIds.accountA,
          placeId: PlaceIds.placeA,
          plantId: PlantIds.pearA,
          label: "Transaction pear"
        },
        trx
      )
    );

    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toMatchObject({
      id: created.id,
      label: "Transaction pear"
    });
  });
});

function defaultFilters(): ListPerennialsFilters {
  return {
    page: 1,
    pageSize: 20
  };
}

async function insertBasePlacesAndPlants(pool: Pool): Promise<void> {
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
    id: PlantIds.pearA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Pear",
    variety: "Williams"
  });
  await insertPlant(pool, {
    id: PlantIds.cherryA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Cherry"
  });
  await insertPlant(pool, {
    id: PlantIds.pearB,
    accountId: AccountFixtureIds.accountB,
    commonName: "Pear"
  });
}

async function insertPlace(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    name: string;
  }
): Promise<void> {
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
  }
): Promise<void> {
  await pool.query(
    `insert into plants (id, account_id, common_name, variety, lifecycle_type, growing_style)
     values ($1, $2, $3, $4, 'perennial', 'tree')`,
    [input.id, input.accountId, input.commonName, input.variety ?? null]
  );
}

async function insertPerennial(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    placeId: string;
    plantId: string;
    label: string;
    plantedYear?: number | null;
    notes?: string | null;
    status?: "active" | "removed" | "dead" | "archived";
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into perennials (
       id, account_id, place_id, plant_id, label, planted_year, notes, status, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.id,
      input.accountId,
      input.placeId,
      input.plantId,
      input.label,
      input.plantedYear ?? null,
      input.notes ?? null,
      input.status ?? "active",
      input.archivedAt ?? null
    ]
  );
}
