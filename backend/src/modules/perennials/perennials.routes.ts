import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";

export type PerennialsRouteOptions = {
  db?: DbClient;
};

export const registerPlacePerennialsRoutes: FastifyPluginCallback<PerennialsRouteOptions> = (_app, _options, done) => {
  done();
};

export const registerPerennialsRoutes: FastifyPluginCallback<PerennialsRouteOptions> = (_app, _options, done) => {
  done();
};
