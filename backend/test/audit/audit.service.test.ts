import { describe, expect, it } from "vitest";

import { normalizeAuditAction, sanitizeAuditJson } from "../../src/modules/audit/audit.service.js";

describe("AuditService helpers", () => {
  it("normalizes action names", () => {
    expect(normalizeAuditAction(" Activity Corrected ")).toBe("activity_corrected");
    expect(normalizeAuditAction("inventory_lot.created")).toBe("inventory_lot.created");
  });

  it("removes secret-like fields from nested audit payloads", () => {
    expect(
      sanitizeAuditJson({
        activityId: "activity-1",
        authorization: "Bearer secret",
        nested: {
          serviceRoleKey: "secret",
          quantity: 5,
          refresh_token: "secret"
        },
        values: [{ apiKey: "secret", visible: true }]
      })
    ).toEqual({
      activityId: "activity-1",
      nested: {
        quantity: 5
      },
      values: [{ visible: true }]
    });
  });
});
