import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyPlacesRepository } from "../../src/modules/places/places.repository.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const PlaceIds = {
  activeA: "11111111-1111-1111-1111-111111111111",
  archivedA: "22222222-2222-2222-2222-222222222222",
  activeB: "33333333-3333-3333-3333-333333333333",
  createdA: "44444444-4444-4444-4444-444444444444"
} as const;

describeDatabase("KyselyPlacesRepository", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let repository: KyselyPlacesRepository;

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
    repository = new KyselyPlacesRepository(dbClient);
  });

  afterEach(async () => {
    await dbClient.destroy();
    await pool.end();
  });

  it("lists only active places for the requested account by default", async () => {
    await insertPlace(pool, {
      id: PlaceIds.activeA,
      accountId: AccountFixtureIds.accountA,
      name: "Home Garden"
    });
    await insertPlace(pool, {
      id: PlaceIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      name: "Old Garden",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertPlace(pool, {
      id: PlaceIds.activeB,
      accountId: AccountFixtureIds.accountB,
      name: "Other Account Garden"
    });

    const result = await repository.list(AccountFixtureIds.accountA, defaultFilters());

    expect(result).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        id: PlaceIds.activeA,
        accountId: AccountFixtureIds.accountA,
        name: "Home Garden",
        archivedAt: null
      })
    ]);
  });

  it("includes archived places only when includeArchived is explicit", async () => {
    await insertPlace(pool, {
      id: PlaceIds.activeA,
      accountId: AccountFixtureIds.accountA,
      name: "Home Garden"
    });
    await insertPlace(pool, {
      id: PlaceIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      name: "Old Garden",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertPlace(pool, {
      id: PlaceIds.activeB,
      accountId: AccountFixtureIds.accountB,
      name: "Other Account Garden"
    });

    const result = await repository.list(AccountFixtureIds.accountA, {
      ...defaultFilters(),
      includeArchived: true
    });

    expect(result.total).toBe(2);
    expect(result.items.map((place) => place.id)).toEqual([PlaceIds.activeA, PlaceIds.archivedA]);
  });

  it("supports q search, pagination, and numeric weather field mapping", async () => {
    await insertPlace(pool, {
      id: PlaceIds.activeA,
      accountId: AccountFixtureIds.accountA,
      name: "Home Garden",
      description: "Back orchard",
      weatherEnabled: true,
      weatherLocationLabel: "Ruse, Bulgaria",
      latitude: 43.84,
      longitude: 25.95
    });
    await insertPlace(pool, {
      id: PlaceIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      name: "Vegetable Plot"
    });

    const result = await repository.list(AccountFixtureIds.accountA, {
      ...defaultFilters(),
      q: "orchard",
      pageSize: 1
    });

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: PlaceIds.activeA,
      weatherEnabled: true,
      latitude: 43.84,
      longitude: 25.95
    });
  });

  it("creates, updates, and archives places without hard deleting them", async () => {
    const created = await repository.create({
      accountId: AccountFixtureIds.accountA,
      name: "New Garden",
      description: "New description",
      notes: "Water early",
      weatherEnabled: true,
      weatherLocationLabel: "Ruse, Bulgaria",
      latitude: 43.84,
      longitude: 25.95,
      timezone: "Europe/Sofia"
    });

    expect(created).toMatchObject({
      accountId: AccountFixtureIds.accountA,
      name: "New Garden",
      latitude: 43.84,
      longitude: 25.95
    });

    const updated = await repository.update(AccountFixtureIds.accountA, created.id, {
      name: "Updated Garden",
      notes: null
    });

    expect(updated).toMatchObject({
      id: created.id,
      name: "Updated Garden",
      notes: null
    });

    await expect(repository.archive(AccountFixtureIds.accountA, created.id)).resolves.toBe(true);
    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toBeNull();

    const archivedRow = await pool.query<{ archived_at: Date | null }>("select archived_at from places where id = $1", [
      created.id
    ]);
    expect(archivedRow.rowCount).toBe(1);
    expect(archivedRow.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("does not update or archive cross-account places", async () => {
    await insertPlace(pool, {
      id: PlaceIds.activeB,
      accountId: AccountFixtureIds.accountB,
      name: "Other Account Garden"
    });

    await expect(repository.findById(AccountFixtureIds.accountA, PlaceIds.activeB)).resolves.toBeNull();
    await expect(repository.update(AccountFixtureIds.accountA, PlaceIds.activeB, { name: "Nope" })).resolves.toBeNull();
    await expect(repository.archive(AccountFixtureIds.accountA, PlaceIds.activeB)).resolves.toBe(false);
  });

  it("can operate on an explicit transaction handle", async () => {
    const created = await dbClient.transaction(async (trx) =>
      repository.create(
        {
          accountId: AccountFixtureIds.accountA,
          name: "Transaction Garden",
          weatherEnabled: false
        },
        trx
      )
    );

    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toMatchObject({
      id: created.id,
      name: "Transaction Garden"
    });
  });

  it("counts place details without crossing account boundaries", async () => {
    await insertPlace(pool, {
      id: PlaceIds.activeA,
      accountId: AccountFixtureIds.accountA,
      name: "Home Garden"
    });
    await insertPlace(pool, {
      id: PlaceIds.activeB,
      accountId: AccountFixtureIds.accountB,
      name: "Other Account Garden"
    });
    await insertCountFixtureRows(pool);

    await expect(repository.countDetails(AccountFixtureIds.accountA, PlaceIds.activeA)).resolves.toEqual({
      perennials: 1,
      beds: 1,
      openProblems: 1,
      upcomingTasks: 1
    });
  });
});

function defaultFilters() {
  return {
    includeArchived: false,
    page: 1,
    pageSize: 20
  };
}

async function insertPlace(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    name: string;
    description?: string | null;
    notes?: string | null;
    weatherEnabled?: boolean;
    weatherLocationLabel?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    timezone?: string | null;
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into places (
       id, account_id, name, description, notes, weather_enabled, weather_location_label,
       latitude, longitude, timezone, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      input.id,
      input.accountId,
      input.name,
      input.description ?? null,
      input.notes ?? null,
      input.weatherEnabled ?? false,
      input.weatherLocationLabel ?? null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.timezone ?? null,
      input.archivedAt ?? null
    ]
  );
}

