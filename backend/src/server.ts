import type { FastifyInstance } from "fastify";

import { createApp } from "./app/create-app.js";
import { loadConfig } from "./config/config.js";
import { safeConfigForLogging } from "./config/logger.js";
import { createDbClient } from "./db/db.js";
import type { DbClient } from "./db/transaction.js";
import { createSupabaseAuthAdapterFromConfig } from "./integrations/auth/auth-adapter.factory.js";
import { KyselyAccountsRepository } from "./modules/accounts/accounts.repository.js";

async function start(): Promise<void> {
  let app: FastifyInstance | undefined;
  let db: DbClient | undefined;

  try {
    const config = loadConfig();
    const authPort = createSupabaseAuthAdapterFromConfig(config);
    db = createDbClient(config);
    app = await createApp({
      config,
      db,
      auth: {
        authPort,
        accountsRepository: new KyselyAccountsRepository(db)
      }
    });

    app.log.info({ config: safeConfigForLogging(config) }, "Starting Gardening Helper API");
    await app.listen({ host: config.host, port: config.port });
  } catch (error) {
    await handleStartupFailure(error, app, db);
    process.exit(1);
  }
}

async function handleStartupFailure(error: unknown, app: FastifyInstance | undefined, db: DbClient | undefined): Promise<void> {
  if (app !== undefined) {
    app.log.error({ err: error }, "Failed to start Gardening Helper API");

    try {
      await app.close();
    } catch (closeError) {
      app.log.error({ err: closeError }, "Failed to close Gardening Helper API after startup failure");
    }

    return;
  }

  console.error("Failed to start Gardening Helper API", error);

  if (db !== undefined) {
    try {
      await db.destroy();
    } catch (destroyError) {
      console.error("Failed to destroy database client after startup failure", destroyError);
    }
  }
}

void start();
