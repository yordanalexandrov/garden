import type { FastifyPluginAsync } from "fastify";

import { registerHealthRoutes } from "../modules/health/health.routes.js";
import { registerTestRoutes } from "./test-routes.js";

export type ApiRouteOptions = {
  enableTestRoutes?: boolean;
};

export const API_PREFIX = "/api/v1";

export const registerApiRoutes: FastifyPluginAsync<ApiRouteOptions> = async (app, options) => {
  await app.register(registerHealthRoutes, { prefix: "/health" });

  if (options.enableTestRoutes === true) {
    await app.register(registerTestRoutes, { prefix: "/__test" });
  }
};
