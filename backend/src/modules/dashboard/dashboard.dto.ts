import type {
  DashboardActivityItem,
  DashboardLowStockProductItem,
  DashboardProblemItem,
  DashboardQuarantinePeriodItem,
  DashboardSummary,
  DashboardTaskItem
} from "./dashboard.types.js";

export function toDashboardSummaryDto(summary: DashboardSummary): DashboardSummaryDto {
  return {
    upcomingTasks: summary.upcomingTasks.map(toDashboardTaskDto),
    suggestedTasks: summary.suggestedTasks.map(toDashboardTaskDto),
    activeQuarantinePeriods: summary.activeQuarantinePeriods.map(toDashboardQuarantinePeriodDto),
    recentActivities: summary.recentActivities.map(toDashboardActivityDto),
    openProblems: summary.openProblems.map(toDashboardProblemDto),
    lowStockProducts: summary.lowStockProducts.map(toDashboardLowStockProductDto),
    places: summary.places
  };
}

function toDashboardTaskDto(item: DashboardTaskItem): DashboardTaskDto {
  return { ...item };
}

function toDashboardQuarantinePeriodDto(item: DashboardQuarantinePeriodItem): DashboardQuarantinePeriodDto {
  return { ...item };
}

function toDashboardActivityDto(item: DashboardActivityItem): DashboardActivityDto {
  return {
    ...item,
    performedAt: item.performedAt.toISOString()
  };
}

function toDashboardProblemDto(item: DashboardProblemItem): DashboardProblemDto {
  return {
    ...item,
    observedAt: item.observedAt.toISOString()
  };
}

function toDashboardLowStockProductDto(item: DashboardLowStockProductItem): DashboardLowStockProductDto {
  return { ...item };
}

type DashboardTaskDto = DashboardTaskItem;
type DashboardQuarantinePeriodDto = DashboardQuarantinePeriodItem;
type DashboardActivityDto = Omit<DashboardActivityItem, "performedAt"> & { performedAt: string };
type DashboardProblemDto = Omit<DashboardProblemItem, "observedAt"> & { observedAt: string };
type DashboardLowStockProductDto = DashboardLowStockProductItem;

type DashboardSummaryDto = Omit<DashboardSummary, "recentActivities" | "openProblems"> & {
  recentActivities: DashboardActivityDto[];
  openProblems: DashboardProblemDto[];
};
