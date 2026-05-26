import type { ResolvedTarget, TargetLookupRow, TargetRef, TargetSummary } from "./target-resolver.types.js";

export function toTargetRef(row: TargetLookupRow): TargetRef {
  return {
    targetType: row.targetType,
    targetId: row.targetId
  };
}

export function toTargetSummary(row: TargetLookupRow): TargetSummary {
  return {
    targetType: row.targetType,
    targetId: row.targetId,
    label: row.label,
    placeId: row.placeId
  };
}

export function toResolvedTarget(row: TargetLookupRow): ResolvedTarget {
  return {
    ...toTargetRef(row),
    summary: toTargetSummary(row)
  };
}

export function toResolvedTargets(rows: readonly TargetLookupRow[]): ResolvedTarget[] {
  return rows.map(toResolvedTarget);
}
