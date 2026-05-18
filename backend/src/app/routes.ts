import type { FastifyPluginAsync } from "fastify";

import type { DbClient } from "../db/transaction.js";
import { registerHealthRoutes } from "../modules/health/health.routes.js";
import { registerPlacesRoutes } from "../modules/places/places.routes.js";
import { registerPlantsRoutes } from "../modules/plants/plants.routes.js";
import { installAuth, type AuthPluginOptions } from "../shared/plugins/auth.js";
import { registerTestRoutes } from "./test-routes.js";

export type ApiRouteOptions = {
  enableTestRoutes?: boolean;
  auth?: AuthPluginOptions;
  db?: DbClient;
};

export const API_PREFIX = "/api/v1";

export const registerApiRoutes: FastifyPluginAsync<ApiRouteOptions> = async (app, options) => {
  if (options.auth !== undefined) {
    installAuth(app, options.auth);
  }

  await app.register(registerHealthRoutes, { prefix: "/health" });

  const businessRouteOptions = options.db === undefined ? {} : { db: options.db };
  await app.register(registerPlacesRoutes, { prefix: "/places", ...businessRouteOptions });
  await app.register(registerPlantsRoutes, { prefix: "/plants", ...businessRouteOptions });

  if (options.enableTestRoutes === true) {
    await app.register(registerTestRoutes, { prefix: "/__test" });
  }
};
