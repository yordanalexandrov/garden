import { z } from "zod";

const VALID_NODE_ENV_VALUES = ["development", "test", "production"] as const;

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const optionalString = z.preprocess(emptyStringToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(emptyStringToUndefined, z.string().url().optional());
const optionalInteger = z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(VALID_NODE_ENV_VALUES).default("development"),
  PORT: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).max(65535).default(3000)),
  APP_BASE_URL: optionalUrl,
  API_BASE_URL: optionalUrl,
  FRONTEND_URL: optionalUrl,
  DATABASE_URL: optionalString,
  POSTGRES_HOST: optionalString,
  POSTGRES_PORT: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).max(65535).optional()),
  POSTGRES_DB: optionalString,
  POSTGRES_USER: optionalString,
  POSTGRES_PASSWORD: optionalString,
  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SUPABASE_JWT_SECRET: optionalString,
  SUPABASE_AUTH_EXTERNAL_URL: optionalUrl,
  SUPABASE_AUTH_SITE_URL: optionalUrl,
  SUPABASE_STORAGE_URL: optionalUrl,
  SUPABASE_STORAGE_BUCKET_PROBLEM_PHOTOS: optionalString,
  WEATHER_PROVIDER: z.preprocess(emptyStringToUndefined, z.enum(["open-meteo"]).optional()),
  OPEN_METEO_BASE_URL: optionalUrl,
  VAPID_PUBLIC_KEY: optionalString,
  VAPID_PRIVATE_KEY: optionalString,
  VAPID_SUBJECT: optionalString,
  AI_PROVIDER: optionalString,
  AI_API_KEY: optionalString,
  AI_MODEL: optionalString,
  WORKER_ENABLED: z.preprocess(
    emptyStringToUndefined,
    z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional()
  ),
  REMINDER_JOB_INTERVAL_SECONDS: optionalInteger,
  WEATHER_JOB_INTERVAL_SECONDS: optionalInteger,
  SUPABASE_STUDIO_USERNAME: optionalString,
  SUPABASE_STUDIO_PASSWORD: optionalString
});

type ParsedEnv = z.infer<typeof envSchema>;

export class ConfigError extends Error {
  readonly details: Record<string, string[]>;

  constructor(details: Record<string, string[]>) {
    super("Invalid backend configuration");
    this.name = "ConfigError";
    this.details = details;
  }
}

export type BackendOnlyConfig = {
  databaseUrl: string | undefined;
  postgresHost: string | undefined;
  postgresPort: number | undefined;
  postgresDb: string | undefined;
  postgresUser: string | undefined;
  postgresPassword: string | undefined;
  supabaseServiceRoleKey: string | undefined;
  supabaseJwtSecret: string | undefined;
  vapidPrivateKey: string | undefined;
  aiApiKey: string | undefined;
  supabaseStudioUsername: string | undefined;
  supabaseStudioPassword: string | undefined;
};

export type FrontendSafeConfig = {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
  vapidPublicKey: string | undefined;
};

export type IntegrationConfig = {
  supabaseAuthExternalUrl: string | undefined;
  supabaseAuthSiteUrl: string | undefined;
  supabaseStorageUrl: string | undefined;
  supabaseStorageBucketProblemPhotos: string | undefined;
  weatherProvider: "open-meteo" | undefined;
  openMeteoBaseUrl: string | undefined;
  vapidSubject: string | undefined;
  aiProvider: string | undefined;
  aiModel: string | undefined;
  workerEnabled: boolean | undefined;
  reminderJobIntervalSeconds: number | undefined;
  weatherJobIntervalSeconds: number | undefined;
};

export type AppConfig = {
  nodeEnv: ParsedEnv["NODE_ENV"];
  port: number;
  host: "0.0.0.0";
  appBaseUrl: string | undefined;
  apiBaseUrl: string | undefined;
  frontendUrl: string | undefined;
  backendOnly: BackendOnlyConfig;
  frontendSafe: FrontendSafeConfig;
  integrations: IntegrationConfig;
};

function zodErrorDetails(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.map((part) => String(part)).join(".") || "env";
    details[field] ??= [];
    details[field].push(issue.message);
  }

  return details;
}

function toAppConfig(env: ParsedEnv): AppConfig {
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    host: "0.0.0.0",
    appBaseUrl: env.APP_BASE_URL,
    apiBaseUrl: env.API_BASE_URL,
    frontendUrl: env.FRONTEND_URL,
    backendOnly: {
      databaseUrl: env.DATABASE_URL,
      postgresHost: env.POSTGRES_HOST,
      postgresPort: env.POSTGRES_PORT,
      postgresDb: env.POSTGRES_DB,
      postgresUser: env.POSTGRES_USER,
      postgresPassword: env.POSTGRES_PASSWORD,
      supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseJwtSecret: env.SUPABASE_JWT_SECRET,
      vapidPrivateKey: env.VAPID_PRIVATE_KEY,
      aiApiKey: env.AI_API_KEY,
      supabaseStudioUsername: env.SUPABASE_STUDIO_USERNAME,
      supabaseStudioPassword: env.SUPABASE_STUDIO_PASSWORD
    },
    frontendSafe: {
      supabaseUrl: env.SUPABASE_URL,
      supabaseAnonKey: env.SUPABASE_ANON_KEY,
      vapidPublicKey: env.VAPID_PUBLIC_KEY
    },
    integrations: {
      supabaseAuthExternalUrl: env.SUPABASE_AUTH_EXTERNAL_URL,
      supabaseAuthSiteUrl: env.SUPABASE_AUTH_SITE_URL,
      supabaseStorageUrl: env.SUPABASE_STORAGE_URL,
      supabaseStorageBucketProblemPhotos: env.SUPABASE_STORAGE_BUCKET_PROBLEM_PHOTOS,
      weatherProvider: env.WEATHER_PROVIDER,
      openMeteoBaseUrl: env.OPEN_METEO_BASE_URL,
      vapidSubject: env.VAPID_SUBJECT,
      aiProvider: env.AI_PROVIDER,
      aiModel: env.AI_MODEL,
      workerEnabled: env.WORKER_ENABLED,
      reminderJobIntervalSeconds: env.REMINDER_JOB_INTERVAL_SECONDS,
      weatherJobIntervalSeconds: env.WEATHER_JOB_INTERVAL_SECONDS
    }
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    throw new ConfigError(zodErrorDetails(parsed.error));
  }

  return toAppConfig(parsed.data);
}
