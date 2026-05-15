import { describe, expect, it } from "vitest";

import { databaseTargetFromUrl, resolveDatabaseConnectionSettings } from "../../src/db/database-config.js";
import {
  assertSafeMigrationTarget,
  assertSafeTestResetTarget,
  UnsafeDatabaseTargetError
} from "../../src/db/database-safety.js";
import { BASELINE_MIGRATIONS, SEED_MIGRATION } from "../../src/db/migrations/baseline.js";

describe("baseline migration registration", () => {
  it("registers the provided SQL files in deterministic phase order", () => {
    expect(BASELINE_MIGRATIONS.map((migration) => migration.id)).toEqual(["001", "002", "003", "004"]);
    expect(BASELINE_MIGRATIONS.map((migration) => migration.filePath)).toEqual([
      expect.stringContaining("001_initial_schema_gardening_helper.sql"),
      expect.stringContaining("002_views_gardening_helper.sql"),
      expect.stringContaining("003_seed_reference_data_gardening_helper.sql"),
      expect.stringContaining("004_guards_and_triggers_gardening_helper.sql")
    ]);
  });

  it("marks seed migration as local/dev/test convenience data", () => {
    expect(SEED_MIGRATION.id).toBe("003");
    expect(SEED_MIGRATION.containsSeedData).toBe(true);
  });
});

describe("database target safety", () => {
  it("derives safe target metadata from DATABASE_URL", () => {
    expect(databaseTargetFromUrl("postgres://garden_user:secret@localhost:5432/garden_test")).toEqual({
      host: "localhost",
      database: "garden_test",
      user: "garden_user"
    });
  });

  it("prefers DATABASE_URL over discrete postgres settings", () => {
    expect(
      resolveDatabaseConnectionSettings({
        databaseUrl: "postgres://garden_user:secret@localhost:5432/garden_test",
        postgresHost: "ignored",
        postgresPort: 5433,
        postgresDb: "ignored",
        postgresUser: "ignored",
        postgresPassword: "ignored",
        supabaseServiceRoleKey: undefined,
        supabaseJwtSecret: undefined,
        vapidPrivateKey: undefined,
        aiApiKey: undefined,
        supabaseStudioUsername: undefined,
        supabaseStudioPassword: undefined
      })
    ).toEqual({ connectionString: "postgres://garden_user:secret@localhost:5432/garden_test" });
  });

  it("allows local/private migration targets outside production", () => {
    expect(() =>
      assertSafeMigrationTarget({ host: "postgres", database: "garden_dev", user: "garden" }, { nodeEnv: "development" })
    ).not.toThrow();
  });

  it("rejects production and public migration targets", () => {
    expect(() =>
      assertSafeMigrationTarget({ host: "localhost", database: "garden_test", user: "garden" }, { nodeEnv: "production" })
    ).toThrow(UnsafeDatabaseTargetError);

    expect(() =>
      assertSafeMigrationTarget(
        { host: "db.example.com", database: "garden_test", user: "garden" },
        { nodeEnv: "test" }
      )
    ).toThrow(UnsafeDatabaseTargetError);

    expect(() =>
      assertSafeMigrationTarget({ host: "localhost", database: "garden_prod", user: "garden" }, { nodeEnv: "test" })
    ).toThrow(UnsafeDatabaseTargetError);
  });

  it("requires a test marker or explicit override for reset targets", () => {
    expect(() =>
      assertSafeTestResetTarget({ host: "localhost", database: "garden_test", user: "garden" }, { nodeEnv: "test" })
    ).not.toThrow();

    expect(() =>
      assertSafeTestResetTarget({ host: "localhost", database: "garden_dev", user: "garden" }, { nodeEnv: "test" })
    ).toThrow(UnsafeDatabaseTargetError);

    expect(() =>
      assertSafeTestResetTarget(
        { host: "localhost", database: "garden_dev", user: "garden" },
        { nodeEnv: "test", allowReset: true }
      )
    ).not.toThrow();
  });
});
