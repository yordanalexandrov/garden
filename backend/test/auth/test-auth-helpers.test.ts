import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TestAuthAdapter, TestAuthIds, TestAuthTokens } from "../../src/modules/auth/test-auth.adapter.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";
import { accountAAuthHeaders, accountBAuthHeaders, invalidAuthHeaders } from "../helpers/auth.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

describe("auth request helpers", () => {
  it("attaches account A authorization header", () => {
    expect(accountAAuthHeaders()).toEqual({
      authorization: `Bearer ${TestAuthTokens.accountA}`
    });
  });

  it("attaches account B authorization header", () => {
    expect(accountBAuthHeaders()).toEqual({
      authorization: `Bearer ${TestAuthTokens.accountB}`
    });
  });

  it("provides an invalid-token helper for unauthorized paths", async () => {
    const adapter = new TestAuthAdapter();

    await expect(adapter.verifyAccessToken(invalidAuthHeaders().authorization.replace("Bearer ", ""))).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Unauthorized"
    });
  });
});

describeDatabase("account auth fixtures", () => {
  let pool: Pool;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
  });

  afterEach(async () => {
    await pool.end();
  });

  it("creates account A and account B with stable identifiers", async () => {
    await insertAuthAccountFixtures(pool);

    const result = await pool.query<{ id: string; email: string }>(
      "select id, email from accounts where id = any($1::uuid[]) order by id",
      [[AccountFixtureIds.accountA, AccountFixtureIds.accountB]]
    );

    expect(result.rows).toEqual([
      {
        id: TestAuthIds.accountA,
        email: "account-a@example.com"
      },
      {
        id: TestAuthIds.accountB,
        email: "account-b@example.com"
      }
    ]);
  });
});
