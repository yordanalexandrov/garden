import { describe, expect, it } from "vitest";

import {
  createProblemBodySchema,
  problemListQuerySchema,
  problemParamsSchema,
  updateProblemBodySchema
} from "../../src/modules/problems/problems.validation.js";

const validProblemId = "123e4567-e89b-42d3-a456-426614174000";
const validPlaceId = "223e4567-e89b-42d3-a456-426614174000";
const validTargetId = "323e4567-e89b-42d3-a456-426614174000";
const validActivityId = "423e4567-e89b-42d3-a456-426614174000";

const validCreatePayload = {
  type: "problem",
  placeId: validPlaceId,
  targetType: "bed",
  targetId: validTargetId,
  title: "Leaf spots",
  description: "Dark spots on lower leaves",
  category: "fungus",
  severity: "medium",
  status: "open",
  observedAt: "2026-05-13T07:00:00.000Z",
  linkedActivityId: validActivityId
} as const;

describe("problems validation", () => {
  it("accepts canonical problem and observation create payloads", () => {
    expect(createProblemBodySchema.parse(validCreatePayload)).toMatchObject({
      type: "problem",
      category: "fungus",
      status: "open"
    });
    expect(createProblemBodySchema.parse({ ...validCreatePayload, type: "observation", category: null })).toMatchObject({
      type: "observation",
      category: null
    });
  });

  it("rejects missing required fields and invalid enums", () => {
    expect(createProblemBodySchema.safeParse({ ...validCreatePayload, title: "" }).success).toBe(false);
    expect(createProblemBodySchema.safeParse({ ...validCreatePayload, description: "" }).success).toBe(false);
    expect(createProblemBodySchema.safeParse({ ...validCreatePayload, type: "incident" }).success).toBe(false);
    expect(createProblemBodySchema.safeParse({ ...validCreatePayload, status: "closed" }).success).toBe(false);
    expect(createProblemBodySchema.safeParse({ ...validCreatePayload, category: "pest" }).success).toBe(false);
    expect(createProblemBodySchema.safeParse({ ...validCreatePayload, targetType: "plant" }).success).toBe(false);
  });

  it("rejects photo and storage fields in create and update payloads", () => {
    expect(createProblemBodySchema.safeParse({ ...validCreatePayload, photos: [] }).success).toBe(false);
    expect(createProblemBodySchema.safeParse({ ...validCreatePayload, storageKey: "problems/x.jpg" }).success).toBe(false);
    expect(updateProblemBodySchema.safeParse({ status: "monitoring", signedUrl: "https://example.test" }).success).toBe(false);
  });

  it("parses list filters with pagination defaults and limits", () => {
    expect(
      problemListQuerySchema.parse({
        placeId: validPlaceId,
        type: "problem",
        status: "open",
        category: "fungus",
        from: "2026-05-01T00:00:00.000Z",
        to: "2026-05-31T23:59:59.000Z",
        page: "2",
        pageSize: "10"
      })
    ).toEqual({
      placeId: validPlaceId,
      type: "problem",
      status: "open",
      category: "fungus",
      from: "2026-05-01T00:00:00.000Z",
      to: "2026-05-31T23:59:59.000Z",
      includeArchived: false,
      page: 2,
      pageSize: 10
    });
    expect(problemListQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20, includeArchived: false });
    expect(problemListQuerySchema.parse({ includeArchived: "true" })).toMatchObject({ includeArchived: true });
    expect(problemListQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });

  it("validates params and requires at least one update field", () => {
    expect(problemParamsSchema.parse({ problemId: validProblemId })).toEqual({ problemId: validProblemId });
    expect(problemParamsSchema.safeParse({ problemId: "not-a-uuid" }).success).toBe(false);
    expect(updateProblemBodySchema.safeParse({}).success).toBe(false);
    expect(updateProblemBodySchema.safeParse({ status: "resolved", linkedActivityId: null }).success).toBe(true);
  });
});
