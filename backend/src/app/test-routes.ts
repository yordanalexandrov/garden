import type { FastifyPluginCallback } from "fastify";
import { z } from "zod";

import { successEnvelope } from "../shared/api/envelope.js";
import { AppError } from "../shared/errors/app-error.js";
import { validateRequest } from "../shared/validation/request-validation.js";

const validationFixtureSchemas = {
  params: z.object({
    id: z.string().uuid()
  }),
  query: z.object({
    mode: z.enum(["preview", "commit"])
  }),
  body: z.object({
    name: z.string().min(2)
  })
};

export const registerTestRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post("/validation/:id", (request) => {
    const validated = validateRequest(request, validationFixtureSchemas);
    return successEnvelope(validated);
  });

  app.get("/app-error", () => {
    throw new AppError("CONFLICT", "Conflict from test fixture", {
      reason: "fixture"
    });
  });

  app.get("/unexpected-error", () => {
    throw new Error("raw unexpected fixture error should not leak");
  });

  done();
};
