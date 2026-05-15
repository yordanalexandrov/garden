import type { AuthPort } from "./auth.port.js";
import { createAuthenticatedActor, type AuthenticatedActor, type UUID } from "./auth.types.js";
import { unauthorizedError } from "./bearer-token.js";

export const TestAuthTokens = {
  accountA: "test-token-account-a",
  accountB: "test-token-account-b",
  archivedAccount: "test-token-archived-account",
  unknownAccount: "test-token-unknown-account",
  expired: "test-token-expired",
  invalid: "test-token-invalid"
} as const;

export const TestAuthIds = {
  accountA: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  accountB: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  archivedAccount: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  unknownAccount: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  userA: "11111111-1111-1111-1111-111111111111",
  userB: "22222222-2222-2222-2222-222222222222",
  archivedUser: "33333333-3333-3333-3333-333333333333",
  unknownUser: "44444444-4444-4444-4444-444444444444"
} as const;

export type TestAuthAdapterOptions = {
  actorsByToken?: ReadonlyMap<string, AuthenticatedActor>;
};

export class TestAuthAdapter implements AuthPort {
  readonly #actorsByToken: ReadonlyMap<string, AuthenticatedActor>;

  constructor(options: TestAuthAdapterOptions = {}) {
    this.#actorsByToken = options.actorsByToken ?? defaultTestActorsByToken();
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedActor> {
    await Promise.resolve();

    const actor = this.#actorsByToken.get(token);

    if (actor === undefined) {
      throw unauthorizedError();
    }

    return actor;
  }
}

export function createTestActor(input: {
  userId: string;
  accountId: UUID;
  email: string;
  scopes?: readonly string[];
}): AuthenticatedActor {
  return createAuthenticatedActor({
    userId: input.userId,
    accountId: input.accountId,
    email: input.email,
    ...(input.scopes === undefined ? {} : { scopes: input.scopes }),
    provider: "test"
  });
}

function defaultTestActorsByToken(): ReadonlyMap<string, AuthenticatedActor> {
  return new Map<string, AuthenticatedActor>([
    [
      TestAuthTokens.accountA,
      createTestActor({
        userId: TestAuthIds.userA,
        accountId: TestAuthIds.accountA,
        email: "account-a@example.com",
        scopes: ["authenticated"]
      })
    ],
    [
      TestAuthTokens.accountB,
      createTestActor({
        userId: TestAuthIds.userB,
        accountId: TestAuthIds.accountB,
        email: "account-b@example.com",
        scopes: ["authenticated"]
      })
    ],
    [
      TestAuthTokens.archivedAccount,
      createTestActor({
        userId: TestAuthIds.archivedUser,
        accountId: TestAuthIds.archivedAccount,
        email: "archived@example.com",
        scopes: ["authenticated"]
      })
    ],
    [
      TestAuthTokens.unknownAccount,
      createTestActor({
        userId: TestAuthIds.unknownUser,
        accountId: TestAuthIds.unknownAccount,
        email: "unknown@example.com",
        scopes: ["authenticated"]
      })
    ]
  ]);
}
