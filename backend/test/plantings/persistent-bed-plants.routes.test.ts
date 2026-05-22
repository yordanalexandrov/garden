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

const PlaceIds = {
  placeA: "11111111-1111-4111-8111-111111111111",
  placeB: "22222222-2222-4222-8222-222222222222"
} as const;

const PlantIds = {
  strawberryA: "33333333-3333-4333-8333-333333333333",
  pepperA: "44444444-4444-4444-8444-444444444444",
  strawberryB: "55555555-5555-4555-8555-555555555555"
} as const;

const BedIds = {
  activeA: "66666666-6666-4666-8666-666666666666",
  activeB: "77777777-7777-4777-8777-777777777777"
} as const;

const PersistentPlantIds = {
  strawberryA: "88888888-8888-4888-8888-888888888888",
  archivedA: "99999999-9999-4999-8999-999999999999",
  strawberryB: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
} as const;

type PersistentBedPlantMutationResponse = {
  data: {
    id: string;
  };
};

type PersistentBedPlantArchiveResponse = {
  data: {
    archived: boolean;
  };
};

type PersistentBedPlantListResponse = {
  data: {
    items: Array<{
      id: string;
      bedId: string;
      plantId: string;
      plantName: string;
      plantedYear: number | null;
      quantity: number | null;
      notes: string | null;
      status: string;
    }>;
    page: number;
    pageSize: number;
    total: number;
  };
};

