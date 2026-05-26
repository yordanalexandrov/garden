import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";

export const TARGET_TYPES = ["place", "perennial", "bed", "yearly_bed_planting", "persistent_bed_plant"] as const;

export const TARGET_SCOPE_TYPES = [
  "whole_place",
  "all_perennials_in_place",
  "selected_perennials",
  "all_beds_in_place",
  "selected_beds",
  "single_bed",
  "selected_yearly_plantings",
  "selected_persistent_bed_plants"
] as const;

export type TargetType = (typeof TARGET_TYPES)[number];
export type TargetScopeType = (typeof TARGET_SCOPE_TYPES)[number];

export type TargetSelection = {
  perennialIds?: UUID[];
  bedIds?: UUID[];
  yearlyPlantingIds?: UUID[];
  persistentBedPlantIds?: UUID[];
};

export type TargetRef = {
  targetType: TargetType;
  targetId: UUID;
};

export type TargetSummary = TargetRef & {
  label: string | null;
  placeId: UUID;
};

export type ResolvedTarget = TargetRef & {
  summary?: TargetSummary;
};

export type ResolveTargetsInput = {
  placeId: UUID;
  targetScopeType: TargetScopeType;
  targetSelection?: TargetSelection;
};

export type ResolveActivityTargetsInput = ResolveTargetsInput;
export type ResolveTaskTargetsInput = ResolveTargetsInput;

export type TargetLookupRow = TargetSummary;

export interface TargetResolverRepository {
  findPlaceTarget(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<TargetLookupRow | null>;
  listActivePerennialTargetsInPlace(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<TargetLookupRow[]>;
  listSelectedPerennialTargets(
    accountId: UUID,
    placeId: UUID,
    perennialIds: UUID[],
    db?: DbHandle
  ): Promise<TargetLookupRow[]>;
  listActiveBedTargetsInPlace(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<TargetLookupRow[]>;
  listSelectedBedTargets(accountId: UUID, placeId: UUID, bedIds: UUID[], db?: DbHandle): Promise<TargetLookupRow[]>;
  listSelectedYearlyPlantingTargets(
    accountId: UUID,
    placeId: UUID,
    yearlyPlantingIds: UUID[],
    db?: DbHandle
  ): Promise<TargetLookupRow[]>;
  listSelectedPersistentBedPlantTargets(
    accountId: UUID,
    placeId: UUID,
    persistentBedPlantIds: UUID[],
    db?: DbHandle
  ): Promise<TargetLookupRow[]>;
}

export interface TargetResolver {
  resolveActivityTargets(accountId: UUID, input: ResolveActivityTargetsInput, db?: DbHandle): Promise<ResolvedTarget[]>;
  resolveTaskTargets(accountId: UUID, input: ResolveTaskTargetsInput, db?: DbHandle): Promise<ResolvedTarget[]>;
}
