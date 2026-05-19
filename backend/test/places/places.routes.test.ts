import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { AccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { Account } from "../../src/modules/accounts/accounts.types.js";
import { TestAuthAdapter, TestAuthIds } from "../../src/modules/auth/test-auth.adapter.js";
import { loadConfig } from "../../src/config/config.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders, accountBAuthHeaders } from "../helpers/auth.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T/;

const PlaceIds = {
  activeA: "11111111-1111-1111-1111-111111111111",
  archivedA: "22222222-2222-2222-2222-222222222222",
  activeB: "33333333-3333-3333-3333-333333333333"
} as const;

type PlaceMutationResponse = {
  data: {
    id: string;
    name: string;
  };
};

type PlaceListResponse = {
  data: {
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      weatherEnabled: boolean;
      weatherLocationLabel: string | null;
      timezone: string | null;
      createdAt: string;
      archivedAt: string | null;
    }>;
    page: number;
    pageSize: number;
    total: number;
  };
};

type PlaceDetailResponse = {
  data: {
    id: string;
    name: string;
    description: string | null;
    notes: string | null;
    weatherEnabled: boolean;
    weatherLocationLabel: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    counts: {
      perennials: number;
      beds: number;
      openProblems: number;
      upcomingTasks: number;
    };
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
  };
};

describe("Places routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns UNAUTHORIZED for unauthenticated requests", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({ method: "GET", url: "/api/v1/places" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        details: {}
      }
    });
  });

  it("returns VALIDATION_ERROR for invalid create payloads before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/places",
      headers: accountAAuthHeaders(),
      payload: {
        weatherEnabled: false
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input"
      }
    });
  });

  it("validates weather-enabled place location metadata at the route boundary", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/places",
      headers: accountAAuthHeaders(),
      payload: {
        name: "Weather Garden",
        weatherEnabled: true,
        latitude: 43.84
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        details: {
          "body.weatherLocationLabel": ["weatherEnabled requires weatherLocationLabel or both latitude and longitude"]
        }
      }
    });
  });

  it("does not leak internal route dependency details when db wiring is unavailable", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/places",
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error",
        details: {}
      }
    });
  });
});

