import type { Selectable } from "kysely";

import type { AccountsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type { Account } from "./accounts.types.js";

export interface AccountsRepository {
  findById(accountId: UUID, db?: DbHandle): Promise<Account | null>;
}

export class KyselyAccountsRepository implements AccountsRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async findById(accountId: UUID, db: DbHandle = this.dbHandle): Promise<Account | null> {
    const account = await db.db
      .selectFrom("accounts")
      .select(["id", "email", "display_name", "created_at", "updated_at", "archived_at"])
      .where("id", "=", accountId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return account === undefined ? null : toAccount(account);
  }
}

function toAccount(row: Pick<Selectable<AccountsTable>, "id" | "email" | "display_name" | "created_at" | "updated_at" | "archived_at">): Account {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at
  };
}
