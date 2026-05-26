import { AppError } from "../../shared/errors/app-error.js";
import type { UUID } from "../auth/auth.types.js";
import type { ResolveTargetsInput, TargetSelection } from "./target-resolver.types.js";

const SELECTION_FIELDS = ["perennialIds", "bedIds", "yearlyPlantingIds", "persistentBedPlantIds"] as const;

type SelectionField = (typeof SELECTION_FIELDS)[number];

type RequiredSelection = {
  field: SelectionField;
  exactCount?: number;
};

export function validateTargetResolutionInput(input: ResolveTargetsInput): void {
  const selection = input.targetSelection ?? {};
  const required = requiredSelectionForScope(input);

  if (required === undefined) {
    rejectAnySelectionFields(selection);
    return;
  }

  for (const field of SELECTION_FIELDS) {
    const ids = selection[field];

    if (field !== required.field && ids !== undefined) {
      throw targetSelectionError(field, "is not allowed for this target scope");
    }
  }

  const ids = selection[required.field];

  if (ids === undefined || ids.length === 0) {
    throw targetSelectionError(required.field, "must contain at least one id");
  }

  if (required.exactCount !== undefined && ids.length !== required.exactCount) {
    throw targetSelectionError(required.field, `must contain exactly ${required.exactCount} id`);
  }

  rejectDuplicateIds(required.field, ids);
}

export function selectedIdsForScope(input: ResolveTargetsInput): UUID[] {
  const required = requiredSelectionForScope(input);

  if (required === undefined) {
    return [];
  }

  return input.targetSelection?.[required.field] ?? [];
}

function rejectAnySelectionFields(selection: TargetSelection): void {
  for (const field of SELECTION_FIELDS) {
    if (selection[field] !== undefined) {
      throw targetSelectionError(field, "is not allowed for this target scope");
    }
  }
}

function requiredSelectionForScope(input: ResolveTargetsInput): RequiredSelection | undefined {
  switch (input.targetScopeType) {
    case "selected_perennials":
      return { field: "perennialIds" };
    case "selected_beds":
      return { field: "bedIds" };
    case "single_bed":
      return { field: "bedIds", exactCount: 1 };
    case "selected_yearly_plantings":
      return { field: "yearlyPlantingIds" };
    case "selected_persistent_bed_plants":
      return { field: "persistentBedPlantIds" };
    case "whole_place":
    case "all_perennials_in_place":
    case "all_beds_in_place":
      return undefined;
  }
}

function rejectDuplicateIds(field: SelectionField, ids: readonly UUID[]): void {
  if (new Set(ids).size !== ids.length) {
    throw targetSelectionError(field, "must not contain duplicate ids");
  }
}

function targetSelectionError(field: SelectionField, message: string): AppError {
  return new AppError("VALIDATION_ERROR", "Invalid target selection", {
    [field]: [message]
  });
}