describeDatabase("Places routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;

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
    app = await createTestApp({
      db: dbClient,
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new KyselyAccountsRepository(dbClient)
      }
    });
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    await pool.end();
  });

  it("creates a place for the authenticated actor account and ignores client-supplied accountId", async () => {
    const response = await app!.inject({
      method: "POST",
      url: "/api/v1/places",
      headers: accountAAuthHeaders(),
      payload: {
        accountId: AccountFixtureIds.accountB,
        name: "Home Garden",
        description: "Back garden and orchard",
        notes: "Water early",
        weatherEnabled: true,
        weatherLocationLabel: "Ruse, Bulgaria",
        latitude: 43.84,
        longitude: 25.95,
        timezone: "Europe/Sofia"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<PlaceMutationResponse>(response);

    expect(body.data.id).toMatch(uuidPattern);
    expect(body).toEqual({
      data: {
        id: body.data.id,
        name: "Home Garden"
      }
    });

    const stored = await pool.query<{ account_id: string }>("select account_id from places where name = $1", [
      "Home Garden"
    ]);
    expect(stored.rows[0]?.account_id).toBe(AccountFixtureIds.accountA);
  });

  it("lists only active places for the actor account by default and preserves pagination shape", async () => {
    await insertPlace(pool, {
      id: PlaceIds.activeA,
      accountId: AccountFixtureIds.accountA,
      name: "Home Garden",
      description: "Back garden"
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

    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/places",
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<PlaceListResponse>(response);
    const item = body.data.items[0];

    expect(item?.createdAt).toMatch(isoTimestampPattern);
    expect(body).toEqual({
      data: {
        items: [
          {
            id: PlaceIds.activeA,
            name: "Home Garden",
            description: "Back garden",
            weatherEnabled: false,
            weatherLocationLabel: null,
            timezone: null,
            createdAt: item?.createdAt,
            archivedAt: null
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      }
    });
  });

  it("includes archived actor-account places only when includeArchived is true", async () => {
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

    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/places?includeArchived=true",
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        items: [
          {
            id: PlaceIds.activeA
          },
          {
            id: PlaceIds.archivedA
          }
        ],
        total: 2
      }
    });
  });

  it("returns place detail with camelCase fields and account-scoped counts", async () => {
    await insertPlace(pool, {
      id: PlaceIds.activeA,
      accountId: AccountFixtureIds.accountA,
      name: "Home Garden",
      description: "Back garden",
      notes: "Water early",
      weatherEnabled: true,
      weatherLocationLabel: "Ruse, Bulgaria",
      latitude: 43.84,
      longitude: 25.95,
      timezone: "Europe/Sofia"
    });
    await insertPlace(pool, {
      id: PlaceIds.activeB,
      accountId: AccountFixtureIds.accountB,
      name: "Other Account Garden"
    });
    await insertCountFixtureRows(pool);

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${PlaceIds.activeA}`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<PlaceDetailResponse>(response);

    expect(body.data.createdAt).toMatch(isoTimestampPattern);
    expect(body.data.updatedAt).toMatch(isoTimestampPattern);
    expect(body).toMatchObject({
      data: {
        id: PlaceIds.activeA,
        name: "Home Garden",
        description: "Back garden",
        notes: "Water early",
        weatherEnabled: true,
        weatherLocationLabel: "Ruse, Bulgaria",
        latitude: 43.84,
        longitude: 25.95,
        timezone: "Europe/Sofia",
        counts: {
          perennials: 1,
          beds: 1,
          openProblems: 1,
          upcomingTasks: 1
        },
        createdAt: body.data.createdAt,
        updatedAt: body.data.updatedAt,
        archivedAt: null
      }
    });
  });

  it("does not expose cross-account places through detail routes", async () => {
    await insertPlace(pool, {
      id: PlaceIds.activeB,
      accountId: AccountFixtureIds.accountB,
      name: "Other Account Garden"
    });

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${PlaceIds.activeB}`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: {
        code: "NOT_FOUND"
      }
    });
  });

  it("updates only actor-account places and returns the canonical mutation envelope", async () => {
    await insertPlace(pool, {
      id: PlaceIds.activeA,
      accountId: AccountFixtureIds.accountA,
      name: "Home Garden"
    });

    const response = await app!.inject({
      method: "PATCH",
      url: `/api/v1/places/${PlaceIds.activeA}`,
      headers: accountAAuthHeaders(),
      payload: {
        name: "Updated Garden",
        notes: null
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        id: PlaceIds.activeA,
        name: "Updated Garden"
      }
    });
  });

  it("archives actor-account places and returns the canonical archive envelope", async () => {
    await insertPlace(pool, {
      id: PlaceIds.activeA,
      accountId: AccountFixtureIds.accountA,
      name: "Home Garden"
    });

    const response = await app!.inject({
      method: "POST",
      url: `/api/v1/places/${PlaceIds.activeA}/archive`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        archived: true
      }
    });

    const archived = await pool.query<{ archived_at: Date | null }>("select archived_at from places where id = $1", [
      PlaceIds.activeA
    ]);
    expect(archived.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("returns CONFLICT for duplicate active place names", async () => {
    await insertPlace(pool, {
      id: PlaceIds.activeA,
      accountId: AccountFixtureIds.accountA,
      name: "Home Garden"
    });

    const response = await app!.inject({
      method: "POST",
      url: "/api/v1/places",
      headers: accountAAuthHeaders(),
      payload: {
        name: "home garden",
        weatherEnabled: false
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: {
        code: "CONFLICT",
        message: "An active place with this name already exists",
        details: {
          name: ["Duplicate active place name"]
        }
      }
    });
  });

  it("keeps account B authenticated requests scoped to account B", async () => {
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

    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/places",
      headers: accountBAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        items: [
          {
            id: PlaceIds.activeB,
            name: "Other Account Garden"
          }
        ],
        total: 1
      }
    });
  });
});

async function createAuthenticatedTestApp(): Promise<FastifyInstance> {
  return createTestApp({
    auth: {
      authPort: new TestAuthAdapter(),
      accountsRepository: new InMemoryAccountsRepository([
        createAccount(TestAuthIds.accountA, "account-a@example.com", "Account A"),
        createAccount(TestAuthIds.accountB, "account-b@example.com", "Account B")
      ])
    }
  });
}

class InMemoryAccountsRepository implements AccountsRepository {
  readonly #accountsById: Map<string, Account>;

  constructor(accounts: readonly Account[]) {
    this.#accountsById = new Map(accounts.map((account) => [account.id, account]));
  }

  findById(accountId: string): Promise<Account | null> {
    const account = this.#accountsById.get(accountId);

    if (account === undefined || account.archivedAt !== null) {
      return Promise.resolve(null);
    }

    return Promise.resolve(account);
  }
}

function createAccount(id: string, email: string, displayName: string): Account {
  const createdAt = new Date("2026-05-18T00:00:00.000Z");

  return {
    id,
    email,
    displayName,
    createdAt,
    updatedAt: createdAt,
    archivedAt: null
  };
}

function parseJsonResponse<T>(response: { body: string }): T {
  const parsed: unknown = JSON.parse(response.body);

  return parsed as T;
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
       ('13131313-1313-1313-1313-131313131313', $1, 'observation', $2, 'place', $2, 'Observation A', 'Observation A', 'open', now()),
       ('16161616-1616-1616-1616-161616161616', $3, 'problem', $4, 'place', $4, 'Open B', 'Open B', 'open', now())`,
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
