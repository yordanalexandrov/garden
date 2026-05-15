import { createHmac, timingSafeEqual } from "node:crypto";

import type { AuthPort } from "../../modules/auth/auth.port.js";
import { createAuthenticatedActor, type AuthenticatedActor, type UUID } from "../../modules/auth/auth.types.js";
import { unauthorizedError } from "../../modules/auth/bearer-token.js";
import { isAppError } from "../../shared/errors/app-error.js";

const SUPABASE_DEFAULT_AUDIENCE = "authenticated";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SupabaseAuthAdapterOptions = {
  jwtSecret: string;
  expectedAudience?: string;
  expectedIssuer?: string;
  clockToleranceSeconds?: number;
  now?: () => Date;
};

type JwtHeader = {
  alg?: unknown;
  typ?: unknown;
};

type JwtClaims = Record<string, unknown> & {
  sub?: unknown;
  aud?: unknown;
  iss?: unknown;
  exp?: unknown;
  nbf?: unknown;
  email?: unknown;
  role?: unknown;
  scope?: unknown;
  scp?: unknown;
  app_metadata?: unknown;
};

export class SupabaseAuthAdapter implements AuthPort {
  readonly #jwtSecret: string;
  readonly #expectedAudience: string | undefined;
  readonly #expectedIssuer: string | undefined;
  readonly #clockToleranceSeconds: number;
  readonly #now: () => Date;

  constructor(options: SupabaseAuthAdapterOptions) {
    if (options.jwtSecret.trim() === "") {
      throw new Error("SupabaseAuthAdapter requires a non-empty JWT secret");
    }

    this.#jwtSecret = options.jwtSecret;
    this.#expectedAudience = options.expectedAudience ?? SUPABASE_DEFAULT_AUDIENCE;
    this.#expectedIssuer = options.expectedIssuer;
    this.#clockToleranceSeconds = options.clockToleranceSeconds ?? 30;
    this.#now = options.now ?? (() => new Date());
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedActor> {
    await Promise.resolve();

    const claims = this.verifyJwt(token);
    const userId = requireStringClaim(claims.sub);
    const accountId = extractAccountId(claims);

    if (!isUuid(accountId)) {
      throw unauthorizedError();
    }

    return createAuthenticatedActor({
      userId,
      accountId,
      email: typeof claims.email === "string" ? claims.email : null,
      scopes: extractScopes(claims),
      provider: "supabase"
    });
  }

  private verifyJwt(token: string): JwtClaims {
    try {
      const parts = token.split(".");

      if (parts.length !== 3) {
        throw unauthorizedError();
      }

      const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];
      const header = parseBase64UrlJson<JwtHeader>(encodedHeader);
      const claims = parseBase64UrlJson<JwtClaims>(encodedPayload);

      if (header.alg !== "HS256") {
        throw unauthorizedError();
      }

      assertSignature(`${encodedHeader}.${encodedPayload}`, encodedSignature, this.#jwtSecret);
      this.assertRegisteredClaims(claims);

      return claims;
    } catch (error) {
      if (isAppError(error)) {
        throw error;
      }

      throw unauthorizedError();
    }
  }

  private assertRegisteredClaims(claims: JwtClaims): void {
    const nowSeconds = Math.floor(this.#now().getTime() / 1000);

    if (typeof claims.exp !== "number" || claims.exp <= nowSeconds - this.#clockToleranceSeconds) {
      throw unauthorizedError();
    }

    if (typeof claims.nbf === "number" && claims.nbf > nowSeconds + this.#clockToleranceSeconds) {
      throw unauthorizedError();
    }

    if (this.#expectedAudience !== undefined && !claimContainsAudience(claims.aud, this.#expectedAudience)) {
      throw unauthorizedError();
    }

    if (this.#expectedIssuer !== undefined && claims.iss !== this.#expectedIssuer) {
      throw unauthorizedError();
    }
  }
}

function parseBase64UrlJson<T extends Record<string, unknown>>(value: string): T {
  return JSON.parse(base64UrlDecode(value).toString("utf8")) as T;
}

function base64UrlDecode(value: string): Buffer {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
    throw unauthorizedError();
  }

  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");

  return Buffer.from(padded.replaceAll("-", "+").replaceAll("_", "/"), "base64");
}

function assertSignature(signingInput: string, encodedSignature: string, secret: string): void {
  const expectedSignature = createHmac("sha256", secret).update(signingInput).digest();
  const actualSignature = base64UrlDecode(encodedSignature);

  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) {
    throw unauthorizedError();
  }
}

function requireStringClaim(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw unauthorizedError();
  }

  return value;
}

function extractAccountId(claims: JwtClaims): UUID {
  // Auth-to-account policy: Supabase tokens must carry an application account id
  // in a backend-controlled top-level or app_metadata claim.
  const topLevelAccountId = claims.account_id;

  if (typeof topLevelAccountId === "string") {
    return topLevelAccountId;
  }

  if (isRecord(claims.app_metadata)) {
    const accountId = claims.app_metadata.account_id ?? claims.app_metadata.accountId;

    if (typeof accountId === "string") {
      return accountId;
    }
  }

  throw unauthorizedError();
}

function extractScopes(claims: JwtClaims): readonly string[] {
  if (Array.isArray(claims.scp) && claims.scp.every((scope) => typeof scope === "string")) {
    return claims.scp;
  }

  if (typeof claims.scope === "string" && claims.scope.trim() !== "") {
    return claims.scope.split(" ").filter((scope) => scope.length > 0);
  }

  if (typeof claims.role === "string" && claims.role.trim() !== "") {
    return [claims.role];
  }

  return [];
}

function claimContainsAudience(audienceClaim: unknown, expectedAudience: string): boolean {
  if (typeof audienceClaim === "string") {
    return audienceClaim === expectedAudience;
  }

  if (Array.isArray(audienceClaim)) {
    return audienceClaim.includes(expectedAudience);
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
