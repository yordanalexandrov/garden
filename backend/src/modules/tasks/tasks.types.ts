import type { Selectable } from "kysely";

import type { TaskRemindersTable, TasksTable, TaskTargetsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type { TargetRef, TargetScopeType, TargetSelection, TargetSummary, TargetType } from "../targets/target-resolver.types.js";

export const TASK_TYPES = ["spraying", "fertilizing", "pruning", "planting", "harvest_reminder", "custom"] as const;
export const TASK_STATUSES = ["suggested", "planned", "done", "skipped", "canceled"] as const;
export const TASK_SOURCE_TYPES = ["activity", "manual", "weather", "ai"] as const;
export const REMINDER_TYPES = ["day_before", "same_day"] as const;
export const REMINDER_STATUSES = ["scheduled", "sent", "failed", "canceled"] as const;

export type TaskType = (typeof TASK_TYPES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskSourceType = (typeof TASK_SOURCE_TYPES)[number];
export type ReminderType = (typeof REMINDER_TYPES)[number];
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export type Task = {
  id: UUID;
  accountId: UUID;
  placeId: UUID | null;
  type: TaskType;
  dueDate: string;
  notes: string | null;
  sourceType: TaskSourceType | null;
  sourceReferenceId: UUID | null;
  targetScopeType: TargetScopeType;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
  completedAt: Date | null;
};

export type TaskTarget = TargetRef & {
  id: UUID;
  taskId: UUID;
  createdAt: Date;
};

export type TaskReminder = {
  id: UUID;
  taskId: UUID;
  reminderType: ReminderType;
  scheduledFor: Date;
  sentAt: Date | null;
  status: ReminderStatus;
  createdAt: Date;
};

export type TaskWeatherEventSummary = {
  id: UUID;
  eventType: string;
  forecastedRain: boolean | null;
  observedRain: boolean | null;
  userConfirmationStatus: string | null;
  createdAt: Date;
};

export type TaskListItem = {
  id: UUID;
  placeId: UUID | null;
  type: TaskType;
  dueDate: string;
  status: TaskStatus;
  targetScopeType: TargetScopeType;
  targetSummary: string;
  sourceType: TaskSourceType | null;
  notes: string | null;
};

export type TaskDetail = Task & {
  targets: TargetSummary[];
  reminders: TaskReminder[];
  weatherEvents: TaskWeatherEventSummary[];
};

export type ListTasksFilters = {
  placeId?: UUID;
  status?: TaskStatus;
  type?: TaskType;
  sourceType?: TaskSourceType;
  dueFrom?: string;
  dueTo?: string;
  page: number;
  pageSize: number;
};

export type PaginatedTasks = {
  items: TaskListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateManualTaskRequest = {
  placeId: UUID;
  type: TaskType;
  dueDate: string;
  status: Extract<TaskStatus, "planned" | "suggested">;
  targetScopeType: TargetScopeType;
  targetSelection?: TargetSelection;
  notes?: string | null;
};

export type PatchTaskRequest = {
  dueDate?: string;
  notes?: string | null;
  type?: TaskType;
  targetScopeType?: TargetScopeType;
  targetSelection?: TargetSelection;
};

export type CreateTaskInput = {
  accountId: UUID;
  placeId: UUID | null;
  type: TaskType;
  dueDate: string;
  notes?: string | null;
  sourceType: TaskSourceType;
  sourceReferenceId?: UUID | null;
  targetScopeType: TargetScopeType;
  status: TaskStatus;
  confirmedAt?: Date | null;
  completedAt?: Date | null;
};

export type UpdateTaskInput = {
  type?: TaskType;
  dueDate?: string;
  notes?: string | null;
  targetScopeType?: TargetScopeType;
  status?: TaskStatus;
  confirmedAt?: Date | null;
  completedAt?: Date | null;
};

export type CreateTaskTargetInput = {
  taskId: UUID;
  targetType: TargetType;
  targetId: UUID;
};

export type CreateTaskReminderInput = {
  taskId: UUID;
  reminderType: ReminderType;
  scheduledFor: Date;
  status: Extract<ReminderStatus, "scheduled">;
};

export type ConfirmTaskResult = {
  id: UUID;
  status: Extract<TaskStatus, "planned">;
  confirmedAt: Date;
  reminders: TaskReminder[];
};

export type TaskRow = Selectable<TasksTable>;
export type TaskTargetRow = Selectable<TaskTargetsTable>;
export type TaskReminderRow = Selectable<TaskRemindersTable>;

export interface TasksRepository {
  list(accountId: UUID, filters: ListTasksFilters, db?: DbHandle): Promise<PaginatedTasks>;
  findById(accountId: UUID, taskId: UUID, db?: DbHandle): Promise<Task | null>;
  getDetail(accountId: UUID, taskId: UUID, db?: DbHandle): Promise<TaskDetail | null>;
  create(input: CreateTaskInput, db?: DbHandle): Promise<Task>;
  update(accountId: UUID, taskId: UUID, patch: UpdateTaskInput, db?: DbHandle): Promise<Task | null>;
  replaceTargets(taskId: UUID, targets: CreateTaskTargetInput[], db?: DbHandle): Promise<TaskTarget[]>;
  createReminders(inputs: CreateTaskReminderInput[], db?: DbHandle): Promise<TaskReminder[]>;
  listReminders(taskId: UUID, db?: DbHandle): Promise<TaskReminder[]>;
  deleteReminders(taskId: UUID, db?: DbHandle): Promise<void>;
  cancelScheduledReminders(taskId: UUID, db?: DbHandle): Promise<void>;
  getPlaceTimezone(accountId: UUID, placeId: UUID | null, db?: DbHandle): Promise<string | null>;
}
