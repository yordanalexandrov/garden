import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { SupabaseAuthAdapter } from "../../src/integrations/auth/supabase-auth.adapter.js";
import { TestAuthIds } from "../../src/modules/auth/test-auth.adapter.js";
import type { AppError } from "../../src/shared/errors/app-error.js";

const jwtSecret = "phase-3-test-supabase-jwt-secret";
const now = new Date("2026-05-16T12:00:00.000Z");
const nowSeconds = Math.floor(now.getTime() / 1000);

describe("Supabase Auth adapter", () => {
  it("verifies a deterministic HS256 Supabase-style JWT", async () => {
    const adapter = createAdapter();
    const actor = await adapter.verifyAccessToken(
      signJwt({
        secret: jwtSecret,
        claims: baseClaims()
      })
    );

    expect(actor).toMatchObject({
      userId: TestAuthIds.userA,
      accountId: TestAuthIds.accountA,
      user: {
        id: TestAuthIds.userA,
        email: "account-a@example.com"
      },
      account: {
        id: TestAuthIds.accountA,
        email: "account-a@example.com"
      },
      provider: "supabase",
      scopes: ["authenticated"]
    });
  });

  it("extracts account_id from app_metadata when the top-level claim is absent", async () => {
    const adapter = createAdapter();
    const claims = {
      ...baseClaims(),
      account_id: undefined,
      app_metadata: {
        account_id: TestAuthIds.accountA
      }
    };

    const actor = await adapter.verifyAccessToken(signJwt({ secret: jwtSecret, claims }));

    expect(actor.accountId).toBe(TestAuthIds.accountA);
  });

  it("rejects expired tokens with UNAUTHORIZED", async () => {
    const adapter = createAdapter();

    await expectUnauthorized(
      adapter.verifyAccessToken(
        signJwt({
          secret: jwtSecret,
          claims: {
            ...baseClaims(),
            exp: nowSeconds - 120
          }
        })
      )
    );
  });

  it("rejects malformed and unverifiable tokens with UNAUTHORIZED", async () => {
    const adapter = createAdapter();
    const wrongSecretToken = signJwt({ secret: "wrong-secret", claims: baseClaims() });

    await expectUnauthorized(adapter.verifyAccessToken("not-a-jwt"));
    await expectUnauthorized(adapter.verifyAccessToken(wrongSecretToken));
  });

  it("rejects tokens missing required identity or account claim data", async () => {
    const adapter = createAdapter();

    await expectUnauthorized(
      adapter.verifyAccessToken(
        signJwt({
          secret: jwtSecret,
          claims: {
            ...baseClaims(),
            sub: undefined
          }
        })
      )
    );
    await expectUnauthorized(
      adapter.verifyAccessToken(
        signJwt({
          secret: jwtSecret,
          claims: {
            ...baseClaims(),
            account_id: undefined
          }
        })
      )
    );
  });

  it("rejects tokens with an unexpected audience", async () => {
    const adapter = createAdapter();

    await expectUnauthorized(
      adapter.verifyAccessToken(
        signJwt({
          secret: jwtSecret,
          claims: {
            ...baseClaims(),
            aud: "service_role"
          }
        })
      )
    );
  });
});

function createAdapter(): SupabaseAuthAdapter {
  return new SupabaseAuthAdapter({
    jwtSecret,
    now: () => now,
    clockToleranceSeconds: 0
  });
}

function baseClaims(): Record<string, unknown> {
  return {
    sub: TestAuthIds.userA,
    account_id: TestAuthIds.accountA,
    email: "account-a@example.com",
    role: "authenticated",
    aud: "authenticated",
    exp: nowSeconds + 300,
    iat: nowSeconds
  };
}

function signJwt(input: {
  secret: string;
  claims: Record<string, unknown>;
  header?: Record<string, unknown>;
}): string {
  const encodedHeader = base64UrlEncode(
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", ...input.header }), "utf8")
  );
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(input.claims), "utf8"));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const encodedSignature = base64UrlEncode(createHmac("sha256", input.secret).update(signingInput).digest());

  return `${signingInput}.${encodedSignature}`;
}

function base64UrlEncode(value: Buffer): string {
  return value.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function expectUnauthorized(promise: Promise<unknown>): Promise<void> {
  await expect(promise).rejects.toMatchObject({
    code: "UNAUTHORIZED",
    message: "Unauthorized",
    details: {}
  } satisfies Partial<AppError>);
}
