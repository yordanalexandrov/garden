import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { UUID } from "../auth/auth.types.js";
import { toResolvedTargets } from "./target-resolver.dto.js";
import {
  selectedIdsForScope,
  validateTargetResolutionInput
} from "./target-resolver.validation.js";
import type {
  ResolveActivityTargetsInput,
  ResolvedTarget,
  ResolveTargetsInput,
  ResolveTaskTargetsInput,
  TargetLookupRow,
  TargetResolver,
  TargetResolverRepository
} from "./target-resolver.types.js";

export class BackendTargetResolver implements TargetResolver {
  constructor(private readonly repository: TargetResolverRepository) {}

  async resolveActivityTargets(
    accountId: UUID,
    input: ResolveActivityTargetsInput,
    db?: DbHandle
  ): Promise<ResolvedTarget[]> {
    return this.resolveTargets(accountId, input, db);
  }

  async resolveTaskTargets(accountId: UUID, input: ResolveTaskTargetsInput, db?: DbHandle): Promise<ResolvedTarget[]> {
    return this.resolveTargets(accountId, input, db);
  }

  async resolveTargets(accountId: UUID, input: ResolveTargetsInput, db?: DbHandle): Promise<ResolvedTarget[]> {
    validateTargetResolutionInput(input);
    await this.assertPlaceExists(accountId, input.placeId, db);

    switch (input.targetScopeType) {
      case "whole_place": {
        const place = await this.repository.findPlaceTarget(accountId, input.placeId, db);
        return toResolvedTargets(place === null ? [] : [place]);
      }
      case "all_perennials_in_place":
        return toResolvedTargets(
          requireNonEmptyTargets(
            await this.repository.listActivePerennialTargetsInPlace(accountId, input.placeId, db),
            "Target scope resolved to no active perennials"
          )
        );
      case "all_beds_in_place":
        return toResolvedTargets(
          requireNonEmptyTargets(
            await this.repository.listActiveBedTargetsInPlace(accountId, input.placeId, db),
            "Target scope resolved to no active beds"
          )
        );
      case "selected_perennials":
        return this.resolveSelectedTargets(
          selectedIdsForScope(input),
          await this.repository.listSelectedPerennialTargets(accountId, input.placeId, selectedIdsForScope(input), db)
        );
      case "selected_beds":
      case "single_bed":
        return this.resolveSelectedTargets(
          selectedIdsForScope(input),
          await this.repository.listSelectedBedTargets(accountId, input.placeId, selectedIdsForScope(input), db)
        );
      case "selected_yearly_plantings":
        return this.resolveSelectedTargets(
          selectedIdsForScope(input),
          await this.repository.listSelectedYearlyPlantingTargets(accountId, input.placeId, selectedIdsForScope(input), db)
        );
      case "selected_persistent_bed_plants":
        return this.resolveSelectedTargets(
          selectedIdsForScope(input),
          await this.repository.listSelectedPersistentBedPlantTargets(
            accountId,
            input.placeId,
            selectedIdsForScope(input),
            db
          )
        );
    }
  }

  private async assertPlaceExists(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<void> {
    const place = await this.repository.findPlaceTarget(accountId, placeId, db);

    if (place === null) {
      throw new AppError("NOT_FOUND", "Place was not found");
    }
  }

  private resolveSelectedTargets(requestedIds: readonly UUID[], rows: TargetLookupRow[]): ResolvedTarget[] {
    if (rows.length !== requestedIds.length) {
      throw new AppError("BUSINESS_RULE_VIOLATION", "One or more selected targets are invalid for this place");
    }

    const rowsById = new Map(rows.map((row) => [row.targetId, row]));
    const orderedRows = requestedIds.map((id) => rowsById.get(id));

    if (orderedRows.some((row) => row === undefined)) {
      throw new AppError("BUSINESS_RULE_VIOLATION", "One or more selected targets are invalid for this place");
    }

    return toResolvedTargets(orderedRows as TargetLookupRow[]);
  }
}

function requireNonEmptyTargets(rows: TargetLookupRow[], message: string): TargetLookupRow[] {
  if (rows.length === 0) {
    throw new AppError("BUSINESS_RULE_VIOLATION", message);
  }

  return rows;
}
