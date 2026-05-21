import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";

export type YearlyBedPlantingsRouteOptions = {
  db?: DbClient;
};

export const registerBedPlantingsRoutes: FastifyPluginCallback<YearlyBedPlantingsRouteOptions> = (
  _app,
  _options,
  done
) => {
  done();
};

export const registerYearlyBedPlantingsRoutes: FastifyPluginCallback<YearlyBedPlantingsRouteOptions> = (
  _app,
  _options,
  done
) => {
  done();
};
