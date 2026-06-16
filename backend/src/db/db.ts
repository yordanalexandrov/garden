import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

import type { AppConfig, BackendOnlyConfig } from "../config/config.js";
import {
  resolveDatabaseConnectionSettings,
  toPgPoolConfig,
  type DatabaseConnectionSettings
} from "./database-config.js";
import type { Database } from "./database.types.js";
import { KyselyDbClient, type DbClient } from "./transaction.js";

const { Pool, types } = pg;

// pg parses DATE columns as JS Date objects by default, but our schema types
// declare them as DateOnly (string). Return raw "YYYY-MM-DD" strings instead.
types.setTypeParser(types.builtins.DATE, (val: string) => val);

export function createPgPool(settings: DatabaseConnectionSettings): pg.Pool {
  return new Pool(toPgPoolConfig(settings));
}

export function createKyselyDatabase(settings: DatabaseConnectionSettings): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: createPgPool(settings)
    })
  });
}

export function createDbClient(config: AppConfig | BackendOnlyConfig): DbClient {
  const backendOnlyConfig = "backendOnly" in config ? config.backendOnly : config;
  const settings = resolveDatabaseConnectionSettings(backendOnlyConfig);

  return new KyselyDbClient(createKyselyDatabase(settings));
}
