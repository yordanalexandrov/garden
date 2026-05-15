import type { FastifyInstance } from "fastify";

import { createApp, type CreateAppOptions } from "../../src/app/create-app.js";
import { loadConfig } from "../../src/config/config.js";

export async function createTestApp(options: CreateAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig({ NODE_ENV: "test" });

  return createApp({
    ...options,
    config,
    logger: false
  });
}
