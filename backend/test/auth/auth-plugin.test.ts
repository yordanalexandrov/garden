import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import type { AccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { Account } from "../../src/modules/accounts/accounts.types.js";
import { TestAuthAdapter, TestAuthIds, TestAuthTokens } from "../../src/modules/auth/test-auth.adapter.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders, accountBAuthHeaders, authorizationHeader, invalidAuthHeaders } from "../helpers/auth.js";

const accountA = createAccount(TestAuthIds.accountA, "account-a@example.com", "Account A");
const accountB = createAccount(TestAuthIds.accountB, "account-b@example.com", "Account B");
const archivedAccount = createAccount(TestAuthIds.archivedAccount, "archived@example.com", "Archived", new Date());

describe("Fastify auth plugin", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("keeps health accessible without Authorization", async () => {
    app = await createAuthenticatedTestApp([accountA, accountB]);

    const response = await app.inject({ method: "GET", url: "/api/v1/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        status: "ok"
      }
    });
  });

  it("returns a canonical UNAUTHORIZED envelope when the protected route has no token", async () => {
    app = await createAuthenticatedTestApp([accountA, accountB]);

    const response = await app.inject({ method: "GET", url: "/api/v1/__test/protected-auth" });

    expectUnauthorizedResponse(response);
  });

  it("returns a canonical UNAUTHORIZED envelope for malformed bearer headers", async () => {
    app = await createAuthenticatedTestApp([accountA, accountB]);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/__test/protected-auth",
      headers: authorizationHeader("token with spaces")
    });

    expectUnauthorizedResponse(response);
  });

  it("returns a canonical UNAUTHORIZED envelope for invalid tokens", async () => {
    app = await createAuthenticatedTestApp([accountA, accountB]);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/__test/protected-auth",
      headers: invalidAuthHeaders()
    });

    expectUnauthorizedResponse(response);
  });

  it("exposes account A actor context to protected handlers", async () => {
    app = await createAuthenticatedTestApp([accountA, accountB]);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/__test/protected-auth",
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        userId: TestAuthIds.userA,
        accountId: TestAuthIds.accountA,
        accountEmail: "account-a@example.com",
        provider: "test",
        scopes: ["authenticated"]
      }
    });
  });

  it("exposes account B actor context to protected handlers", async () => {
    app = await createAuthenticatedTestApp([accountA, accountB]);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/__test/protected-auth",
      headers: accountBAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        userId: TestAuthIds.userB,
        accountId: TestAuthIds.accountB,
        accountEmail: "account-b@example.com"
      }
    });
  });

  it("maps missing or archived account lookup to UNAUTHORIZED", async () => {
    app = await createAuthenticatedTestApp([accountA, accountB, archivedAccount]);

    const unknownAccountResponse = await app.inject({
      method: "GET",
      url: "/api/v1/__test/protected-auth",
      headers: authorizationHeader(TestAuthTokens.unknownAccount)
    });
    const archivedAccountResponse = await app.inject({
      method: "GET",
      url: "/api/v1/__test/protected-auth",
      headers: authorizationHeader(TestAuthTokens.archivedAccount)
    });

    expectUnauthorizedResponse(unknownAccountResponse);
    expectUnauthorizedResponse(archivedAccountResponse);
  });
});

async function createAuthenticatedTestApp(accounts: readonly Account[]): Promise<FastifyInstance> {
  return createTestApp({
    enableTestRoutes: true,
    auth: {
      authPort: new TestAuthAdapter(),
      accountsRepository: new InMemoryAccountsRepository(accounts)
    }
  });
}

class InMemoryAccountsRepository implements AccountsRepository {
  readonly #accountsById: Map<string, Account>;

  constructor(accounts: readonly Account[]) {
    this.#accountsById = new Map(accounts.map((account) => [account.id, account]));
  }

  findById(accountId: string): Promise<Account | null> {
    const account = this.#accountsById.get(accountId);

    if (account === undefined || account.archivedAt !== null) {
      return Promise.resolve(null);
    }

    return Promise.resolve(account);
  }
}

function createAccount(id: string, email: string, displayName: string, archivedAt: Date | null = null): Account {
  const createdAt = new Date("2026-05-16T00:00:00.000Z");

  return {
    id,
    email,
    displayName,
    createdAt,
    updatedAt: createdAt,
    archivedAt
  };
}

function expectUnauthorizedResponse(response: { statusCode: number; json: () => unknown }): void {
  expect(response.statusCode).toBe(401);
  expect(response.json()).toEqual({
    error: {
      code: "UNAUTHORIZED",
      message: "Unauthorized",
      details: {}
    }
  });
}
