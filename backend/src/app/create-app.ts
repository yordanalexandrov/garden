import Fastify, { type FastifyInstance } from "fastify";

import { loadConfig, type AppConfig } from "../config/config.js";
import { createLoggerOptions, type AppLoggerOptions } from "../config/logger.js";
import type { DbClient } from "../db/transaction.js";
import type { WeatherPort } from "../integrations/weather/weather.port.js";
import type { AiPort } from "../integrations/ai/ai.port.js";
import type { StoragePort } from "../modules/files/storage.port.js";
import { registerErrorHandling } from "../shared/errors/fastify-error-handler.js";
import type { AuthPluginOptions } from "../shared/plugins/auth.js";
import { API_PREFIX, registerApiRoutes } from "./routes.js";

export type CreateAppOptions = {
  config?: AppConfig;
  logger?: AppLoggerOptions;
  enableTestRoutes?: boolean;
  auth?: AuthPluginOptions;
  db?: DbClient;
  storage?: StoragePort;
  weather?: WeatherPort;
  ai?: AiPort;
};

export async function createApp(options: CreateAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  const app = Fastify({
    logger: options.logger ?? createLoggerOptions(config)
  });

  registerErrorHandling(app);

  const db = options.db;

  if (db !== undefined) {
    app.addHook("onClose", async (instance) => {
      try {
        await db.destroy();
      } catch (error) {
        instance.log.error({ err: error }, "Failed to destroy database client during app close");
      }
    });
  }

  const routeOptions = {
    prefix: API_PREFIX,
    ...(options.enableTestRoutes === undefined ? {} : { enableTestRoutes: options.enableTestRoutes }),
    ...(options.auth === undefined ? {} : { auth: options.auth }),
    ...(db === undefined ? {} : { db }),
    config,
    ...(options.storage === undefined ? {} : { storage: options.storage }),
    ...(options.weather === undefined ? {} : { weather: options.weather }),
    ...(options.ai === undefined ? {} : { ai: options.ai })
  };

  await app.register(registerApiRoutes, routeOptions);

  return app;
}
