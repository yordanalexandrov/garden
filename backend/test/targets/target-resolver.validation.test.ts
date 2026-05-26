import { describe, expect, it } from "vitest";

import { toResolvedTarget } from "../../src/modules/targets/target-resolver.dto.js";
import { validateTargetResolutionInput } from "../../src/modules/targets/target-resolver.validation.js";
import type { ResolveTargetsInput } from "../../src/modules/targets/target-resolver.types.js";
import { AppError } from "../../src/shared/errors/app-error.js";

const PlaceId = "11111111-1111-4111-8111-111111111111";
const PerennialId = "22222222-2222-4222-8222-222222222222";
const BedId = "33333333-3333-4333-8333-333333333333";
const YearlyPlantingId = "44444444-4444-4444-8444-444444444444";
const PersistentBedPlantId = "55555555-5555-4555-8555-555555555555";

describe("target resolver validation", () => {
  it("accepts whole-place and whole-group scopes without selected IDs", () => {
    expectValid({ placeId: PlaceId, targetScopeType: "whole_place" });
    expectValid({ placeId: PlaceId, targetScopeType: "all_perennials_in_place" });
    expectValid({ placeId: PlaceId, targetScopeType: "all_beds_in_place" });
  });

  it("accepts selected scopes only with matching non-empty selected ID fields", () => {
    expectValid({
      placeId: PlaceId,
      targetScopeType: "selected_perennials",
      targetSelection: { perennialIds: [PerennialId] }
    });
    expectValid({
      placeId: PlaceId,
      targetScopeType: "selected_beds",
      targetSelection: { bedIds: [BedId] }
    });
    expectValid({
      placeId: PlaceId,
      targetScopeType: "single_bed",
      targetSelection: { bedIds: [BedId] }
    });
    expectValid({
      placeId: PlaceId,
      targetScopeType: "selected_yearly_plantings",
      targetSelection: { yearlyPlantingIds: [YearlyPlantingId] }
    });
    expectValid({
      placeId: PlaceId,
      targetScopeType: "selected_persistent_bed_plants",
      targetSelection: { persistentBedPlantIds: [PersistentBedPlantId] }
    });
  });

  it("rejects empty, irrelevant, duplicate, and single-bed multi-selection shapes", () => {
    expectInvalid({
      placeId: PlaceId,
      targetScopeType: "whole_place",
      targetSelection: { bedIds: [BedId] }
    });
    expectInvalid({
      placeId: PlaceId,
      targetScopeType: "selected_perennials",
      targetSelection: { perennialIds: [] }
    });
    expectInvalid({
      placeId: PlaceId,
      targetScopeType: "selected_beds",
      targetSelection: { bedIds: [BedId], perennialIds: [PerennialId] }
    });
    expectInvalid({
      placeId: PlaceId,
      targetScopeType: "single_bed",
      targetSelection: { bedIds: [BedId, "66666666-6666-4666-8666-666666666666"] }
    });
    expectInvalid({
      placeId: PlaceId,
      targetScopeType: "selected_yearly_plantings",
      targetSelection: { yearlyPlantingIds: [YearlyPlantingId, YearlyPlantingId] }
    });
  });

  it("maps target refs and summaries with canonical camelCase read-model shape", () => {
    expect(
      toResolvedTarget({
        targetType: "bed",
        targetId: BedId,
        label: "North bed",
        placeId: PlaceId
      })
    ).toEqual({
      targetType: "bed",
      targetId: BedId,
      summary: {
        targetType: "bed",
        targetId: BedId,
        label: "North bed",
        placeId: PlaceId
      }
    });
  });
});

function expectValid(input: ResolveTargetsInput): void {
  expect(() => validateTargetResolutionInput(input)).not.toThrow();
}

function expectInvalid(input: ResolveTargetsInput): void {
  expect(() => validateTargetResolutionInput(input)).toThrow(AppError);
}
