import { ConfigError, type AppConfig } from "../../config/config.js";
import type { AuthPort } from "../../modules/auth/auth.port.js";
import { SupabaseAuthAdapter } from "./supabase-auth.adapter.js";

export function createSupabaseAuthAdapterFromConfig(config: AppConfig): AuthPort {
  if (config.backendOnly.supabaseJwtSecret === undefined) {
    throw new ConfigError({
      SUPABASE_JWT_SECRET: ["Required to create the Supabase Auth adapter"]
    });
  }

  return new SupabaseAuthAdapter({
    jwtSecret: config.backendOnly.supabaseJwtSecret,
    ...(config.integrations.supabaseAuthExternalUrl === undefined
      ? {}
      : { expectedIssuer: config.integrations.supabaseAuthExternalUrl })
  });
}
