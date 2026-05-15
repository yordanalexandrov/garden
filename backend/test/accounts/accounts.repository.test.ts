import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAccountFixture, insertAuthAccountFixtures } from "../helpers/accounts.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

describeDatabase("AccountsRepository", () => {
  let pool: Pool;
  let dbClient: DbClient;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
  });

  afterEach(async () => {
    await dbClient.destroy();
    await pool.end();
  });

  it("finds active account A by ID", async () => {
    await insertAuthAccountFixtures(pool);
    const repository = new KyselyAccountsRepository(dbClient);

    const account = await repository.findById(AccountFixtureIds.accountA);

    expect(account).toMatchObject({
      id: AccountFixtureIds.accountA,
      email: "account-a@example.com",
      displayName: "Account A",
      archivedAt: null
    });
  });

  it("finds active account B by ID", async () => {
    await insertAuthAccountFixtures(pool);
    const repository = new KyselyAccountsRepository(dbClient);

    const account = await repository.findById(AccountFixtureIds.accountB);

    expect(account).toMatchObject({
      id: AccountFixtureIds.accountB,
      email: "account-b@example.com",
      displayName: "Account B",
      archivedAt: null
    });
  });

  it("returns null for unknown accounts", async () => {
    await insertAuthAccountFixtures(pool);
    const repository = new KyselyAccountsRepository(dbClient);

    await expect(repository.findById("99999999-9999-9999-9999-999999999999")).resolves.toBeNull();
  });

  it("does not return archived accounts as active auth context", async () => {
    await insertAccountFixture(pool, {
      id: AccountFixtureIds.archivedAccount,
      email: "archived@example.com",
      archivedAt: new Date("2026-05-16T00:00:00.000Z")
    });
    const repository = new KyselyAccountsRepository(dbClient);

    await expect(repository.findById(AccountFixtureIds.archivedAccount)).resolves.toBeNull();
  });

  it("can run with a transaction-scoped database handle", async () => {
    const repository = new KyselyAccountsRepository(dbClient);

    const account = await dbClient.transaction(async (trx) => {
      await trx.db
        .insertInto("accounts")
        .values({
          id: AccountFixtureIds.accountA,
          email: "account-a@example.com",
          display_name: "Account A"
        })
        .execute();

      return repository.findById(AccountFixtureIds.accountA, trx);
    });

    expect(account?.id).toBe(AccountFixtureIds.accountA);
  });
});
