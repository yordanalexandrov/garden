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
import { insertCalendarDashboardFixture, insertResolvedProblemFixture, Phase19Ids } from "../fixtures/phase-19.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;


type CalendarResponse = {
  data: {
    activities: Array<{ id: string; type: string; activityType: string; dateTime: string; placeId: string; targetSummary: string }>;
    tasks: Array<{ id: string; type: string; taskType: string; dueDate: string; status: string; placeId: string; targetSummary: string }>;
    quarantinePeriods: Array<{ id: string; type: string; startsOn: string; endsOn: string; activityId: string; productId: string }>;
    weatherEvents: Array<{ id: string; type: string; date: string; eventType: string; userConfirmationStatus: string | null }>;
    problems: Array<{ id: string; type: string; date: string; title: string; status: string; placeId: string | null; isResolutionEntry: boolean }>;
  };
};

describe("Calendar routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("protects calendar and returns canonical validation errors before service dispatch", async () => {
    app = await createTestApp({
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new StaticAccountsRepository()
      }
    });

    const unauthenticated = await app.inject({ method: "GET", url: "/api/v1/calendar?from=2026-05-01&to=2026-05-31" });
    const missingFrom = await app.inject({ method: "GET", url: "/api/v1/calendar?to=2026-05-31", headers: accountAAuthHeaders() });
    const missingTo = await app.inject({ method: "GET", url: "/api/v1/calendar?from=2026-05-01", headers: accountAAuthHeaders() });
    const invalidRange = await app.inject({ method: "GET", url: "/api/v1/calendar?from=2026-06-01&to=2026-05-01", headers: accountAAuthHeaders() });

    expect(unauthenticated.statusCode).toBe(401);
    expect(missingFrom.statusCode).toBe(400);
    expect(missingFrom.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(missingTo.statusCode).toBe(400);
    expect(invalidRange.statusCode).toBe(400);
  });
});

describeDatabase("Calendar routes with database", () => {
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

  it("returns sectioned calendar data with task statuses, quarantine overlaps, weather events, and account scoping", async () => {
    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/calendar?from=2026-05-12&to=2026-05-25",
      headers: accountAAuthHeaders()
    });
    const accountB = await app!.inject({
      method: "GET",
      url: "/api/v1/calendar?from=2026-05-12&to=2026-05-25",
      headers: accountBAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<CalendarResponse>(response).data;
    expect(body.activities.map((item) => item.id)).toEqual([Phase19Ids.activityA]);
    expect(body.activities[0]).toMatchObject({ type: "activity", activityType: "treatment", targetSummary: "1 target" });
    expect(body.tasks.map((item) => ({ id: item.id, status: item.status }))).toEqual([
      { id: Phase19Ids.suggestedTaskA, status: "suggested" },
      { id: Phase19Ids.plannedTaskA, status: "planned" }
    ]);
    expect(body.quarantinePeriods).toEqual([
      expect.objectContaining({ id: Phase19Ids.quarantineA, type: "quarantine", activityId: Phase19Ids.activityA, productId: Phase19Ids.productA })
    ]);
    expect(body.weatherEvents).toEqual([
      expect.objectContaining({ id: Phase19Ids.weatherA, type: "weather", date: "2026-05-23", eventType: "rain_check" })
    ]);

    expect(parseJsonResponse<CalendarResponse>(accountB).data.activities.map((item) => item.id)).toEqual([Phase19Ids.activityB]);
  });

  it("includes unresolved problem at observedAt only, and resolved problem at both observedAt and resolvedAt", async () => {
    await insertResolvedProblemFixture(pool);

    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/calendar?from=2026-05-01&to=2026-05-31",
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<CalendarResponse>(response).data;
    const openItems = body.problems.filter((p) => p.id === Phase19Ids.problemA);
    const resolvedItems = body.problems.filter((p) => p.id === Phase19Ids.resolvedProblemA);

    expect(openItems).toHaveLength(1);
    expect(openItems[0]).toMatchObject({ isResolutionEntry: false, status: "open" });

    expect(resolvedItems).toHaveLength(2);
    expect(resolvedItems.some((p) => !p.isResolutionEntry)).toBe(true);
    expect(resolvedItems.some((p) => p.isResolutionEntry)).toBe(true);
    expect(resolvedItems.find((p) => p.isResolutionEntry)?.status).toBe("resolved");
  });

  it("applies place filters through account-scoped authorization and does not mutate source tables", async () => {
    const before = await readRelevantCounts(pool);
    const filtered = await app!.inject({
      method: "GET",
      url: `/api/v1/calendar?from=2026-05-12&to=2026-05-25&placeId=${Phase19Ids.placeA}`,
      headers: accountAAuthHeaders()
    });
    const inaccessiblePlace = await app!.inject({
      method: "GET",
      url: `/api/v1/calendar?from=2026-05-12&to=2026-05-25&placeId=${Phase19Ids.placeB}`,
      headers: accountAAuthHeaders()
    });
    const after = await readRelevantCounts(pool);

    expect(filtered.statusCode).toBe(200);
    const body = parseJsonResponse<CalendarResponse>(filtered).data;
    expect(body.activities).toHaveLength(1);
    expect(body.tasks).toHaveLength(2);
    expect(body.quarantinePeriods).toHaveLength(1);
    expect(body.weatherEvents).toHaveLength(1);
    expect(inaccessiblePlace.statusCode).toBe(404);
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
