import type { FastifyPluginAsync } from "fastify";

import type { DbClient } from "../db/transaction.js";
import { registerBedsRoutes, registerPlaceBedsRoutes } from "../modules/beds/beds.routes.js";
import { registerHealthRoutes } from "../modules/health/health.routes.js";
import { registerBedPersistentPlantsRoutes, registerPersistentBedPlantsRoutes } from "../modules/plantings/persistent-bed-plants.routes.js";
import { registerBedPlantingsRoutes, registerYearlyBedPlantingsRoutes } from "../modules/plantings/yearly-bed-plantings.routes.js";
import { registerPerennialsRoutes, registerPlacePerennialsRoutes } from "../modules/perennials/perennials.routes.js";
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
  await app.register(registerPlacePerennialsRoutes, { prefix: "/places/:placeId/perennials", ...businessRouteOptions });
  await app.register(registerPerennialsRoutes, { prefix: "/perennials", ...businessRouteOptions });
  await app.register(registerPlaceBedsRoutes, { prefix: "/places/:placeId/beds", ...businessRouteOptions });
  await app.register(registerBedsRoutes, { prefix: "/beds", ...businessRouteOptions });
  await app.register(registerBedPersistentPlantsRoutes, { prefix: "/beds/:bedId/persistent-plants", ...businessRouteOptions });
  await app.register(registerPersistentBedPlantsRoutes, { prefix: "/persistent-bed-plants", ...businessRouteOptions });
  await app.register(registerBedPlantingsRoutes, { prefix: "/beds/:bedId/plantings", ...businessRouteOptions });
  await app.register(registerYearlyBedPlantingsRoutes, { prefix: "/plantings", ...businessRouteOptions });

  if (options.enableTestRoutes === true) {
    await app.register(registerTestRoutes, { prefix: "/__test" });
  }
};
