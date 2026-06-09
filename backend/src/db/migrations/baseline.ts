import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type BaselineMigration = {
  id: string;
  label: string;
  filePath: string;
  containsSeedData: boolean;
};

const docsDir = resolve(process.cwd(), "../docs");

export const BASELINE_MIGRATIONS = [
  {
    id: "001",
    label: "initial schema",
    filePath: resolve(docsDir, "001_initial_schema_gardening_helper.sql"),
    containsSeedData: false
  },
  {
    id: "002",
    label: "read model views",
    filePath: resolve(docsDir, "002_views_gardening_helper.sql"),
    containsSeedData: false
  },
  {
    id: "003",
    label: "local/dev/test seed reference data",
    filePath: resolve(docsDir, "003_seed_reference_data_gardening_helper.sql"),
    containsSeedData: true
  },
  {
    id: "004",
    label: "database guard triggers",
    filePath: resolve(docsDir, "004_guards_and_triggers_gardening_helper.sql"),
    containsSeedData: false
  },
  {
    id: "005",
    label: "archive activities",
    filePath: resolve(docsDir, "005_archive_activities.sql"),
    containsSeedData: false
  }
] as const satisfies readonly BaselineMigration[];

export const SEED_MIGRATION = BASELINE_MIGRATIONS[2];

export async function readMigrationSql(migration: BaselineMigration): Promise<string> {
  return readFile(migration.filePath, "utf8");
}
