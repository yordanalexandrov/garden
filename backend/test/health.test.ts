import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { createTestApp } from "./helpers/app.js";

describe("GET /api/v1/health", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns an unauthenticated canonical health response", async () => {
    app = await createTestApp();

    const response = await app.inject({ method: "GET", url: "/api/v1/health" });
    const body = response.json<{
      data: {
        status: "ok";
        timestamp: string;
      };
    }>();

    expect(response.statusCode).toBe(200);
    expect(body.data.status).toBe("ok");
    expect(typeof body.data.timestamp).toBe("string");
    expect(Date.parse(body.data.timestamp)).not.toBeNaN();
  });

  it("does not require database or provider environment variables", async () => {
    app = await createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
      headers: {}
    });

    expect(response.statusCode).toBe(200);
  });
});
