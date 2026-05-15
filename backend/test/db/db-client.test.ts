import type { Selectable } from "kysely";
import { describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { DatabaseConfigError } from "../../src/db/database-config.js";
import type { Database } from "../../src/db/database.types.js";
import { createDbClient } from "../../src/db/db.js";

describe("database client factory", () => {
  it("requires backend-only database config", () => {
    const config = loadConfig({ NODE_ENV: "test" });

    expect(() => createDbClient(config)).toThrow(DatabaseConfigError);
  });

  it("creates and destroys a typed client without querying at import time", async () => {
    const config = loadConfig({
      NODE_ENV: "test",
      DATABASE_URL: "postgres://garden_user:secret@localhost:5432/garden_test"
    });

    const client = createDbClient(config);

    expect(client.db).toBeDefined();
    expect(typeof client.transaction).toBe("function");

    const compiled = client.db
      .selectFrom("inventory_product_balances")
      .select(["product_id", "quantity_remaining"])
      .compile();

    expect(compiled.sql).toContain("inventory_product_balances");

    await client.destroy();
    await client.destroy();
  });
});

describe("typed database surface", () => {
  it("compiles representative baseline tables and views", () => {
    type AccountRow = Selectable<Database["accounts"]>;
    type BalanceRow = Selectable<Database["inventory_product_balances"]>;

    const account: AccountRow = {
      id: "00000000-0000-0000-0000-000000000001",
      email: "demo@example.com",
      display_name: "Demo",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
      archived_at: null
    };
    const balance: BalanceRow = {
      product_id: "70000000-0000-0000-0000-000000000001",
      account_id: account.id,
      product_name: "Demo Copper Product",
      category: "fungicide",
      default_unit: "g",
      quantity_remaining: "500",
      active_lot_count: "1",
      next_expiry_date: "2027-01-01"
    };

    expect(balance.account_id).toBe(account.id);
  });
});
