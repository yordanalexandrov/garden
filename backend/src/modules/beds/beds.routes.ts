import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";

export type BedsRouteOptions = {
  db?: DbClient;
};

export const registerPlaceBedsRoutes: FastifyPluginCallback<BedsRouteOptions> = (_app, _options, done) => {
  done();
};

export const registerBedsRoutes: FastifyPluginCallback<BedsRouteOptions> = (_app, _options, done) => {
  done();
};
