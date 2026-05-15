import { BASELINE_MIGRATIONS, readMigrationSql, SEED_MIGRATION, type BaselineMigration } from "./baseline.js";

export type SqlExecutor = {
  query(sql: string): Promise<unknown>;
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

  for (const migration of migrations) {
    const migrationSql = await readMigrationSql(migration);
    await executor.query(migrationSql);
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
    GRANT ALL ON SCHEMA public TO public;
  `);
}
