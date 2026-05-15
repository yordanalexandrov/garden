import { createApp } from "./app/create-app.js";
import { loadConfig } from "./config/config.js";
import { safeConfigForLogging } from "./config/logger.js";

async function start(): Promise<void> {
  const config = loadConfig();
  const app = await createApp({ config });

  try {
    app.log.info({ config: safeConfigForLogging(config) }, "Starting Gardening Helper API");
    await app.listen({ host: config.host, port: config.port });
  } catch (error) {
    app.log.error({ err: error }, "Failed to start Gardening Helper API");
    process.exit(1);
  }
}

void start();
