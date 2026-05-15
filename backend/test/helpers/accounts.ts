import type pg from "pg";

import { TestAuthIds } from "../../src/modules/auth/test-auth.adapter.js";

export const AccountFixtureIds = {
  accountA: TestAuthIds.accountA,
  accountB: TestAuthIds.accountB,
  archivedAccount: TestAuthIds.archivedAccount
} as const;

export async function insertAccountFixture(
  pool: pg.Pool,
  input: {
    id: string;
    email: string;
    displayName?: string;
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into accounts (id, email, display_name, archived_at)
     values ($1, $2, $3, $4)
     on conflict (id) do update
       set email = excluded.email,
           display_name = excluded.display_name,
           archived_at = excluded.archived_at`,
    [input.id, input.email, input.displayName ?? input.email, input.archivedAt ?? null]
  );
}

export async function insertAuthAccountFixtures(pool: pg.Pool): Promise<void> {
  await insertAccountFixture(pool, {
    id: AccountFixtureIds.accountA,
    email: "account-a@example.com",
    displayName: "Account A"
  });
  await insertAccountFixture(pool, {
    id: AccountFixtureIds.accountB,
    email: "account-b@example.com",
    displayName: "Account B"
  });
}
