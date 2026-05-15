import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedActor } from "./auth.types.js";

export type AuthPreHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

declare module "fastify" {
  interface FastifyRequest {
    actor?: AuthenticatedActor | null;
  }

  interface FastifyInstance {
    authenticate: AuthPreHandler;
  }
}

export function requireActor(request: FastifyRequest): AuthenticatedActor {
  if (request.actor === undefined || request.actor === null) {
    throw new AppError("UNAUTHORIZED", "Unauthorized");
  }

  return request.actor;
}

export function hasAuthDecorator(app: FastifyInstance): boolean {
  return app.hasDecorator("authenticate");
}
