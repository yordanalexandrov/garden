import type { FastifyInstance } from "fastify";

import type { AccountsRepository } from "../../modules/accounts/accounts.repository.js";
import type { Account } from "../../modules/accounts/accounts.types.js";
import type { AuthPort } from "../../modules/auth/auth.port.js";
import type { AuthenticatedActor } from "../../modules/auth/auth.types.js";
import { parseBearerToken, unauthorizedError } from "../../modules/auth/bearer-token.js";
import type { AuthPreHandler } from "../../modules/auth/request-actor.js";

export type AuthPluginOptions = {
  authPort: AuthPort;
  accountsRepository: AccountsRepository;
};

export function installAuth(app: FastifyInstance, options: AuthPluginOptions): void {
  if (!app.hasRequestDecorator("actor")) {
    app.decorateRequest("actor", null);
  }

  if (!app.hasDecorator("authenticate")) {
    const authenticate: AuthPreHandler = async (request) => {
      const token = parseBearerToken(request.headers.authorization);
      const actor = await options.authPort.verifyAccessToken(token);
      const activeAccount = await options.accountsRepository.findById(actor.accountId);

      // Missing or archived application accounts cannot form authenticated context.
      if (activeAccount === null) {
        throw unauthorizedError();
      }

      request.actor = withActiveAccount(actor, activeAccount);
    };

    app.decorate("authenticate", authenticate);
  }
}

function withActiveAccount(actor: AuthenticatedActor, account: Account): AuthenticatedActor {
  return {
    ...actor,
    accountId: account.id,
    account: {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      archivedAt: account.archivedAt
    }
  };
}
