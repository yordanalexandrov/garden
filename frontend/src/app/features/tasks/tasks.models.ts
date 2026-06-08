import { ApiListData } from '../../core/api/api.types';
import { TargetScopeType, TargetSummary } from '../activities/activities.models';
import { PagedFilter } from '../garden-structure-api.types';

export const TASK_TYPES = [
  'spraying',
  'fertilizing',
  'pruning',
  'planting',
  'harvest_reminder',
  'custom',
] as const;

export const TASK_STATUSES = ['suggested', 'planned', 'done', 'skipped', 'canceled'] as const;
export const TASK_SOURCE_TYPES = ['activity', 'manual', 'weather', 'ai'] as const;
export const REMINDER_TYPES = ['day_before', 'same_day'] as const;
export const REMINDER_STATUSES = ['scheduled', 'sent', 'failed', 'canceled'] as const;

export type TaskType = (typeof TASK_TYPES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskSourceType = (typeof TASK_SOURCE_TYPES)[number];
export type ReminderType = (typeof REMINDER_TYPES)[number];
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export interface TaskListItem {
  readonly id: string;
  readonly placeId: string | null;
  readonly type: TaskType;
  readonly dueDate: string;
  readonly status: TaskStatus;
  readonly targetScopeType: TargetScopeType;
  readonly targetSummary: string;
  readonly sourceType: TaskSourceType | null;
  readonly notes: string | null;
}

export interface TaskReminder {
  readonly id: string;
  readonly reminderType: ReminderType;
  readonly scheduledFor: string;
  readonly status: ReminderStatus;
  readonly sentAt: string | null;
}

export interface TaskWeatherEventSummary {
  readonly id: string;
  readonly eventType: string;
  readonly forecastedRain: boolean | null;
  readonly observedRain: boolean | null;
  readonly userConfirmationStatus: string | null;
  readonly createdAt: string;
}

export interface TaskDetail extends TaskListItem {
  readonly sourceReferenceId: string | null;
  readonly targets: readonly TargetSummary[];
  readonly reminders: readonly TaskReminder[];
  readonly weatherEvents: readonly TaskWeatherEventSummary[];
  readonly confirmedAt: string | null;
  readonly completedAt: string | null;
}

export interface ListTasksFilters extends PagedFilter {
  readonly placeId?: string;
  readonly status?: TaskStatus;
  readonly type?: TaskType;
  readonly sourceType?: TaskSourceType;
  readonly dueFrom?: string;
  readonly dueTo?: string;
}

export interface CreateManualTaskRequest {
  readonly placeId: string;
  readonly type: TaskType;
  readonly dueDate: string;
  readonly status: Extract<TaskStatus, 'planned' | 'suggested'>;
  readonly targetScopeType: TargetScopeType;
  readonly targetSelection?: {
    readonly perennialIds?: readonly string[];
    readonly bedIds?: readonly string[];
    readonly yearlyPlantingIds?: readonly string[];
    readonly persistentBedPlantIds?: readonly string[];
  };
  readonly notes?: string | null;
}

export interface PatchTaskRequest {
  readonly dueDate?: string;
  readonly notes?: string | null;
  readonly type?: TaskType;
  readonly targetScopeType?: TargetScopeType;
  readonly targetSelection?: CreateManualTaskRequest['targetSelection'];
}

export interface ConfirmTaskResult {
  readonly id: string;
  readonly status: 'planned';
  readonly confirmedAt: string;
  readonly reminders: readonly TaskReminder[];
}

export type TasksPage = ApiListData<TaskListItem>;
