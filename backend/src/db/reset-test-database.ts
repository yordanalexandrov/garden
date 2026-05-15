import { loadConfig } from "../config/config.js";
import {
  databaseTargetFromSettings,
  resolveDatabaseConnectionSettings
} from "./database-config.js";
import { assertSafeTestResetTarget } from "./database-safety.js";
import { createPgPool } from "./db.js";
import { applyBaselineMigrations, resetPublicSchema } from "./migrations/migrator.js";

async function main(): Promise<void> {
  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? "test",
    DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
  };
  const config = loadConfig(env);
  const settings = resolveDatabaseConnectionSettings(config.backendOnly);
  const target = databaseTargetFromSettings(settings);

  assertSafeTestResetTarget(target, {
    nodeEnv: config.nodeEnv,
    allowReset: process.env.ALLOW_TEST_DATABASE_RESET === "true"
  });

  const pool = createPgPool(settings);

  try {
    await resetPublicSchema(pool);
    const applied = await applyBaselineMigrations(pool);
    console.info(`Reset test database and applied migrations: ${applied.map((migration) => migration.id).join(", ")}`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
