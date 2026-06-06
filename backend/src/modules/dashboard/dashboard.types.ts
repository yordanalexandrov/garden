import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type { ActivityType } from "../activities/activities.types.js";
import type { ProductCategory, SimpleUnit } from "../products/products.types.js";
import type { ProblemStatus, ProblemType } from "../problems/problems.types.js";
import type { TaskStatus, TaskType } from "../tasks/tasks.types.js";

export type DashboardQuery = {
  placeId?: UUID;
};

export type DashboardTaskItem = {
  id: UUID;
  type: TaskType;
  dueDate: string;
  status: TaskStatus;
  title: string;
  placeId: UUID | null;
  targetSummary: string;
};

export type DashboardQuarantinePeriodItem = {
  id: UUID;
  startsOn: string;
  endsOn: string;
  title: string;
  activityId: UUID;
  productId: UUID;
  placeId: UUID | null;
};

export type DashboardActivityItem = {
  id: UUID;
  type: ActivityType;
  performedAt: Date;
  title: string;
  placeId: UUID | null;
  targetSummary: string;
};

export type DashboardProblemItem = {
  id: UUID;
  type: ProblemType;
  title: string;
  status: ProblemStatus;
  observedAt: Date;
  placeId: UUID;
};

export type DashboardLowStockProductItem = {
  productId: UUID;
  productName: string;
  category: ProductCategory;
  defaultUnit: SimpleUnit;
  quantityRemaining: string;
  activeLotCount: number;
  nextExpiryDate: string | null;
};

export type DashboardPlaceItem = {
  id: UUID;
  name: string;
  weatherEnabled: boolean;
};

export type DashboardSummary = {
  upcomingTasks: DashboardTaskItem[];
  suggestedTasks: DashboardTaskItem[];
  activeQuarantinePeriods: DashboardQuarantinePeriodItem[];
  recentActivities: DashboardActivityItem[];
  openProblems: DashboardProblemItem[];
  lowStockProducts: DashboardLowStockProductItem[];
  places: DashboardPlaceItem[];
};

export interface DashboardRepository {
  ensurePlaceBelongsToAccount(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<void>;
  listUpcomingTasks(accountId: UUID, query: DashboardQuery, db?: DbHandle): Promise<DashboardTaskItem[]>;
  listSuggestedTasks(accountId: UUID, query: DashboardQuery, db?: DbHandle): Promise<DashboardTaskItem[]>;
  listActiveQuarantinePeriods(accountId: UUID, query: DashboardQuery, db?: DbHandle): Promise<DashboardQuarantinePeriodItem[]>;
  listRecentActivities(accountId: UUID, query: DashboardQuery, db?: DbHandle): Promise<DashboardActivityItem[]>;
  listOpenProblems(accountId: UUID, query: DashboardQuery, db?: DbHandle): Promise<DashboardProblemItem[]>;
  listLowStockProducts(accountId: UUID, query: DashboardQuery, db?: DbHandle): Promise<DashboardLowStockProductItem[]>;
  listPlaces(accountId: UUID, query: DashboardQuery, db?: DbHandle): Promise<DashboardPlaceItem[]>;
}
