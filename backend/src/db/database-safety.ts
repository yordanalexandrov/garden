import type { AppConfig } from "../config/config.js";
import type { DatabaseTarget } from "./database-config.js";

export class UnsafeDatabaseTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeDatabaseTargetError";
  }
}

export type DatabaseSafetyOptions = {
  nodeEnv: AppConfig["nodeEnv"] | undefined;
  allowReset?: boolean;
};

export function assertSafeMigrationTarget(target: DatabaseTarget, options: DatabaseSafetyOptions): void {
  if (options.nodeEnv === "production") {
    throw new UnsafeDatabaseTargetError("Refusing to run database migrations when NODE_ENV=production");
  }

  if (hasProductionMarker(target)) {
    throw new UnsafeDatabaseTargetError("Refusing to target a database name, host, or user marked as production");
  }

  if (!isLocalOrPrivateHost(target.host)) {
    throw new UnsafeDatabaseTargetError("Database host must be local or private for backend migration commands");
  }
}

export function assertSafeTestResetTarget(target: DatabaseTarget, options: DatabaseSafetyOptions): void {
  assertSafeMigrationTarget(target, options);

  if (options.allowReset === true) {
    return;
  }

  if (!hasTestDatabaseMarker(target.database)) {
    throw new UnsafeDatabaseTargetError(
      "Refusing to reset database without a test/ci database name or ALLOW_TEST_DATABASE_RESET=true"
    );
  }
}

function hasProductionMarker(target: DatabaseTarget): boolean {
  return [target.host, target.database, target.user].some((value) => containsToken(value, ["prod", "production"]));
}

function hasTestDatabaseMarker(database: string | undefined): boolean {
  return containsToken(database, ["test", "testing", "ci"]);
}

function containsToken(value: string | undefined, tokens: string[]): boolean {
  if (value === undefined) {
    return false;
  }

  const valueTokens = value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);

  return valueTokens.some((token) => tokens.includes(token));
}

function isLocalOrPrivateHost(host: string): boolean {
  const normalized = host.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized === "host.docker.internal" ||
    normalized === "::1" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  if (/^127\./.test(normalized) || /^10\./.test(normalized) || /^192\.168\./.test(normalized)) {
    return true;
  }

  const private172 = normalized.match(/^172\.(\d+)\./);
  if (private172?.[1] !== undefined) {
    const secondOctet = Number(private172[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  return !normalized.includes(".");
}