async function insertCountFixtureRows(pool: Pool): Promise<void> {
  await pool.query(
    `insert into plants (id, account_id, common_name, lifecycle_type, growing_style)
     values
       ('55555555-5555-5555-5555-555555555555', $1, 'Pear', 'perennial', 'tree'),
       ('66666666-6666-6666-6666-666666666666', $2, 'Tomato', 'annual', 'vegetable')`,
    [AccountFixtureIds.accountA, AccountFixtureIds.accountB]
  );

  await pool.query(
    `insert into perennials (id, account_id, place_id, plant_id, label, status)
     values
       ('77777777-7777-7777-7777-777777777777', $1, $2, '55555555-5555-5555-5555-555555555555', 'Pear A', 'active'),
       ('88888888-8888-8888-8888-888888888888', $3, $4, '66666666-6666-6666-6666-666666666666', 'Pear B', 'active')`,
    [AccountFixtureIds.accountA, PlaceIds.activeA, AccountFixtureIds.accountB, PlaceIds.activeB]
  );

  await pool.query(
    `insert into beds (id, account_id, place_id, name, status)
     values
       ('99999999-9999-9999-9999-999999999999', $1, $2, 'Bed A', 'active'),
       ('10101010-1010-1010-1010-101010101010', $3, $4, 'Bed B', 'active')`,
    [AccountFixtureIds.accountA, PlaceIds.activeA, AccountFixtureIds.accountB, PlaceIds.activeB]
  );

  await pool.query(
    `insert into problems (
       id, account_id, type, place_id, target_type, target_id, title, description, status, observed_at
     )
     values
       ('12121212-1212-1212-1212-121212121212', $1, 'problem', $2, 'place', $2, 'Open A', 'Open A', 'open', now()),
       ('13131313-1313-1313-1313-131313131313', $3, 'problem', $4, 'place', $4, 'Open B', 'Open B', 'open', now())`,
    [AccountFixtureIds.accountA, PlaceIds.activeA, AccountFixtureIds.accountB, PlaceIds.activeB]
  );

  await pool.query(
    `insert into tasks (id, account_id, place_id, type, due_date, target_scope_type, status)
     values
       ('14141414-1414-1414-1414-141414141414', $1, $2, 'spraying', current_date + 1, 'whole_place', 'suggested'),
       ('15151515-1515-1515-1515-151515151515', $3, $4, 'spraying', current_date + 1, 'whole_place', 'suggested')`,
    [AccountFixtureIds.accountA, PlaceIds.activeA, AccountFixtureIds.accountB, PlaceIds.activeB]
  );
}
