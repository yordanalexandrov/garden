import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";

export type PlacesRouteOptions = {
  db?: DbClient;
};

export const registerPlacesRoutes: FastifyPluginCallback<PlacesRouteOptions> = (_app, _options, done) => {
  done();
};
