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
  tomatoA: "33333333-3333-4333-8333-333333333333",
  pepperA: "44444444-4444-4444-8444-444444444444",
  tomatoB: "55555555-5555-4555-8555-555555555555"
} as const;

const BedIds = {
  activeA: "66666666-6666-4666-8666-666666666666",
  activeB: "77777777-7777-4777-8777-777777777777"
} as const;

const YearlyPlantingIds = {
  tomato2026A: "88888888-8888-4888-8888-888888888888",
  pepper2027A: "99999999-9999-4999-8999-999999999999",
  tomatoB: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
} as const;

type YearlyBedPlantingMutationResponse = {
  data: {
    id: string;
  };
};

type YearlyBedPlantingArchiveResponse = {
  data: {
    archived: boolean;
  };
};

type YearlyBedPlantingListResponse = {
  data: {
    items: Array<{
      id: string;
      bedId: string;
      plantId: string;
      plantName: string;
      year: number;
      quantity: number | null;
      notes: string | null;
      status: string;
    }>;
    page: number;
    pageSize: number;
    total: number;
  };
};

describe("Yearly bed plantings routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns UNAUTHORIZED for unauthenticated yearly planting requests", async () => {
    app = await createAuthenticatedTestApp();

    const responses = await Promise.all([
      app.inject({
        method: "GET",
        url: `/api/v1/beds/${BedIds.activeA}/plantings?year=2026`
      }),
      app.inject({
        method: "POST",
        url: `/api/v1/beds/${BedIds.activeA}/plantings`,
        payload: {
          plantId: PlantIds.tomatoA,
          year: 2026,
          status: "planted"
        }
      }),
      app.inject({
        method: "PATCH",
        url: `/api/v1/plantings/${YearlyPlantingIds.tomato2026A}`,
        payload: {
          notes: "No auth"
        }
      }),
      app.inject({
        method: "POST",
        url: `/api/v1/plantings/${YearlyPlantingIds.tomato2026A}/archive`
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

  it("returns VALIDATION_ERROR for invalid list/create payloads before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const invalidYearResponse = await app.inject({
      method: "GET",
      url: `/api/v1/beds/${BedIds.activeA}/plantings?year=3001`,
      headers: accountAAuthHeaders()
    });
    const invalidCreateResponse = await app.inject({
      method: "POST",
      url: `/api/v1/beds/${BedIds.activeA}/plantings`,
      headers: accountAAuthHeaders(),
      payload: {
        quantity: -1,
        status: "planted"
      }
    });

    expect(invalidYearResponse.statusCode).toBe(400);
    expect(invalidYearResponse.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input"
      }
    });
    expect(invalidCreateResponse.statusCode).toBe(400);
    expect(invalidCreateResponse.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input"
      }
    });
  });

  it("returns VALIDATION_ERROR for invalid patch status, quantity, and year before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const invalidStatusResponse = await app.inject({
      method: "PATCH",
      url: `/api/v1/plantings/${YearlyPlantingIds.tomato2026A}`,
      headers: accountAAuthHeaders(),
      payload: {
        status: "growing"
      }
    });
    const invalidQuantityResponse = await app.inject({
      method: "PATCH",
      url: `/api/v1/plantings/${YearlyPlantingIds.tomato2026A}`,
      headers: accountAAuthHeaders(),
      payload: {
        quantity: -1
      }
    });
    const invalidYearResponse = await app.inject({
      method: "PATCH",
      url: `/api/v1/plantings/${YearlyPlantingIds.tomato2026A}`,
      headers: accountAAuthHeaders(),
      payload: {
        year: 3001
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
      url: `/api/v1/beds/${BedIds.activeA}/plantings?year=2026`,
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

describeDatabase("Yearly bed plantings routes with database", () => {
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

  it("lists account-owned yearly plantings for the requested calendar year with the canonical pagination envelope", async () => {
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.tomatoA,
      year: 2026,
      quantity: 12,
      notes: "North row"
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.pepper2027A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.pepperA,
      year: 2027,
      quantity: 8
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.activeB,
      plantId: PlantIds.tomatoB,
      year: 2026,
      quantity: 20
    });

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/beds/${BedIds.activeA}/plantings?year=2026`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(parseJsonResponse<YearlyBedPlantingListResponse>(response)).toEqual({
      data: {
        items: [
          {
            id: YearlyPlantingIds.tomato2026A,
            bedId: BedIds.activeA,
            plantId: PlantIds.tomatoA,
            plantName: "Tomato (Roma)",
            year: 2026,
            quantity: 12,
            notes: "North row",
            status: "planted"
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      }
    });
  });

  it("defaults list requests without a year to the current calendar year", async () => {
    const currentYear = new Date().getFullYear();
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.tomatoA,
      year: currentYear,
      quantity: 12
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.pepper2027A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.pepperA,
      year: currentYear + 1,
      quantity: 8
    });

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/beds/${BedIds.activeA}/plantings`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(parseJsonResponse<YearlyBedPlantingListResponse>(response)).toMatchObject({
      data: {
        items: [
          {
            id: YearlyPlantingIds.tomato2026A,
            year: currentYear
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      }
    });
  });

  it("creates account-scoped yearly plantings and allows duplicate bed plant year rows", async () => {
    const firstResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/beds/${BedIds.activeA}/plantings`,
      headers: accountAAuthHeaders(),
      payload: {
        accountId: AccountFixtureIds.accountB,
        plantId: PlantIds.tomatoA,
        year: 2026,
        quantity: 12,
        notes: "North row",
        status: "planted"
      }
    });
    const duplicateResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/beds/${BedIds.activeA}/plantings`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.tomatoA,
        year: 2026,
        quantity: 8,
        notes: "South row",
        status: "planned"
      }
    });

    expect(firstResponse.statusCode).toBe(200);
    expect(duplicateResponse.statusCode).toBe(200);
    const firstBody = parseJsonResponse<YearlyBedPlantingMutationResponse>(firstResponse);
    const duplicateBody = parseJsonResponse<YearlyBedPlantingMutationResponse>(duplicateResponse);

    expect(firstBody.data.id).toMatch(uuidPattern);
    expect(duplicateBody.data.id).toMatch(uuidPattern);
    expect(firstBody.data.id).not.toBe(duplicateBody.data.id);

    const stored = await pool.query<{
      account_id: string;
      bed_id: string;
      plant_id: string;
      row_count: string;
    }>(
      `select account_id, bed_id, plant_id, count(*)::text as row_count
       from yearly_bed_plantings
       where bed_id = $1 and plant_id = $2 and year = 2026
       group by account_id, bed_id, plant_id`,
      [BedIds.activeA, PlantIds.tomatoA]
    );
    expect(stored.rows[0]).toEqual({
      account_id: AccountFixtureIds.accountA,
      bed_id: BedIds.activeA,
      plant_id: PlantIds.tomatoA,
      row_count: "2"
    });
  });

  it("rejects cross-account bed and plant references during create", async () => {
    const crossAccountBed = await app!.inject({
      method: "POST",
      url: `/api/v1/beds/${BedIds.activeB}/plantings`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.tomatoA,
        year: 2026,
        status: "planted"
      }
    });
    const crossAccountPlant = await app!.inject({
      method: "POST",
      url: `/api/v1/beds/${BedIds.activeA}/plantings`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.tomatoB,
        year: 2026,
        status: "planted"
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

  it("updates only actor-account yearly plantings and returns the canonical mutation envelope", async () => {
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.tomatoA,
      year: 2026,
      quantity: 12,
      notes: "North row"
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.activeB,
      plantId: PlantIds.tomatoB,
      year: 2026,
      quantity: 20
    });

    const updateResponse = await app!.inject({
      method: "PATCH",
      url: `/api/v1/plantings/${YearlyPlantingIds.tomato2026A}`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.pepperA,
        year: 2027,
        quantity: null,
        status: "harvested",
        notes: null
      }
    });
    const crossAccountResponse = await app!.inject({
      method: "PATCH",
      url: `/api/v1/plantings/${YearlyPlantingIds.tomatoB}`,
      headers: accountAAuthHeaders(),
      payload: {
        notes: "Leaked planting"
      }
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual({
      data: {
        id: YearlyPlantingIds.tomato2026A
      }
    });
    expect(crossAccountResponse.statusCode).toBe(404);

    const stored = await pool.query<{
      plant_id: string;
      year: number;
      quantity: number | null;
      status: string;
      notes: string | null;
    }>(
      `select plant_id, year, quantity::float8, status, notes
       from yearly_bed_plantings
       where id = $1`,
      [YearlyPlantingIds.tomato2026A]
    );
    expect(stored.rows[0]).toEqual({
      plant_id: PlantIds.pepperA,
      year: 2027,
      quantity: null,
      status: "harvested",
      notes: null
    });
  });

  it("archives yearly plantings without hard deleting and excludes archived rows from the default list", async () => {
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.tomatoA,
      year: 2026,
      quantity: 12
    });

    const archiveResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/plantings/${YearlyPlantingIds.tomato2026A}/archive`,
      headers: accountAAuthHeaders()
    });
    const listResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/beds/${BedIds.activeA}/plantings?year=2026`,
      headers: accountAAuthHeaders()
    });

    expect(archiveResponse.statusCode).toBe(200);
    expect(parseJsonResponse<YearlyBedPlantingArchiveResponse>(archiveResponse)).toEqual({
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
      "select status, archived_at from yearly_bed_plantings where id = $1",
      [YearlyPlantingIds.tomato2026A]
    );
    expect(archived.rowCount).toBe(1);
    expect(archived.rows[0]).toMatchObject({ status: "archived" });
    expect(archived.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("keeps account B authenticated requests scoped to account B", async () => {
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.tomatoA,
      year: 2026,
      quantity: 12
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.activeB,
      plantId: PlantIds.tomatoB,
      year: 2026,
      quantity: 20
    });

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/beds/${BedIds.activeB}/plantings?year=2026`,
      headers: accountBAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        items: [
          {
            id: YearlyPlantingIds.tomatoB,
            plantName: "Tomato",
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
    id: PlantIds.tomatoA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Tomato",
    variety: "Roma"
  });
  await insertPlant(pool, {
    id: PlantIds.pepperA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Pepper"
  });
  await insertPlant(pool, {
    id: PlantIds.tomatoB,
    accountId: AccountFixtureIds.accountB,
    commonName: "Tomato"
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
  }
): Promise<void> {
  await pool.query(
    `insert into plants (id, account_id, common_name, variety, lifecycle_type, growing_style)
     values ($1, $2, $3, $4, 'annual', 'vegetable')`,
    [input.id, input.accountId, input.commonName, input.variety ?? null]
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

async function insertYearlyBedPlanting(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    bedId: string;
    plantId: string;
    year: number;
    quantity?: number | null;
    notes?: string | null;
    status?: "planned" | "planted" | "removed" | "harvested" | "archived";
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into yearly_bed_plantings (
       id, account_id, bed_id, plant_id, year, quantity, notes, status, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.id,
      input.accountId,
      input.bedId,
      input.plantId,
      input.year,
      input.quantity ?? null,
      input.notes ?? null,
      input.status ?? "planted",
      input.archivedAt ?? null
    ]
  );
}
