import type { FastifyPluginAsync } from "fastify";

import { registerHealthRoutes } from "../modules/health/health.routes.js";
import { installAuth, type AuthPluginOptions } from "../shared/plugins/auth.js";
import { registerTestRoutes } from "./test-routes.js";

export type ApiRouteOptions = {
  enableTestRoutes?: boolean;
  auth?: AuthPluginOptions;
};

export const API_PREFIX = "/api/v1";

export const registerApiRoutes: FastifyPluginAsync<ApiRouteOptions> = async (app, options) => {
  if (options.auth !== undefined) {
    installAuth(app, options.auth);
  }

  await app.register(registerHealthRoutes, { prefix: "/health" });

  if (options.enableTestRoutes === true) {
    await app.register(registerTestRoutes, { prefix: "/__test" });
  }
};
