import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { createTestApp } from "./helpers/app.js";

describe("Fastify app foundation", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("creates an app instance without opening a network listener", async () => {
    app = await createTestApp();

    expect(app.server.listening).toBe(false);
    await expect(app.ready()).resolves.toBe(app);
  });

  it("keeps public routes under /api/v1", async () => {
    app = await createTestApp();

    const versionedResponse = await app.inject({ method: "GET", url: "/api/v1/health" });
    const unversionedResponse = await app.inject({ method: "GET", url: "/health" });

    expect(versionedResponse.statusCode).toBe(200);
    expect(unversionedResponse.statusCode).toBe(404);
  });
});
