import Fastify, { type FastifyInstance } from "fastify";

import { loadConfig, type AppConfig } from "../config/config.js";
import { createLoggerOptions, type AppLoggerOptions } from "../config/logger.js";
import { registerErrorHandling } from "../shared/errors/fastify-error-handler.js";
import type { AuthPluginOptions } from "../shared/plugins/auth.js";
import { API_PREFIX, registerApiRoutes } from "./routes.js";

export type CreateAppOptions = {
  config?: AppConfig;
  logger?: AppLoggerOptions;
  enableTestRoutes?: boolean;
  auth?: AuthPluginOptions;
};

export async function createApp(options: CreateAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  const app = Fastify({
    logger: options.logger ?? createLoggerOptions(config)
  });

  registerErrorHandling(app);

  const routeOptions = {
    prefix: API_PREFIX,
    ...(options.enableTestRoutes === undefined ? {} : { enableTestRoutes: options.enableTestRoutes }),
    ...(options.auth === undefined ? {} : { auth: options.auth })
  };

  await app.register(registerApiRoutes, routeOptions);

  return app;
}
