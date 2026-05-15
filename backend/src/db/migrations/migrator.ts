import { BASELINE_MIGRATIONS, readMigrationSql, SEED_MIGRATION, type BaselineMigration } from "./baseline.js";

export const MIGRATIONS_TABLE_NAME = "gardening_helper_schema_migrations";

export type SqlExecutor = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[]
  ): Promise<{ rows: T[] }>;
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
  const applied: AppliedMigration[] = [];

  await ensureMigrationsTable(executor);

  for (const migration of migrations) {
    if (await hasMigrationBeenApplied(executor, migration.id)) {
      continue;
    }

    const migrationSql = await readMigrationSql(migration);
    await executor.query(migrationSql);
    await recordAppliedMigration(executor, migration);
    applied.push({
      id: migration.id,
      label: migration.label,
      filePath: migration.filePath
    });
  }

  return applied;
}

export async function applySeedMigration(executor: SqlExecutor): Promise<AppliedMigration> {
  const migrationSql = await readMigrationSql(SEED_MIGRATION);
  await executor.query(migrationSql);

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
