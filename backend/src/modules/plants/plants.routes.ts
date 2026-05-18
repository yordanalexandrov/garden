import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";

export type PlantsRouteOptions = {
  db?: DbClient;
};

export const registerPlantsRoutes: FastifyPluginCallback<PlantsRouteOptions> = (_app, _options, done) => {
  done();
};
