import type { FastifyPluginCallback } from "fastify";

import { successEnvelope } from "../../shared/api/envelope.js";

export type HealthResponse = {
  status: "ok";
  timestamp: string;
};

export const registerHealthRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/", () =>
    successEnvelope<HealthResponse>({
      status: "ok",
      timestamp: new Date().toISOString()
    })
  );

  done();
};
