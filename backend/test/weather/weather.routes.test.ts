import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TestWeatherAdapter } from "../../src/integrations/weather/test-weather.adapter.js";
import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import { TestAuthAdapter } from "../../src/modules/auth/test-auth.adapter.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders, accountBAuthHeaders } from "../helpers/auth.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const Ids = {
  placeDisabledA: "11111111-1111-4111-8111-111111111111",
  placeEnabledA: "22222222-2222-4222-8222-222222222222",
  placeMissingLocationA: "33333333-3333-4333-8333-333333333333",
  placeB: "44444444-4444-4444-8444-444444444444",
  taskA: "55555555-5555-4555-8555-555555555555",
  taskB: "66666666-6666-4666-8666-666666666666",
  activityA: "77777777-7777-4777-8777-777777777777",
  weatherRainTaskA: "88888888-8888-4888-8888-888888888888",
  weatherForecastA: "99999999-9999-4999-8999-999999999999",
  weatherRainTaskB: "12121212-1212-4121-8121-121212121212"
} as const;

type ForecastResponse = {
  data: {
    placeId: string;
    enabled: boolean;
    locationLabel?: string;
    forecast: Array<{ date: string; temperatureMinC: number | null; temperatureMaxC: number | null; rainProbability: number | null; summary: string }>;
  };
};

type ConfirmRainResponse = {
  data: {
    id: string;
    userConfirmationStatus: string;
    observedRain: boolean | null;
  };
};

describeDatabase("Weather routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;
  let weather: TestWeatherAdapter;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertWeatherFixture(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    weather = new TestWeatherAdapter();
    app = await createTestApp({
      db: dbClient,
      weather,
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

  it("returns disabled forecast without calling WeatherPort and protects/account-scopes forecast reads", async () => {
    const unauthenticated = await app!.inject({ method: "GET", url: `/api/v1/places/${Ids.placeDisabledA}/weather/forecast` });
    const disabled = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${Ids.placeDisabledA}/weather/forecast`,
      headers: accountAAuthHeaders()
    });
    const crossAccount = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${Ids.placeB}/weather/forecast`,
      headers: accountAAuthHeaders()
    });

    expect(unauthenticated.statusCode).toBe(401);
    expect(disabled.statusCode).toBe(200);
    expect(parseJsonResponse<ForecastResponse>(disabled).data).toEqual({
      placeId: Ids.placeDisabledA,
      enabled: false,
      forecast: []
    });
    expect(weather.forecastCalls).toHaveLength(0);
    expect(crossAccount.statusCode).toBe(404);
  });

  it("returns enabled normalized forecast and rejects enabled places without location data", async () => {
    const enabled = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${Ids.placeEnabledA}/weather/forecast`,
      headers: accountAAuthHeaders()
    });
    const missingLocation = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${Ids.placeMissingLocationA}/weather/forecast`,
      headers: accountAAuthHeaders()
    });

    expect(enabled.statusCode).toBe(200);
    const enabledData = parseJsonResponse<ForecastResponse>(enabled).data;
    expect(enabledData).toMatchObject({
      placeId: Ids.placeEnabledA,
      enabled: true,
      locationLabel: "Ruse, Bulgaria"
    });
    expect(enabledData.forecast).toEqual(
      expect.arrayContaining([expect.objectContaining({ date: "2026-05-13", rainProbability: 0.4 })])
    );
    expect(weather.forecastCalls).toHaveLength(1);
    expect(missingLocation.statusCode).toBe(422);
    expect(missingLocation.json()).toMatchObject({ error: { code: "BUSINESS_RULE_VIOLATION" } });
  });

  it("maps provider failure to canonical EXTERNAL_SERVICE_ERROR", async () => {
    await app?.close();
    weather = new TestWeatherAdapter({ failForecasts: true });
    app = await createTestApp({
      db: dbClient,
      weather,
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new KyselyAccountsRepository(dbClient)
      }
    });

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/places/${Ids.placeEnabledA}/weather/forecast`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({ error: { code: "EXTERNAL_SERVICE_ERROR" } });
  });

  it("persists rain confirmation mapping while preserving task/activity/reminder side effects", async () => {
    const before = await readSideEffectState(pool);
    const yes = await app!.inject({
      method: "POST",
      url: `/api/v1/weather/events/${Ids.weatherRainTaskA}/confirm-rain`,
      headers: accountAAuthHeaders(),
      payload: { response: "confirmed_yes" }
    });
    const afterYes = await readWeatherEvent(pool, Ids.weatherRainTaskA);
    const no = await app!.inject({
      method: "POST",
      url: `/api/v1/weather/events/${Ids.weatherRainTaskA}/confirm-rain`,
      headers: accountAAuthHeaders(),
      payload: { response: "confirmed_no" }
    });
    const ignored = await app!.inject({
      method: "POST",
      url: `/api/v1/weather/events/${Ids.weatherRainTaskA}/confirm-rain`,
      headers: accountAAuthHeaders(),
      payload: { response: "ignored" }
    });
    const after = await readSideEffectState(pool);

    expect(yes.statusCode).toBe(200);
    expect(parseJsonResponse<ConfirmRainResponse>(yes).data).toEqual({
      id: Ids.weatherRainTaskA,
      userConfirmationStatus: "confirmed_yes",
      observedRain: true
    });
    expect(afterYes).toEqual({ user_confirmation_status: "confirmed_yes", observed_rain: true });
    expect(parseJsonResponse<ConfirmRainResponse>(no).data).toMatchObject({ userConfirmationStatus: "confirmed_no", observedRain: false });
    expect(parseJsonResponse<ConfirmRainResponse>(ignored).data).toMatchObject({ userConfirmationStatus: "ignored", observedRain: null });
    expect(after).toEqual(before);
  });

  it("rejects invalid confirmation values, cross-account events, and non-rain-check events", async () => {
    const invalidResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/weather/events/${Ids.weatherRainTaskA}/confirm-rain`,
      headers: accountAAuthHeaders(),
      payload: { response: "pending" }
    });
    const crossAccount = await app!.inject({
      method: "POST",
      url: `/api/v1/weather/events/${Ids.weatherRainTaskB}/confirm-rain`,
      headers: accountAAuthHeaders(),
      payload: { response: "confirmed_yes" }
    });
    const nonRainCheck = await app!.inject({
      method: "POST",
      url: `/api/v1/weather/events/${Ids.weatherForecastA}/confirm-rain`,
      headers: accountAAuthHeaders(),
      payload: { response: "confirmed_yes" }
    });
    const accountBCanConfirmOwnEvent = await app!.inject({
      method: "POST",
      url: `/api/v1/weather/events/${Ids.weatherRainTaskB}/confirm-rain`,
      headers: accountBAuthHeaders(),
      payload: { response: "confirmed_no" }
    });

    expect(invalidResponse.statusCode).toBe(400);
    expect(invalidResponse.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(crossAccount.statusCode).toBe(404);
    expect(nonRainCheck.statusCode).toBe(422);
    expect(nonRainCheck.json()).toMatchObject({ error: { code: "BUSINESS_RULE_VIOLATION" } });
    expect(accountBCanConfirmOwnEvent.statusCode).toBe(200);
  });
});

