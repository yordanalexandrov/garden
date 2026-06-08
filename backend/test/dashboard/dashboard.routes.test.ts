import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { AccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { Account } from "../../src/modules/accounts/accounts.types.js";
import { TestAuthAdapter } from "../../src/modules/auth/test-auth.adapter.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders, accountBAuthHeaders } from "../helpers/auth.js";
import { insertCalendarDashboardFixture, Phase19Ids } from "../fixtures/phase-19.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

type DashboardResponse = {
  data: {
    upcomingTasks: Array<{ id: string; status: string; placeId: string; targetSummary: string }>;
    suggestedTasks: Array<{ id: string; status: string; placeId: string; targetSummary: string }>;
    activeQuarantinePeriods: Array<{ id: string; activityId: string; productId: string; placeId: string }>;
    recentActivities: Array<{ id: string; type: string; performedAt: string; placeId: string; targetSummary: string }>;
    openProblems: Array<{ id: string; type: string; title: string; status: string; placeId: string }>;
    lowStockProducts: Array<{ productId: string; productName: string; quantityRemaining: string; activeLotCount: number }>;
    places: Array<{ id: string; name: string; weatherEnabled: boolean }>;
  };
};

describe("Dashboard routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("protects dashboard and validates placeId before service dispatch", async () => {
    app = await createTestApp({
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new StaticAccountsRepository()
      }
    });

    const unauthenticated = await app.inject({ method: "GET", url: "/api/v1/dashboard" });
    const invalidPlaceId = await app.inject({ method: "GET", url: "/api/v1/dashboard?placeId=not-a-uuid", headers: accountAAuthHeaders() });

    expect(unauthenticated.statusCode).toBe(401);
    expect(invalidPlaceId.statusCode).toBe(400);
    expect(invalidPlaceId.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
  });
});

describeDatabase("Dashboard routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertCalendarDashboardFixture(pool);
    dbClient = createDbClient(
      loadConfig({ NODE_ENV: "test", DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL })
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

  it("returns every dashboard bucket while keeping planned and suggested tasks separate", async () => {
    const response = await app!.inject({ method: "GET", url: "/api/v1/dashboard", headers: accountAAuthHeaders() });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<DashboardResponse>(response).data;
    expect(Object.keys(body).sort()).toEqual([
      "activeQuarantinePeriods",
      "lowStockProducts",
      "openProblems",
      "places",
      "recentActivities",
      "suggestedTasks",
      "upcomingTasks"
    ]);
    expect(body.upcomingTasks).toEqual([
      expect.objectContaining({ id: Phase19Ids.plannedTaskA, status: "planned", targetSummary: "1 target" })
    ]);
    expect(body.suggestedTasks).toEqual([
      expect.objectContaining({ id: Phase19Ids.suggestedTaskA, status: "suggested", targetSummary: "1 target" })
    ]);
    expect(body.activeQuarantinePeriods).toEqual([
      expect.objectContaining({ id: Phase19Ids.quarantineA, activityId: Phase19Ids.activityA, productId: Phase19Ids.productA })
    ]);
    expect(body.recentActivities).toEqual([
      expect.objectContaining({ id: Phase19Ids.activityA, type: "treatment", targetSummary: "1 target" })
    ]);
    expect(body.openProblems).toEqual([expect.objectContaining({ id: Phase19Ids.problemA, status: "open" })]);
    expect(body.lowStockProducts).toEqual([
      expect.objectContaining({ productId: Phase19Ids.productA, productName: "Zero Stock A", quantityRemaining: "0", activeLotCount: 0 })
    ]);
    expect(body.places).toEqual([expect.objectContaining({ id: Phase19Ids.placeA, name: "Place A", weatherEnabled: true })]);
  });

  it("applies account and place filters to place-scoped buckets without mutating rows", async () => {
    const before = await readRelevantCounts(pool);
    const filtered = await app!.inject({
      method: "GET",
      url: `/api/v1/dashboard?placeId=${Phase19Ids.placeA}`,
      headers: accountAAuthHeaders()
    });
    const inaccessiblePlace = await app!.inject({
      method: "GET",
      url: `/api/v1/dashboard?placeId=${Phase19Ids.placeB}`,
      headers: accountAAuthHeaders()
    });
    const accountB = await app!.inject({ method: "GET", url: "/api/v1/dashboard", headers: accountBAuthHeaders() });
    const after = await readRelevantCounts(pool);

    expect(filtered.statusCode).toBe(200);
    const body = parseJsonResponse<DashboardResponse>(filtered).data;
    expect(body.upcomingTasks.map((item) => item.id)).toEqual([Phase19Ids.plannedTaskA]);
    expect(body.recentActivities.map((item) => item.id)).toEqual([Phase19Ids.activityA]);
    expect(body.openProblems.map((item) => item.id)).toEqual([Phase19Ids.problemA]);
    expect(body.places.map((item) => item.id)).toEqual([Phase19Ids.placeA]);
    expect(inaccessiblePlace.statusCode).toBe(404);

    const accountBBody = parseJsonResponse<DashboardResponse>(accountB).data;
    expect(accountBBody.upcomingTasks.map((item) => item.id)).toEqual([Phase19Ids.taskB]);
    expect(accountBBody.lowStockProducts.map((item) => item.productId)).toEqual([Phase19Ids.productB]);
    expect(after).toEqual(before);
  });
});

async function readRelevantCounts(pool: Pool): Promise<Record<string, string>> {
  const result = await pool.query<Record<string, string>>(
    `select
       (select count(*) from activities) as activities,
       (select count(*) from tasks) as tasks,
       (select count(*) from quarantine_periods) as quarantine_periods,
       (select count(*) from weather_events) as weather_events,
       (select count(*) from problems) as problems,
       (select count(*) from inventory_lots) as inventory_lots,
       (select count(*) from places) as places`
  );
  return result.rows[0]!;
}

function parseJsonResponse<T>(response: LightMyRequestResponse): T {
  return response.json<T>();
}

class StaticAccountsRepository implements AccountsRepository {
  findById(): Promise<Account | null> {
    return Promise.resolve({
      id: AccountFixtureIds.accountA,
      email: "account-a@example.com",
      displayName: "Account A",
      createdAt: new Date("2026-05-18T00:00:00.000Z"),
      updatedAt: new Date("2026-05-18T00:00:00.000Z"),
      archivedAt: null
    });
  }
}
