import type { LoggerOptions } from "pino";

import type { AppConfig } from "./config.js";

const REDACTED = "[REDACTED]";

const SECRET_KEY_PATTERN =
  /(^|_)(PASSWORD|SECRET|PRIVATE_KEY|SERVICE_ROLE_KEY|JWT_SECRET|API_KEY|DATABASE_URL)(_|$)/i;

export const LOG_REDACTION_PATHS = [
  "req.headers.authorization",
  "request.headers.authorization",
  "headers.authorization",
  "authorization",
  "*.authorization",
  "DATABASE_URL",
  "POSTGRES_PASSWORD",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",
  "VAPID_PRIVATE_KEY",
  "AI_API_KEY",
  "SUPABASE_STUDIO_PASSWORD",
  "backendOnly.databaseUrl",
  "backendOnly.postgresPassword",
  "backendOnly.supabaseServiceRoleKey",
  "backendOnly.supabaseJwtSecret",
  "backendOnly.vapidPrivateKey",
  "backendOnly.aiApiKey",
  "backendOnly.supabaseStudioPassword"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSecretKey(key: string): boolean {
  return SECRET_KEY_PATTERN.test(key);
}

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  const redacted: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    redacted[key] = isSecretKey(key) ? REDACTED : redactSecrets(nestedValue);
  }

  return redacted;
}

export function safeConfigForLogging(config: AppConfig): Record<string, unknown> {
  return {
    nodeEnv: config.nodeEnv,
    port: config.port,
    host: config.host,
    appBaseUrl: config.appBaseUrl,
    apiBaseUrl: config.apiBaseUrl,
    frontendUrl: config.frontendUrl,
    integrations: {
      weatherProvider: config.integrations.weatherProvider,
      workerEnabled: config.integrations.workerEnabled,
      reminderJobIntervalSeconds: config.integrations.reminderJobIntervalSeconds,
      weatherJobIntervalSeconds: config.integrations.weatherJobIntervalSeconds
    }
  };
}

export type AppLoggerOptions = boolean | LoggerOptions;

export function createLoggerOptions(config: AppConfig): AppLoggerOptions {
  if (config.nodeEnv === "test") {
    return false;
  }

  return {
    level: config.nodeEnv === "production" ? "info" : "debug",
    redact: {
      paths: [...LOG_REDACTION_PATHS],
      censor: REDACTED
    }
  };
}
