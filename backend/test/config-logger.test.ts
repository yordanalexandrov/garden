import { describe, expect, it } from "vitest";

import { ConfigError, loadConfig } from "../src/config/config.js";
import { LOG_REDACTION_PATHS, redactSecrets, safeConfigForLogging } from "../src/config/logger.js";

describe("backend config loading", () => {
  it("loads in test mode without database or provider secrets", () => {
    const config = loadConfig({ NODE_ENV: "test" });

    expect(config.nodeEnv).toBe("test");
    expect(config.port).toBe(3000);
    expect(config.backendOnly.databaseUrl).toBeUndefined();
    expect(config.backendOnly.supabaseServiceRoleKey).toBeUndefined();
    expect(config.backendOnly.aiApiKey).toBeUndefined();
  });

  it("loads valid backend-only database settings without exposing them as frontend-safe config", () => {
    const config = loadConfig({
      NODE_ENV: "test",
      DATABASE_URL: "postgres://garden_user:secret@localhost:5432/garden_test",
      POSTGRES_HOST: "localhost",
      POSTGRES_PORT: "5432",
      POSTGRES_DB: "garden_test",
      POSTGRES_USER: "garden_user",
      POSTGRES_PASSWORD: "secret"
    });

    expect(config.backendOnly.databaseUrl).toBe("postgres://garden_user:secret@localhost:5432/garden_test");
    expect(config.backendOnly.postgresHost).toBe("localhost");
    expect(config.backendOnly.postgresPort).toBe(5432);
    expect(config.backendOnly.postgresDb).toBe("garden_test");
    expect(config.backendOnly.postgresUser).toBe("garden_user");
    expect(config.backendOnly.postgresPassword).toBe("secret");
    expect(JSON.stringify(config.frontendSafe)).not.toContain("garden_user");
    expect(JSON.stringify(config.frontendSafe)).not.toContain("secret");
    expect(JSON.stringify(config.frontendSafe)).not.toContain("garden_test");
  });

  it("parses empty optional database settings as undefined", () => {
    const config = loadConfig({
      NODE_ENV: "test",
      DATABASE_URL: "",
      POSTGRES_HOST: " ",
      POSTGRES_PORT: "",
      POSTGRES_DB: "",
      POSTGRES_USER: "",
      POSTGRES_PASSWORD: ""
    });

    expect(config.backendOnly.databaseUrl).toBeUndefined();
    expect(config.backendOnly.postgresHost).toBeUndefined();
    expect(config.backendOnly.postgresPort).toBeUndefined();
    expect(config.backendOnly.postgresDb).toBeUndefined();
    expect(config.backendOnly.postgresUser).toBeUndefined();
    expect(config.backendOnly.postgresPassword).toBeUndefined();
  });

  it("rejects invalid NODE_ENV values", () => {
    expect(() => loadConfig({ NODE_ENV: "local" })).toThrow(ConfigError);
  });

  it("rejects invalid numeric config values", () => {
    expect(() => loadConfig({ NODE_ENV: "test", PORT: "not-a-port" })).toThrow(ConfigError);
  });

  it("loads backend weather provider settings without exposing them as frontend-safe config", () => {
    const config = loadConfig({
      NODE_ENV: "test",
      WEATHER_PROVIDER: "open-meteo",
      OPEN_METEO_BASE_URL: "https://api.open-meteo.com/v1/forecast"
    });

    expect(config.integrations.weatherProvider).toBe("open-meteo");
    expect(config.integrations.openMeteoBaseUrl).toBe("https://api.open-meteo.com/v1/forecast");
    expect(JSON.stringify(config.frontendSafe)).not.toContain("open-meteo");
    expect(JSON.stringify(config.frontendSafe)).not.toContain("api.open-meteo.com");
  });
});

describe("backend logger secret redaction", () => {
  it("defines redaction paths for backend-only secret names", () => {
    expect(LOG_REDACTION_PATHS).toEqual(
      expect.arrayContaining([
        "DATABASE_URL",
        "POSTGRES_PASSWORD",
        "backendOnly.databaseUrl",
        "backendOnly.postgresPassword",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_JWT_SECRET",
        "VAPID_PRIVATE_KEY",
        "AI_API_KEY"
      ])
    );
  });

  it("redacts secret-like keys recursively", () => {
    expect(
      redactSecrets({
        DATABASE_URL: "postgres://secret",
        nested: {
          POSTGRES_PASSWORD: "password",
          SUPABASE_SERVICE_ROLE_KEY: "service-role",
          SUPABASE_JWT_SECRET: "jwt-secret",
          VAPID_PRIVATE_KEY: "private",
          AI_API_KEY: "ai-secret",
          safeValue: "visible"
        }
      })
    ).toEqual({
      DATABASE_URL: "[REDACTED]",
      nested: {
        POSTGRES_PASSWORD: "[REDACTED]",
        SUPABASE_SERVICE_ROLE_KEY: "[REDACTED]",
        SUPABASE_JWT_SECRET: "[REDACTED]",
        VAPID_PRIVATE_KEY: "[REDACTED]",
        AI_API_KEY: "[REDACTED]",
        safeValue: "visible"
      }
    });
  });

  it("provides safe config metadata without backend-only secret values", () => {
    const config = loadConfig({
      NODE_ENV: "test",
      DATABASE_URL: "postgres://secret",
      POSTGRES_PASSWORD: "password",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      AI_API_KEY: "ai-secret"
    });

    const safeConfig = safeConfigForLogging(config);
    const serialized = JSON.stringify(safeConfig);

    expect(serialized).not.toContain("postgres://secret");
    expect(serialized).not.toContain("service-role");
    expect(serialized).not.toContain("ai-secret");
    expect(serialized).not.toContain("POSTGRES_PASSWORD");
    expect(serialized).not.toContain("DATABASE_URL");
  });
});
