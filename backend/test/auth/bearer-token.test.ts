import { describe, expect, it } from "vitest";

import { parseBearerToken } from "../../src/modules/auth/bearer-token.js";
import { AppError } from "../../src/shared/errors/app-error.js";

describe("bearer token parser", () => {
  it("extracts the access token from a canonical bearer header", () => {
    expect(parseBearerToken("Bearer access-token")).toBe("access-token");
  });

  it("rejects missing or non-string authorization headers with UNAUTHORIZED", () => {
    expectUnauthorized(() => parseBearerToken(undefined));
    expectUnauthorized(() => parseBearerToken(["Bearer access-token"]));
  });

  it("rejects non-Bearer schemes with UNAUTHORIZED", () => {
    expectUnauthorized(() => parseBearerToken("Basic access-token"));
    expectUnauthorized(() => parseBearerToken("bearer access-token"));
  });

  it("rejects empty, whitespace-only, or multipart bearer values with UNAUTHORIZED", () => {
    expectUnauthorized(() => parseBearerToken("Bearer "));
    expectUnauthorized(() => parseBearerToken("Bearer    "));
    expectUnauthorized(() => parseBearerToken("Bearer  token"));
    expectUnauthorized(() => parseBearerToken("Bearer token "));
    expectUnauthorized(() => parseBearerToken("Bearer token extra"));
  });
});

function expectUnauthorized(fn: () => unknown): void {
  expect(fn).toThrow(AppError);

  try {
    fn();
  } catch (error) {
    expect(error).toMatchObject({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
      details: {}
    });
  }
}
