import { describe, expect, it } from "vitest";

import { errorEnvelope, successEnvelope } from "../src/shared/api/envelope.js";
import { API_ERROR_CODES, ERROR_STATUS_BY_CODE, statusForErrorCode } from "../src/shared/errors/error-codes.js";

describe("API envelopes", () => {
  it("wraps successful responses in the canonical data envelope", () => {
    expect(successEnvelope({ id: "example" })).toEqual({
      data: {
        id: "example"
      }
    });
  });

  it("wraps failed responses in the canonical error envelope", () => {
    expect(errorEnvelope("VALIDATION_ERROR", "Invalid input", { name: ["Required"] })).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: {
          name: ["Required"]
        }
      }
    });
  });

  it("maps every canonical error code to the API contract HTTP status", () => {
    expect(API_ERROR_CODES).toEqual([
      "VALIDATION_ERROR",
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "CONFLICT",
      "BUSINESS_RULE_VIOLATION",
      "INVENTORY_SHORTAGE",
      "EXTERNAL_SERVICE_ERROR",
      "INTERNAL_ERROR"
    ]);

    expect(ERROR_STATUS_BY_CODE).toEqual({
      VALIDATION_ERROR: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      BUSINESS_RULE_VIOLATION: 422,
      INVENTORY_SHORTAGE: 422,
      EXTERNAL_SERVICE_ERROR: 502,
      INTERNAL_ERROR: 500
    });

    for (const code of API_ERROR_CODES) {
      expect(statusForErrorCode(code)).toBe(ERROR_STATUS_BY_CODE[code]);
    }
  });
});
