import { createApp } from "./app/create-app.js";
import { loadConfig } from "./config/config.js";
import { safeConfigForLogging } from "./config/logger.js";
import { createDbClient } from "./db/db.js";
import { createSupabaseAuthAdapterFromConfig } from "./integrations/auth/auth-adapter.factory.js";
import { KyselyAccountsRepository } from "./modules/accounts/accounts.repository.js";

async function start(): Promise<void> {
  const config = loadConfig();
  const authPort = createSupabaseAuthAdapterFromConfig(config);
  const db = createDbClient(config);
  const app = await createApp({
    config,
    db,
    auth: {
      authPort,
      accountsRepository: new KyselyAccountsRepository(db)
    }
  });

  try {
    app.log.info({ config: safeConfigForLogging(config) }, "Starting Gardening Helper API");
    await app.listen({ host: config.host, port: config.port });
  } catch (error) {
    app.log.error({ err: error }, "Failed to start Gardening Helper API");
    await app.close();
    process.exit(1);
  }
}

void start();
