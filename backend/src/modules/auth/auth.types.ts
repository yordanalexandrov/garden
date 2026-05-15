export type UUID = string;

export type AuthProvider = "supabase" | "test";

export type AuthenticatedUserContext = {
  id: string;
  email: string | null;
};

export type AuthenticatedAccountContext = {
  id: UUID;
  email: string | null;
  displayName: string | null;
  archivedAt: Date | null;
};

export type AuthenticatedActor = {
  userId: string;
  accountId: UUID;
  user: AuthenticatedUserContext;
  account: AuthenticatedAccountContext;
  scopes: readonly string[];
  provider: AuthProvider;
};

export type CreateAuthenticatedActorInput = {
  userId: string;
  accountId: UUID;
  email?: string | null;
  scopes?: readonly string[];
  provider: AuthProvider;
};

export function createAuthenticatedActor(input: CreateAuthenticatedActorInput): AuthenticatedActor {
  const email = input.email ?? null;

  return {
    userId: input.userId,
    accountId: input.accountId,
    user: {
      id: input.userId,
      email
    },
    account: {
      id: input.accountId,
      email,
      displayName: null,
      archivedAt: null
    },
    scopes: input.scopes ?? [],
    provider: input.provider
  };
}
