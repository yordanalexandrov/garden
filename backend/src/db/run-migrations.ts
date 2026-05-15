import { loadConfig } from "../config/config.js";
import {
  databaseTargetFromSettings,
  resolveDatabaseConnectionSettings
} from "./database-config.js";
import { assertSafeMigrationTarget } from "./database-safety.js";
import { createPgPool } from "./db.js";
import { applyBaselineMigrations } from "./migrations/migrator.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const settings = resolveDatabaseConnectionSettings(config.backendOnly);
  const target = databaseTargetFromSettings(settings);

  assertSafeMigrationTarget(target, { nodeEnv: config.nodeEnv });

  const pool = createPgPool(settings);

  try {
    const applied = await applyBaselineMigrations(pool);
    if (applied.length === 0) {
      console.info("No pending baseline migrations");
      return;
    }

    console.info(`Applied baseline migrations: ${applied.map((migration) => migration.id).join(", ")}`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
