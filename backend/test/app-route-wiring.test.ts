import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import type { AccountsRepository } from "../src/modules/accounts/accounts.repository.js";
import type { Account } from "../src/modules/accounts/accounts.types.js";
import type { AuthPort } from "../src/modules/auth/auth.port.js";
import { createAuthenticatedActor, type AuthenticatedActor } from "../src/modules/auth/auth.types.js";
import type { DbClient, DbTransaction } from "../src/db/transaction.js";
import { createTestApp } from "./helpers/app.js";

const account: Account = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  email: "account-a@example.com",
  displayName: "Account A",
  createdAt: new Date("2026-05-18T00:00:00.000Z"),
  updatedAt: new Date("2026-05-18T00:00:00.000Z"),
  archivedAt: null
};

describe("business route dependency wiring", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("keeps health unauthenticated when auth and db dependencies are installed", async () => {
    const db = new RecordingDbClient();
    app = await createTestApp({
      db,
      auth: {
        authPort: new StaticAuthPort(),
        accountsRepository: new StaticAccountsRepository(account)
      }
    });

    const response = await app.inject({ method: "GET", url: "/api/v1/health" });

    expect(response.statusCode).toBe(200);
    expect(db.healthCheckCalls).toBe(0);
    expect(db.transactionCalls).toBe(0);
  });

  it("registers places, plants, and products as protected business routes", async () => {
    app = await createTestApp({ db: new RecordingDbClient() });

    const placesResponse = await app.inject({ method: "GET", url: "/api/v1/places" });
    const plantsResponse = await app.inject({ method: "GET", url: "/api/v1/plants" });
    const productsResponse = await app.inject({ method: "GET", url: "/api/v1/products" });

    expect(placesResponse.statusCode).toBe(401);
    expect(plantsResponse.statusCode).toBe(401);
    expect(productsResponse.statusCode).toBe(401);
  });

  it("destroys the injected db client when the app closes", async () => {
    const db = new RecordingDbClient();
    app = await createTestApp({ db });

    await app.close();
    app = undefined;

    expect(db.destroyed).toBe(true);
  });

  it("keeps app close best-effort when db destroy fails", async () => {
    const db = new RecordingDbClient({ failDestroy: true });
    app = await createTestApp({ db });

    await expect(app.close()).resolves.toBeUndefined();
    app = undefined;

    expect(db.destroyed).toBe(true);
  });
});

class StaticAuthPort implements AuthPort {
  verifyAccessToken(): Promise<AuthenticatedActor> {
    return Promise.resolve(
      createAuthenticatedActor({
        userId: "user-a",
        accountId: account.id,
        email: account.email,
        scopes: ["authenticated"],
        provider: "test"
      })
    );
  }
}

class StaticAccountsRepository implements AccountsRepository {
  constructor(private readonly account: Account) {}

  findById(): Promise<Account | null> {
    return Promise.resolve(this.account);
  }
}

class RecordingDbClient implements DbClient {
  readonly db = {} as DbClient["db"];
  healthCheckCalls = 0;
  transactionCalls = 0;
  destroyed = false;

  constructor(private readonly options: { failDestroy?: boolean } = {}) {}

  transaction<T>(fn: (trx: DbTransaction) => Promise<T>): Promise<T> {
    void fn;
    this.transactionCalls += 1;
    return Promise.reject(new Error("RecordingDbClient does not execute transactions"));
  }

  healthCheck(): Promise<boolean> {
    this.healthCheckCalls += 1;
    return Promise.resolve(true);
  }

  destroy(): Promise<void> {
    this.destroyed = true;

    if (this.options.failDestroy === true) {
      return Promise.reject(new Error("RecordingDbClient destroy failure"));
    }

    return Promise.resolve();
  }
}
