import type pg from "pg";

import { loadConfig } from "../../../src/config/config.js";
import {
  databaseTargetFromSettings,
  resolveDatabaseConnectionSettings,
  type DatabaseConnectionSettings
} from "../../../src/db/database-config.js";
import { assertSafeTestResetTarget } from "../../../src/db/database-safety.js";
import { createPgPool } from "../../../src/db/db.js";
import { applyBaselineMigrations, applySeedMigration, resetPublicSchema } from "../../../src/db/migrations/migrator.js";

export const hasTestDatabase = (): boolean => getTestDatabaseUrl() !== undefined;

export function getTestDatabaseSettings(): DatabaseConnectionSettings {
  const databaseUrl = getTestDatabaseUrl();

  if (databaseUrl === undefined) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for database integration tests");
  }

  const config = loadConfig({
    ...process.env,
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl
  });
  const settings = resolveDatabaseConnectionSettings(config.backendOnly);
  const target = databaseTargetFromSettings(settings);

  assertSafeTestResetTarget(target, {
    nodeEnv: config.nodeEnv,
    allowReset: process.env.ALLOW_TEST_DATABASE_RESET === "true"
  });

  return settings;
}

export function createTestPool(): pg.Pool {
  return createPgPool(getTestDatabaseSettings());
}

export async function resetAndApplyBaseline(pool: pg.Pool): Promise<void> {
  await resetPublicSchema(pool);
  await applyBaselineMigrations(pool);
}

export async function applySeedAgain(pool: pg.Pool): Promise<void> {
  await applySeedMigration(pool);
}

function getTestDatabaseUrl(): string | undefined {
  const value = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  return value;
}
