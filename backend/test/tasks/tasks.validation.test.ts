import { describe, expect, it } from "vitest";

import { validateRequestPart } from "../../src/shared/validation/request-validation.js";
import { createTaskBodySchema, taskListQuerySchema } from "../../src/modules/tasks/tasks.validation.js";

const PlaceId = "11111111-1111-4111-8111-111111111111";
const BedId = "22222222-2222-4222-8222-222222222222";

describe("task validation", () => {
  it("accepts canonical list filters and manual create payloads", () => {
    expect(
      validateRequestPart("query", taskListQuerySchema, {
        placeId: PlaceId,
        status: "planned",
        type: "spraying",
        sourceType: "manual",
        dueFrom: "2026-05-01",
        dueTo: "2026-05-31",
        page: "1",
        pageSize: "10"
      })
    ).toMatchObject({ page: 1, pageSize: 10 });

    expect(
      validateRequestPart("body", createTaskBodySchema, {
        placeId: PlaceId,
        type: "fertilizing",
        dueDate: "2026-05-20",
        status: "planned",
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [BedId] },
        notes: "Feed bed"
      })
    ).toMatchObject({ placeId: PlaceId, status: "planned" });
  });

  it("rejects trusted account, reminder, push/weather, invalid enum, and mismatched target fields", () => {
    const invalidPayloads = [
      { accountId: PlaceId },
      { reminders: [] },
      { reminderTypes: ["same_day"] },
      { pushSubscriptionId: PlaceId },
      { weatherEventId: PlaceId },
      { type: "watering" },
      { targetScopeType: "whole_place", targetSelection: { bedIds: [BedId] } }
    ].map((patch) => ({
      placeId: PlaceId,
      type: "spraying",
      dueDate: "2026-05-20",
      status: "suggested",
      targetScopeType: "whole_place",
      ...patch
    }));

    for (const payload of invalidPayloads) {
      expect(() => validateRequestPart("body", createTaskBodySchema, payload)).toThrow();
    }
  });
});
