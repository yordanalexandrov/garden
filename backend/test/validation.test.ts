import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { createTestApp } from "./helpers/app.js";

const validId = "123e4567-e89b-12d3-a456-426614174000";

describe("request validation foundation", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("lets a valid request reach the handler", async () => {
    app = await createTestApp({ enableTestRoutes: true });

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/__test/validation/${validId}?mode=preview`,
      payload: {
        name: "Basil"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        params: {
          id: validId
        },
        query: {
          mode: "preview"
        },
        body: {
          name: "Basil"
        }
      }
    });
  });

  it("maps invalid request body to VALIDATION_ERROR", async () => {
    app = await createTestApp({ enableTestRoutes: true });

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/__test/validation/${validId}?mode=preview`,
      payload: {
        name: "B"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: {
          "body.name": [expect.any(String)]
        }
      }
    });
  });

  it("maps invalid params to VALIDATION_ERROR", async () => {
    app = await createTestApp({ enableTestRoutes: true });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/__test/validation/not-a-uuid?mode=preview",
      payload: {
        name: "Basil"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: {
          "params.id": [expect.any(String)]
        }
      }
    });
  });

  it("maps invalid query to VALIDATION_ERROR", async () => {
    app = await createTestApp({ enableTestRoutes: true });

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/__test/validation/${validId}?mode=invalid`,
      payload: {
        name: "Basil"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: {
          "query.mode": [expect.any(String)]
        }
      }
    });
  });
});