describe("Persistent bed plants routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns UNAUTHORIZED for unauthenticated persistent bed plant requests", async () => {
    app = await createAuthenticatedTestApp();

    const responses = await Promise.all([
      app.inject({
        method: "GET",
        url: `/api/v1/beds/${BedIds.activeA}/persistent-plants`
      }),
      app.inject({
        method: "POST",
        url: `/api/v1/beds/${BedIds.activeA}/persistent-plants`,
        payload: {
          plantId: PlantIds.strawberryA
        }
      }),
      app.inject({
        method: "PATCH",
        url: `/api/v1/persistent-bed-plants/${PersistentPlantIds.strawberryA}`,
        payload: {
          notes: "No auth"
        }
      }),
      app.inject({
        method: "POST",
        url: `/api/v1/persistent-bed-plants/${PersistentPlantIds.strawberryA}/archive`
      })
    ]);

    for (const response of responses) {
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized",
          details: {}
        }
      });
    }
  });

  it("returns VALIDATION_ERROR for invalid create payloads before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/beds/${BedIds.activeA}/persistent-plants`,
      headers: accountAAuthHeaders(),
      payload: {
        quantity: -1
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

  it("returns VALIDATION_ERROR for invalid patch status, quantity, and plantedYear before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const invalidStatusResponse = await app.inject({
      method: "PATCH",
      url: `/api/v1/persistent-bed-plants/${PersistentPlantIds.strawberryA}`,
      headers: accountAAuthHeaders(),
      payload: {
        status: "inactive"
      }
    });
    const invalidQuantityResponse = await app.inject({
      method: "PATCH",
      url: `/api/v1/persistent-bed-plants/${PersistentPlantIds.strawberryA}`,
      headers: accountAAuthHeaders(),
      payload: {
        quantity: -1
      }
    });
    const invalidYearResponse = await app.inject({
      method: "PATCH",
      url: `/api/v1/persistent-bed-plants/${PersistentPlantIds.strawberryA}`,
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
    expect(invalidQuantityResponse.statusCode).toBe(400);
    expect(invalidQuantityResponse.json()).toMatchObject({
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
      url: `/api/v1/beds/${BedIds.activeA}/persistent-plants`,
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

describeDatabase("Persistent bed plants routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertBasePlacesPlantsAndBeds(pool);
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
    await dbClient.destroy();
    await pool.end();
  });

  it("lists account-owned persistent plants for a bed with the canonical pagination envelope", async () => {
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.strawberryA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.strawberryA,
      plantedYear: 2021,
      quantity: 10,
      notes: "North row"
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.pepperA,
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.strawberryB,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.activeB,
      plantId: PlantIds.strawberryB,
      quantity: 20
    });

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/beds/${BedIds.activeA}/persistent-plants`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(parseJsonResponse<PersistentBedPlantListResponse>(response)).toEqual({
      data: {
        items: [
          {
            id: PersistentPlantIds.strawberryA,
            bedId: BedIds.activeA,
            plantId: PlantIds.strawberryA,
            plantName: "Strawberry",
            plantedYear: 2021,
            quantity: 10,
            notes: "North row",
            status: "active"
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      }
    });
  });

  it("creates an account-scoped persistent bed plant and returns the canonical mutation envelope", async () => {
    const response = await app!.inject({
      method: "POST",
      url: `/api/v1/beds/${BedIds.activeA}/persistent-plants`,
      headers: accountAAuthHeaders(),
      payload: {
        accountId: AccountFixtureIds.accountB,
        plantId: PlantIds.strawberryA,
        plantedYear: 2022,
        quantity: 12,
        notes: "Runner row"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<PersistentBedPlantMutationResponse>(response);

    expect(body.data.id).toMatch(uuidPattern);
    expect(body).toEqual({
      data: {
        id: body.data.id
      }
    });

    const stored = await pool.query<{
      account_id: string;
      bed_id: string;
      plant_id: string;
      planted_year: number;
      quantity: number;
      status: string;
    }>(
      `select account_id, bed_id, plant_id, planted_year, quantity::float8, status
       from persistent_bed_plants
       where id = $1`,
      [body.data.id]
    );
    expect(stored.rows[0]).toEqual({
      account_id: AccountFixtureIds.accountA,
      bed_id: BedIds.activeA,
      plant_id: PlantIds.strawberryA,
      planted_year: 2022,
      quantity: 12,
      status: "active"
    });
  });

  it("rejects cross-account bed and plant references during create", async () => {
    const crossAccountBed = await app!.inject({
      method: "POST",
      url: `/api/v1/beds/${BedIds.activeB}/persistent-plants`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.strawberryA
      }
    });
    const crossAccountPlant = await app!.inject({
      method: "POST",
      url: `/api/v1/beds/${BedIds.activeA}/persistent-plants`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.strawberryB
      }
    });

    expect(crossAccountBed.statusCode).toBe(404);
    expect(crossAccountBed.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Bed not found",
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

  it("updates only actor-account persistent bed plants and returns the canonical mutation envelope", async () => {
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.strawberryA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.strawberryA,
      plantedYear: 2021,
      quantity: 10,
      notes: "North row"
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.strawberryB,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.activeB,
      plantId: PlantIds.strawberryB,
      quantity: 20
    });

    const updateResponse = await app!.inject({
      method: "PATCH",
      url: `/api/v1/persistent-bed-plants/${PersistentPlantIds.strawberryA}`,
      headers: accountAAuthHeaders(),
      payload: {
        plantedYear: 2023,
        quantity: 14,
        status: "removed",
        notes: null
      }
    });
    const crossAccountResponse = await app!.inject({
      method: "PATCH",
      url: `/api/v1/persistent-bed-plants/${PersistentPlantIds.strawberryB}`,
      headers: accountAAuthHeaders(),
      payload: {
        notes: "Leaked plant"
      }
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual({
      data: {
        id: PersistentPlantIds.strawberryA
      }
    });
    expect(crossAccountResponse.statusCode).toBe(404);

    const stored = await pool.query<{
      planted_year: number;
      quantity: number;
      status: string;
      notes: string | null;
    }>(
      `select planted_year, quantity::float8, status, notes
       from persistent_bed_plants
       where id = $1`,
      [PersistentPlantIds.strawberryA]
    );
    expect(stored.rows[0]).toEqual({
      planted_year: 2023,
      quantity: 14,
      status: "removed",
      notes: null
    });
  });

  it("archives persistent bed plants without hard deleting and excludes archived rows from the default list", async () => {
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.strawberryA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.strawberryA,
      quantity: 10
    });

    const archiveResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/persistent-bed-plants/${PersistentPlantIds.strawberryA}/archive`,
      headers: accountAAuthHeaders()
    });
    const listResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/beds/${BedIds.activeA}/persistent-plants`,
      headers: accountAAuthHeaders()
    });

    expect(archiveResponse.statusCode).toBe(200);
    expect(parseJsonResponse<PersistentBedPlantArchiveResponse>(archiveResponse)).toEqual({
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
      "select status, archived_at from persistent_bed_plants where id = $1",
      [PersistentPlantIds.strawberryA]
    );
    expect(archived.rowCount).toBe(1);
    expect(archived.rows[0]).toMatchObject({ status: "archived" });
    expect(archived.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("keeps account B authenticated requests scoped to account B", async () => {
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.strawberryA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.strawberryA,
      quantity: 10
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.strawberryB,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.activeB,
      plantId: PlantIds.strawberryB,
      quantity: 20
    });

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/beds/${BedIds.activeB}/persistent-plants`,
      headers: accountBAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        items: [
          {
            id: PersistentPlantIds.strawberryB,
            plantName: "Strawberry",
            quantity: 20
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
  const createdAt = new Date("2026-05-22T08:00:00.000Z");

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

async function insertBasePlacesPlantsAndBeds(pool: Pool): Promise<void> {
  await insertPlace(pool, {
    id: PlaceIds.placeA,
    accountId: AccountFixtureIds.accountA,
    name: "Home Garden"
  });
  await insertPlace(pool, {
    id: PlaceIds.placeB,
    accountId: AccountFixtureIds.accountB,
    name: "Other Account Garden"
  });
  await insertPlant(pool, {
    id: PlantIds.strawberryA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Strawberry",
    lifecycleType: "perennial",
    growingStyle: "berry"
  });
  await insertPlant(pool, {
    id: PlantIds.pepperA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Pepper",
    lifecycleType: "annual",
    growingStyle: "vegetable"
  });
  await insertPlant(pool, {
    id: PlantIds.strawberryB,
    accountId: AccountFixtureIds.accountB,
    commonName: "Strawberry",
    lifecycleType: "perennial",
    growingStyle: "berry"
  });
  await insertBed(pool, {
    id: BedIds.activeA,
    accountId: AccountFixtureIds.accountA,
    placeId: PlaceIds.placeA,
    name: "Bed A"
  });
  await insertBed(pool, {
    id: BedIds.activeB,
    accountId: AccountFixtureIds.accountB,
    placeId: PlaceIds.placeB,
    name: "Other account bed"
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
    lifecycleType: "annual" | "biennial" | "perennial";
    growingStyle: "tree" | "shrub" | "vine" | "herb" | "vegetable" | "berry" | "flower" | "other";
  }
): Promise<void> {
  await pool.query(
    `insert into plants (id, account_id, common_name, variety, lifecycle_type, growing_style)
     values ($1, $2, $3, $4, $5, $6)`,
    [input.id, input.accountId, input.commonName, input.variety ?? null, input.lifecycleType, input.growingStyle]
  );
}

async function insertBed(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    placeId: string;
    name: string;
  }
): Promise<void> {
  await pool.query("insert into beds (id, account_id, place_id, name, status) values ($1, $2, $3, $4, 'active')", [
    input.id,
    input.accountId,
    input.placeId,
    input.name
  ]);
}

async function insertPersistentBedPlant(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    bedId: string;
    plantId: string;
    plantedYear?: number | null;
    quantity?: number | null;
    notes?: string | null;
    status?: "active" | "removed" | "archived";
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into persistent_bed_plants (
       id, account_id, bed_id, plant_id, planted_year, quantity, notes, status, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.id,
      input.accountId,
      input.bedId,
      input.plantId,
      input.plantedYear ?? null,
      input.quantity ?? null,
      input.notes ?? null,
      input.status ?? "active",
      input.archivedAt ?? null
    ]
  );
}
