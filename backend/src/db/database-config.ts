import type { PoolConfig } from "pg";

import type { BackendOnlyConfig } from "../config/config.js";

export type DatabaseConnectionSettings = {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
};

export type DatabaseTarget = {
  host: string;
  database: string | undefined;
  user: string | undefined;
};

export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

export function resolveDatabaseConnectionSettings(config: BackendOnlyConfig): DatabaseConnectionSettings {
  if (config.databaseUrl !== undefined) {
    assertValidDatabaseUrl(config.databaseUrl);
    return { connectionString: config.databaseUrl };
  }

  if (config.postgresHost === undefined || config.postgresDb === undefined || config.postgresUser === undefined) {
    throw new DatabaseConfigError(
      "Database connection requires DATABASE_URL or POSTGRES_HOST, POSTGRES_DB, and POSTGRES_USER"
    );
  }

  const settings: DatabaseConnectionSettings = {
    host: config.postgresHost,
    port: config.postgresPort ?? 5432,
    database: config.postgresDb,
    user: config.postgresUser
  };

  if (config.postgresPassword !== undefined) {
    settings.password = config.postgresPassword;
  }

  return settings;
}

export function toPgPoolConfig(settings: DatabaseConnectionSettings): PoolConfig {
  if (settings.connectionString !== undefined) {
    return { connectionString: settings.connectionString };
  }

  if (settings.host === undefined || settings.database === undefined || settings.user === undefined) {
    throw new DatabaseConfigError("Database connection settings are incomplete");
  }

  const poolConfig: PoolConfig = {
    host: settings.host,
    port: settings.port ?? 5432,
    database: settings.database,
    user: settings.user
  };

  if (settings.password !== undefined) {
    poolConfig.password = settings.password;
  }

  return poolConfig;
}

export function databaseTargetFromSettings(settings: DatabaseConnectionSettings): DatabaseTarget {
  if (settings.connectionString !== undefined) {
    return databaseTargetFromUrl(settings.connectionString);
  }

  if (settings.host === undefined) {
    throw new DatabaseConfigError("Database host is required");
  }

  return {
    host: settings.host,
    database: settings.database,
    user: settings.user
  };
}

export function databaseTargetFromUrl(databaseUrl: string): DatabaseTarget {
  const parsed = parseDatabaseUrl(databaseUrl);
  const database = databaseNameFromPath(parsed);

  if (parsed.hostname === "") {
    throw new DatabaseConfigError("DATABASE_URL must include an explicit host");
  }

  if (database === undefined) {
    throw new DatabaseConfigError("DATABASE_URL must include an explicit database name");
  }

  rejectHostOverrideParameters(parsed);

  return {
    host: parsed.hostname,
    database,
    user: parsed.username === "" ? undefined : decodeURIComponent(parsed.username)
  };
}

function assertValidDatabaseUrl(databaseUrl: string): void {
  databaseTargetFromUrl(databaseUrl);
}

function parseDatabaseUrl(databaseUrl: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new DatabaseConfigError("DATABASE_URL must be a valid PostgreSQL connection URL");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new DatabaseConfigError("DATABASE_URL must use postgres:// or postgresql://");
  }

  return parsed;
}

function databaseNameFromPath(parsed: URL): string | undefined {
  if (parsed.pathname === "" || parsed.pathname === "/") {
    return undefined;
  }

  return decodeURIComponent(parsed.pathname.slice(1));
}

function rejectHostOverrideParameters(parsed: URL): void {
  for (const parameterName of parsed.searchParams.keys()) {
    const normalized = parameterName.toLowerCase();

    if (normalized === "host" || normalized === "hostaddr") {
      throw new DatabaseConfigError("DATABASE_URL must not use host override query parameters");
    }
  }
}
