import { ActivityType } from '../activities/activities.models';
import { ProductCategory, ProductUnit } from '../products/products.models';
import { ProblemStatus, ProblemType } from '../problems/problems.models';
import { TaskStatus, TaskType } from '../tasks/tasks.models';

export interface DashboardQuery {
  readonly placeId?: string;
}

export interface DashboardTaskItem {
  readonly id: string;
  readonly type: TaskType;
  readonly dueDate: string;
  readonly status: TaskStatus;
  readonly title: string;
  readonly placeId: string | null;
  readonly targetSummary: string;
}

export interface DashboardQuarantinePeriodItem {
  readonly id: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly title: string;
  readonly activityId: string;
  readonly productId: string;
  readonly placeId: string | null;
}

export interface DashboardActivityItem {
  readonly id: string;
  readonly type: ActivityType;
  readonly performedAt: string;
  readonly title: string;
  readonly placeId: string | null;
  readonly targetSummary: string;
}

export interface DashboardProblemItem {
  readonly id: string;
  readonly type: ProblemType;
  readonly title: string;
  readonly status: ProblemStatus;
  readonly observedAt: string;
  readonly placeId: string;
}

export interface DashboardLowStockProductItem {
  readonly productId: string;
  readonly productName: string;
  readonly category: ProductCategory;
  readonly defaultUnit: ProductUnit;
  readonly quantityRemaining: string;
  readonly activeLotCount: number;
  readonly nextExpiryDate: string | null;
}

export interface DashboardPlaceItem {
  readonly id: string;
  readonly name: string;
  readonly weatherEnabled: boolean;
}

export interface DashboardSummary {
  readonly upcomingTasks: readonly DashboardTaskItem[];
  readonly suggestedTasks: readonly DashboardTaskItem[];
  readonly activeQuarantinePeriods: readonly DashboardQuarantinePeriodItem[];
  readonly recentActivities: readonly DashboardActivityItem[];
  readonly openProblems: readonly DashboardProblemItem[];
  readonly lowStockProducts: readonly DashboardLowStockProductItem[];
  readonly places: readonly DashboardPlaceItem[];
}
