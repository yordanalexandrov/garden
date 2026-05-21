import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository, type AccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { Account } from "../../src/modules/accounts/accounts.types.js";
import { TestAuthAdapter, TestAuthIds } from "../../src/modules/auth/test-auth.adapter.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders, accountBAuthHeaders } from "../helpers/auth.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T/;

const PlaceIds = {
  placeA: "11111111-1111-4111-8111-111111111111",
  otherPlaceA: "22222222-2222-4222-8222-222222222222",
  placeB: "33333333-3333-4333-8333-333333333333"
} as const;

const PlantIds = {
  pearA: "44444444-4444-4444-8444-444444444444",
  cherryA: "55555555-5555-4555-8555-555555555555",
  pearB: "66666666-6666-4666-8666-666666666666"
} as const;

const PerennialIds = {
  activeA: "77777777-7777-4777-8777-777777777777",
  archivedA: "88888888-8888-4888-8888-888888888888",
  activeB: "99999999-9999-4999-8999-999999999999"
} as const;

type PerennialMutationResponse = {
  data: {
    id: string;
  };
};

type PerennialArchiveResponse = {
  data: {
    archived: boolean;
  };
};

type PerennialListResponse = {
  data: {
    items: Array<{
      id: string;
      placeId: string;
      plantId: string;
      plantName: string;
      label: string | null;
      plantedYear: number | null;
      status: string;
      notes: string | null;
    }>;
    page: number;
    pageSize: number;
    total: number;
  };
};

type PerennialDetailResponse = {
  data: PerennialListResponse["data"]["items"][number] & {
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
  };
};

