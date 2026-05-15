import { BASELINE_MIGRATIONS, readMigrationSql, SEED_MIGRATION, type BaselineMigration } from "./baseline.js";

export const MIGRATIONS_TABLE_NAME = "gardening_helper_schema_migrations";
const MIGRATION_ADVISORY_LOCK_ID = 462507312;

export type SqlQueryExecutor = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[]
  ): Promise<{ rows: T[] }>;
};

export type SqlConnection = SqlQueryExecutor & {
  release(): void;
};

export type SqlExecutor = SqlQueryExecutor & {
  connect?: () => Promise<SqlConnection>;
};

export type AppliedMigration = {
  id: string;
  label: string;
  filePath: string;
};

export async function applyBaselineMigrations(
  executor: SqlExecutor,
  migrations: readonly BaselineMigration[] = BASELINE_MIGRATIONS
): Promise<AppliedMigration[]> {
  return withMigrationConnection(executor, async (connection) => {
    const applied: AppliedMigration[] = [];

    await acquireMigrationLock(connection);

    try {
      await ensureMigrationsTable(connection);

      for (const migration of migrations) {
        if (await hasMigrationBeenApplied(connection, migration.id)) {
          continue;
        }

        const migrationSql = stripOuterTransactionBoundary(await readMigrationSql(migration));
        await runInTransaction(connection, async () => {
          await connection.query(migrationSql);
          await recordAppliedMigration(connection, migration);
        });
        applied.push({
          id: migration.id,
          label: migration.label,
          filePath: migration.filePath
        });
      }

      return applied;
    } finally {
      await releaseMigrationLock(connection);
    }
  });
}

export async function applySeedMigration(executor: SqlExecutor): Promise<AppliedMigration> {
  await withMigrationConnection(executor, async (connection) => {
    const migrationSql = stripOuterTransactionBoundary(await readMigrationSql(SEED_MIGRATION));
    await runInTransaction(connection, async () => {
      await connection.query(migrationSql);
    });
  });

  return {
    id: SEED_MIGRATION.id,
    label: SEED_MIGRATION.label,
    filePath: SEED_MIGRATION.filePath
  };
}

export async function resetPublicSchema(executor: SqlExecutor): Promise<void> {
  await executor.query(`
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
  `);
}

async function ensureMigrationsTable(executor: SqlExecutor): Promise<void> {
  await executor.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE_NAME} (
      id text PRIMARY KEY,
      label text NOT NULL,
      file_path text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT NOW()
    );
  `);
}

async function hasMigrationBeenApplied(executor: SqlExecutor, migrationId: string): Promise<boolean> {
  const result = await executor.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM ${MIGRATIONS_TABLE_NAME}
       WHERE id = $1
     ) AS "exists"`,
    [migrationId]
  );

  return result.rows[0]?.exists === true;
}

async function recordAppliedMigration(executor: SqlExecutor, migration: BaselineMigration): Promise<void> {
  await executor.query(
    `INSERT INTO ${MIGRATIONS_TABLE_NAME} (id, label, file_path)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO NOTHING`,
    [migration.id, migration.label, migration.filePath]
  );
}

async function withMigrationConnection<T>(
  executor: SqlExecutor,
  fn: (connection: SqlQueryExecutor) => Promise<T>
): Promise<T> {
  if (executor.connect === undefined) {
    return fn(executor);
  }

  const connection = await executor.connect();

  try {
    return await fn(connection);
  } finally {
    connection.release();
  }
}

async function acquireMigrationLock(executor: SqlExecutor): Promise<void> {
  await executor.query("SELECT pg_advisory_lock($1)", [MIGRATION_ADVISORY_LOCK_ID]);
}

async function releaseMigrationLock(executor: SqlExecutor): Promise<void> {
  await executor.query("SELECT pg_advisory_unlock($1)", [MIGRATION_ADVISORY_LOCK_ID]);
}

async function runInTransaction(executor: SqlExecutor, fn: () => Promise<void>): Promise<void> {
  await executor.query("BEGIN");

  try {
    await fn();
    await executor.query("COMMIT");
  } catch (error) {
    await executor.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function stripOuterTransactionBoundary(sql: string): string {
  const lines = sql.split(/\r?\n/);
  const firstBeginIndex = lines.findIndex((line) => line.trim().toLowerCase() === "begin;");

  if (firstBeginIndex !== -1) {
    lines.splice(firstBeginIndex, 1);
  }

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index]?.trim().toLowerCase() === "commit;") {
      lines.splice(index, 1);
      break;
    }
  }

  return lines.join("\n");
}