async function insertWeatherFixture(pool: Pool): Promise<void> {
  await pool.query(
    `insert into places (id, account_id, name, weather_enabled, weather_location_label, latitude, longitude, timezone)
     values
       ($1, $5, 'Disabled Place A', false, null, null, null, null),
       ($2, $5, 'Enabled Place A', true, 'Ruse, Bulgaria', 43.85, 25.96, 'Europe/Sofia'),
       ($3, $5, 'Missing Location Place A', true, null, null, null, null),
       ($4, $6, 'Enabled Place B', true, 'Sofia, Bulgaria', 42.69, 23.32, 'Europe/Sofia')`,
    [Ids.placeDisabledA, Ids.placeEnabledA, Ids.placeMissingLocationA, Ids.placeB, AccountFixtureIds.accountA, AccountFixtureIds.accountB]
  );
  await pool.query(
    `insert into tasks (id, account_id, place_id, type, due_date, source_type, source_reference_id, target_scope_type, status, confirmed_at)
     values
       ($1, $3, $4, 'spraying', '2026-05-23', 'manual', null, 'whole_place', 'planned', now()),
       ($2, $5, $6, 'spraying', '2026-05-23', 'manual', null, 'whole_place', 'planned', now())`,
    [Ids.taskA, Ids.taskB, AccountFixtureIds.accountA, Ids.placeEnabledA, AccountFixtureIds.accountB, Ids.placeB]
  );
  await pool.query(
    `insert into task_reminders (task_id, reminder_type, scheduled_for, status)
     values ($1, 'same_day', '2026-05-23T06:00:00.000Z', 'scheduled')`,
    [Ids.taskA]
  );
  await pool.query(
    `insert into activities (id, account_id, place_id, type, performed_at, target_scope_type)
     values ($1, $2, $3, 'treatment', '2026-05-22T08:00:00.000Z', 'whole_place')`,
    [Ids.activityA, AccountFixtureIds.accountA, Ids.placeEnabledA]
  );
  await pool.query(
    `insert into weather_events (
       id, account_id, place_id, related_entity_type, related_entity_id, event_type,
       forecasted_rain, observed_rain, user_confirmation_status, provider_payload
     )
     values
       ($1, $4, $5, 'task', $6, 'rain_check', true, null, 'pending', '{"provider":"test"}'::jsonb),
       ($2, $4, $5, 'task', $6, 'forecast_snapshot', true, null, null, '{"provider":"test"}'::jsonb),
       ($3, $7, $8, 'task', $9, 'rain_check', true, null, 'pending', '{"provider":"test"}'::jsonb)`,
    [
      Ids.weatherRainTaskA,
      Ids.weatherForecastA,
      Ids.weatherRainTaskB,
      AccountFixtureIds.accountA,
      Ids.placeEnabledA,
      Ids.taskA,
      AccountFixtureIds.accountB,
      Ids.placeB,
      Ids.taskB
    ]
  );
}

async function readWeatherEvent(pool: Pool, id: string): Promise<{ user_confirmation_status: string | null; observed_rain: boolean | null }> {
  const result = await pool.query<{ user_confirmation_status: string | null; observed_rain: boolean | null }>(
    "select user_confirmation_status, observed_rain from weather_events where id = $1",
    [id]
  );
  return result.rows[0]!;
}

async function readSideEffectState(pool: Pool): Promise<Record<string, string>> {
  const result = await pool.query<Record<string, string>>(
    `select
       (select status from tasks where id = $1) as task_status,
       (select type from activities where id = $2) as activity_type,
       (select count(*) from task_reminders where task_id = $1) as reminders,
       (select count(*) from tasks where account_id = $3 and status = 'planned') as planned_tasks,
       (select count(*) from tasks where account_id = $3 and status = 'suggested') as suggested_tasks,
       (select count(*) from quarantine_periods where account_id = $3) as quarantine_periods,
       (select count(*) from inventory_movements where account_id = $3) as inventory_movements`,
    [Ids.taskA, Ids.activityA, AccountFixtureIds.accountA]
  );
  return result.rows[0]!;
}

function parseJsonResponse<T>(response: LightMyRequestResponse): T {
  return response.json<T>();
}
