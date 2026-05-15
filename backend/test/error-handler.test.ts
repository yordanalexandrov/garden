import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { createTestApp } from "./helpers/app.js";

describe("Fastify error handling", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns a canonical NOT_FOUND envelope for unknown routes", async () => {
    app = await createTestApp();

    const response = await app.inject({ method: "GET", url: "/api/v1/missing" });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
        details: {}
      }
    });
  });

  it("maps AppError instances to their canonical status and envelope", async () => {
    app = await createTestApp({ enableTestRoutes: true });

    const response = await app.inject({ method: "GET", url: "/api/v1/__test/app-error" });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: {
        code: "CONFLICT",
        message: "Conflict from test fixture",
        details: {
          reason: "fixture"
        }
      }
    });
  });

  it("sanitizes unexpected errors", async () => {
    app = await createTestApp({ enableTestRoutes: true });

    const response = await app.inject({ method: "GET", url: "/api/v1/__test/unexpected-error" });
    const body = response.json<{
      error: {
        code: string;
        message: string;
        details: Record<string, unknown>;
      };
    }>();

    expect(response.statusCode).toBe(500);
    expect(body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error",
        details: {}
      }
    });
    expect(JSON.stringify(body)).not.toContain("raw unexpected fixture error");
  });
});
