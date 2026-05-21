import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";

export type PersistentBedPlantsRouteOptions = {
  db?: DbClient;
};

export const registerBedPersistentPlantsRoutes: FastifyPluginCallback<PersistentBedPlantsRouteOptions> = (
  _app,
  _options,
  done
) => {
  done();
};

export const registerPersistentBedPlantsRoutes: FastifyPluginCallback<PersistentBedPlantsRouteOptions> = (
  _app,
  _options,
  done
) => {
  done();
};