describe("Perennials routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns UNAUTHORIZED for unauthenticated requests", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/places/${PlaceIds.placeA}/perennials`
    });

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
      url: `/api/v1/places/${PlaceIds.placeA}/perennials`,
      headers: accountAAuthHeaders(),
      payload: {
        label: "Pear near fence"
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

  it("returns VALIDATION_ERROR for invalid patch status and plantedYear before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const invalidStatusResponse = await app.inject({
      method: "PATCH",
      url: `/api/v1/perennials/${PerennialIds.activeA}`,
      headers: accountAAuthHeaders(),
      payload: {
        status: "inactive"
      }
    });
    const invalidYearResponse = await app.inject({
      method: "PATCH",
      url: `/api/v1/perennials/${PerennialIds.activeA}`,
      headers: accountAAuthHeaders(),
      payload: {
        plantedYear: 3001
      }
    });

    expect(invalidStatusResponse.statusCode).toBe(400);
    expect(invalidStatusResponse.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input"
      }
    });
    expect(invalidYearResponse.statusCode).toBe(400);
    expect(invalidYearResponse.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input"
      }
    });
  });

  it("does not leak internal route dependency details when db wiring is unavailable", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/places/${PlaceIds.placeA}/perennials`,
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

describeDatabase("Perennials routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;

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

  it("lists account-owned perennials for a place with the canonical pagination envelope", async () => {
    await insertPerennial(pool, {
      id: PerennialIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.pearA,
      label: "Pear near fence",
      plantedYear: 2022,
      notes: "Espalier"
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

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${PlaceIds.placeA}/perennials`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        items: [
          {
            id: PerennialIds.activeA,
            placeId: PlaceIds.placeA,
            plantId: PlantIds.pearA,
            plantName: "Pear (Williams)",
            label: "Pear near fence",
            plantedYear: 2022,
            status: "active",
            notes: "Espalier"
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      }
    });
  });

  it("creates an account-scoped perennial and returns the canonical mutation envelope", async () => {
    const response = await app!.inject({
      method: "POST",
      url: `/api/v1/places/${PlaceIds.placeA}/perennials`,
      headers: accountAAuthHeaders(),
      payload: {
        accountId: AccountFixtureIds.accountB,
        plantId: PlantIds.pearA,
        label: "Pear near fence",
        plantedYear: 2022,
        notes: "Water deeply"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<PerennialMutationResponse>(response);

    expect(body.data.id).toMatch(uuidPattern);
    expect(body).toEqual({
      data: {
        id: body.data.id
      }
    });

    const stored = await pool.query<{ account_id: string; place_id: string; plant_id: string; status: string }>(
      "select account_id, place_id, plant_id, status from perennials where id = $1",
      [body.data.id]
    );
    expect(stored.rows[0]).toEqual({
      account_id: AccountFixtureIds.accountA,
      place_id: PlaceIds.placeA,
      plant_id: PlantIds.pearA,
      status: "active"
    });
  });

  it("rejects cross-account place and plant references during create", async () => {
    const crossAccountPlace = await app!.inject({
      method: "POST",
      url: `/api/v1/places/${PlaceIds.placeB}/perennials`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.pearA,
        label: "Nope"
      }
    });
    const crossAccountPlant = await app!.inject({
      method: "POST",
      url: `/api/v1/places/${PlaceIds.placeA}/perennials`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.pearB,
        label: "Nope"
      }
    });

    expect(crossAccountPlace.statusCode).toBe(404);
    expect(crossAccountPlace.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Place not found",
        details: {}
      }
    });
    expect(crossAccountPlant.statusCode).toBe(404);
    expect(crossAccountPlant.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Plant not found",
        details: {}
      }
    });
  });

  it("returns detail with camelCase fields and does not expose cross-account perennials", async () => {
    await insertPerennial(pool, {
      id: PerennialIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.pearA,
      label: "Pear near fence",
      plantedYear: 2022,
      notes: "Espalier"
    });
    await insertPerennial(pool, {
      id: PerennialIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      plantId: PlantIds.pearB,
      label: "Other account pear"
    });

    const detailResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/perennials/${PerennialIds.activeA}`,
      headers: accountAAuthHeaders()
    });
    const crossAccountResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/perennials/${PerennialIds.activeB}`,
      headers: accountAAuthHeaders()
    });

    expect(detailResponse.statusCode).toBe(200);
    const body = parseJsonResponse<PerennialDetailResponse>(detailResponse);

    expect(body.data.createdAt).toMatch(isoTimestampPattern);
    expect(body.data.updatedAt).toMatch(isoTimestampPattern);
    expect(body).toEqual({
      data: {
        id: PerennialIds.activeA,
        placeId: PlaceIds.placeA,
        plantId: PlantIds.pearA,
        plantName: "Pear (Williams)",
        label: "Pear near fence",
        plantedYear: 2022,
        status: "active",
        notes: "Espalier",
        createdAt: body.data.createdAt,
        updatedAt: body.data.updatedAt,
        archivedAt: null
      }
    });
    expect(crossAccountResponse.statusCode).toBe(404);
    expect(crossAccountResponse.json()).toMatchObject({
      error: {
        code: "NOT_FOUND"
      }
    });
  });

  it("updates only actor-account perennials and returns the canonical mutation envelope", async () => {
    await insertPerennial(pool, {
      id: PerennialIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.pearA,
      label: "Pear near fence",
      notes: "Espalier"
    });
    await insertPerennial(pool, {
      id: PerennialIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      plantId: PlantIds.pearB,
      label: "Other account pear"
    });

    const updateResponse = await app!.inject({
      method: "PATCH",
      url: `/api/v1/perennials/${PerennialIds.activeA}`,
      headers: accountAAuthHeaders(),
      payload: {
        label: "Updated pear",
        status: "removed",
        notes: null
      }
    });
    const crossAccountResponse = await app!.inject({
      method: "PATCH",
      url: `/api/v1/perennials/${PerennialIds.activeB}`,
      headers: accountAAuthHeaders(),
      payload: {
        label: "Leaked pear"
      }
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual({
      data: {
        id: PerennialIds.activeA
      }
    });
    expect(crossAccountResponse.statusCode).toBe(404);

    const stored = await pool.query<{ label: string; status: string; notes: string | null }>(
      "select label, status, notes from perennials where id = $1",
      [PerennialIds.activeA]
    );
    expect(stored.rows[0]).toEqual({
      label: "Updated pear",
      status: "removed",
      notes: null
    });
  });

  it("archives perennials without hard deleting and excludes archived rows from the default list", async () => {
    await insertPerennial(pool, {
      id: PerennialIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.pearA,
      label: "Pear near fence"
    });

    const archiveResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/perennials/${PerennialIds.activeA}/archive`,
      headers: accountAAuthHeaders()
    });
    const listResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${PlaceIds.placeA}/perennials`,
      headers: accountAAuthHeaders()
    });

    expect(archiveResponse.statusCode).toBe(200);
    expect(parseJsonResponse<PerennialArchiveResponse>(archiveResponse)).toEqual({
      data: {
        archived: true
      }
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual({
      data: {
        items: [],
        page: 1,
        pageSize: 20,
        total: 0
      }
    });

    const archived = await pool.query<{ status: string; archived_at: Date | null }>(
      "select status, archived_at from perennials where id = $1",
      [PerennialIds.activeA]
    );
    expect(archived.rowCount).toBe(1);
    expect(archived.rows[0]).toMatchObject({ status: "archived" });
    expect(archived.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("keeps account B authenticated requests scoped to account B", async () => {
    await insertPerennial(pool, {
      id: PerennialIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      plantId: PlantIds.pearA,
      label: "Account A pear"
    });
    await insertPerennial(pool, {
      id: PerennialIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      plantId: PlantIds.pearB,
      label: "Other account pear"
    });

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${PlaceIds.placeB}/perennials`,
      headers: accountBAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        items: [
          {
            id: PerennialIds.activeB,
            label: "Other account pear"
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
  const createdAt = new Date("2026-05-21T08:00:00.000Z");

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
