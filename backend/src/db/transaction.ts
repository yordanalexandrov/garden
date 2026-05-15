import { sql, type Kysely, type Transaction } from "kysely";

import type { Database } from "./database.types.js";

export type DbQueryExecutor = Kysely<Database> | Transaction<Database>;

export interface DbHandle {
  readonly db: DbQueryExecutor;
}

export interface DbTransaction extends DbHandle {
  readonly isTransaction: true;
}

export interface DbClient extends DbHandle {
  transaction<T>(fn: (trx: DbTransaction) => Promise<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
  destroy(): Promise<void>;
}

export class KyselyDbTransaction implements DbTransaction {
  readonly isTransaction = true;

  constructor(readonly db: Transaction<Database>) {}
}

export class KyselyDbClient implements DbClient {
  #destroyed = false;

  constructor(readonly db: Kysely<Database>) {}

  async transaction<T>(fn: (trx: DbTransaction) => Promise<T>): Promise<T> {
    this.assertOpen();

    return this.db.transaction().execute((trx) => fn(new KyselyDbTransaction(trx)));
  }

  async healthCheck(): Promise<boolean> {
    this.assertOpen();
    await sql`select 1`.execute(this.db);
    return true;
  }

  async destroy(): Promise<void> {
    if (this.#destroyed) {
      return;
    }

    this.#destroyed = true;
    await this.db.destroy();
  }

  private assertOpen(): void {
    if (this.#destroyed) {
      throw new Error("Database client has been destroyed");
    }
  }
}
