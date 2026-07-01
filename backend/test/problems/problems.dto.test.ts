import { describe, expect, it } from "vitest";

import { toProblemDetailDto, toProblemListItemDto, toProblemMutationDto } from "../../src/modules/problems/problems.dto.js";
import type { Problem, ProblemDetail, ProblemListItem } from "../../src/modules/problems/problems.types.js";

const observedAt = new Date("2026-05-13T07:00:00.000Z");
const createdAt = new Date("2026-05-13T07:05:00.000Z");
const updatedAt = new Date("2026-05-13T07:10:00.000Z");

describe("problems DTO mapping", () => {
  it("maps list read models to canonical camelCase fields", () => {
    expect(toProblemListItemDto(createProblemListItem())).toEqual({
      id: "123e4567-e89b-42d3-a456-426614174000",
      type: "problem",
      placeId: "223e4567-e89b-42d3-a456-426614174000",
      targetType: "bed",
      targetId: "323e4567-e89b-42d3-a456-426614174000",
      targetLabel: "Bed A",
      title: "Leaf spots",
      category: "fungus",
      severity: "medium",
      status: "open",
      observedAt: "2026-05-13T07:00:00.000Z",
      resolvedAt: null,
      archivedAt: null,
      photosCount: 0
    });
  });

  it("maps detail read models with empty Phase 15 photos and linked activity summary", () => {
    expect(toProblemDetailDto(createProblemDetail())).toMatchObject({
      description: "Dark spots on lower leaves",
      photos: [],
      linkedActivity: {
        id: "423e4567-e89b-42d3-a456-426614174000",
        type: "treatment",
        performedAt: "2026-05-12T07:00:00.000Z"
      }
    });
  });

  it("maps mutation responses to canonical id only", () => {
    expect(toProblemMutationDto(createProblem())).toEqual({ id: "123e4567-e89b-42d3-a456-426614174000" });
  });
});

function createProblem(): Problem {
  return {
    id: "123e4567-e89b-42d3-a456-426614174000",
    accountId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    type: "problem",
    placeId: "223e4567-e89b-42d3-a456-426614174000",
    targetType: "bed",
    targetId: "323e4567-e89b-42d3-a456-426614174000",
    title: "Leaf spots",
    description: "Dark spots on lower leaves",
    category: "fungus",
    severity: "medium",
    status: "open",
    observedAt,
    resolvedAt: null,
    archivedAt: null,
    linkedActivityId: "423e4567-e89b-42d3-a456-426614174000",
    createdAt,
    updatedAt
  };
}

function createProblemListItem(): ProblemListItem {
  return {
    id: "123e4567-e89b-42d3-a456-426614174000",
    type: "problem",
    placeId: "223e4567-e89b-42d3-a456-426614174000",
    targetType: "bed",
    targetId: "323e4567-e89b-42d3-a456-426614174000",
    targetLabel: "Bed A",
    title: "Leaf spots",
    category: "fungus",
    severity: "medium",
    status: "open",
    observedAt,
    resolvedAt: null,
    archivedAt: null,
    photosCount: 0
  };
}

function createProblemDetail(): ProblemDetail {
  return {
    ...createProblem(),
    targetLabel: "Bed A",
    photos: [],
    observations: [],
    linkedActivity: {
      id: "423e4567-e89b-42d3-a456-426614174000",
      type: "treatment",
      performedAt: new Date("2026-05-12T07:00:00.000Z")
    }
  };
}
