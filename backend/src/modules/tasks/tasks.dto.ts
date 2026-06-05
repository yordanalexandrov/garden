import type { ConfirmTaskResult, PaginatedTasks, TaskDetail, TaskListItem, TaskReminder } from "./tasks.types.js";

export function toTaskListDto(tasks: PaginatedTasks): TaskListDto {
  return {
    items: tasks.items.map(toTaskListItemDto),
    page: tasks.page,
    pageSize: tasks.pageSize,
    total: tasks.total
  };
}

export function toTaskDetailDto(task: TaskDetail): TaskDetailDto {
  return {
    id: task.id,
    placeId: task.placeId,
    type: task.type,
    dueDate: task.dueDate,
    status: task.status,
    sourceType: task.sourceType,
    sourceReferenceId: task.sourceReferenceId,
    targetScopeType: task.targetScopeType,
    targets: task.targets,
    reminders: task.reminders.map(toTaskReminderDto),
    weatherEvents: task.weatherEvents.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      forecastedRain: event.forecastedRain,
      observedRain: event.observedRain,
      userConfirmationStatus: event.userConfirmationStatus,
      createdAt: event.createdAt.toISOString()
    })),
    notes: task.notes,
    confirmedAt: task.confirmedAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null
  };
}

export function toTaskMutationDto(task: TaskDetail): TaskMutationDto {
  return toTaskDetailDto(task);
}

export function toConfirmTaskResultDto(result: ConfirmTaskResult): ConfirmTaskResultDto {
  return {
    id: result.id,
    status: result.status,
    confirmedAt: result.confirmedAt.toISOString(),
    reminders: result.reminders.map(toTaskReminderDto)
  };
}

function toTaskListItemDto(item: TaskListItem): TaskListItemDto {
  return {
    id: item.id,
    placeId: item.placeId,
    type: item.type,
    dueDate: item.dueDate,
    status: item.status,
    targetScopeType: item.targetScopeType,
    targetSummary: item.targetSummary,
    sourceType: item.sourceType,
    notes: item.notes
  };
}

function toTaskReminderDto(reminder: TaskReminder): TaskReminderDto {
  return {
    id: reminder.id,
    reminderType: reminder.reminderType,
    scheduledFor: reminder.scheduledFor.toISOString(),
    status: reminder.status,
    sentAt: reminder.sentAt?.toISOString() ?? null
  };
}

type TaskListItemDto = TaskListItem;

type TaskListDto = {
  items: TaskListItemDto[];
  page: number;
  pageSize: number;
  total: number;
};

type TaskReminderDto = {
  id: string;
  reminderType: string;
  scheduledFor: string;
  status: string;
  sentAt: string | null;
};

type TaskDetailDto = Omit<TaskDetail, "accountId" | "createdAt" | "updatedAt" | "confirmedAt" | "completedAt" | "reminders" | "weatherEvents"> & {
  reminders: TaskReminderDto[];
  weatherEvents: Array<{
    id: string;
    eventType: string;
    forecastedRain: boolean | null;
    observedRain: boolean | null;
    userConfirmationStatus: string | null;
    createdAt: string;
  }>;
  confirmedAt: string | null;
  completedAt: string | null;
};

type TaskMutationDto = TaskDetailDto;

type ConfirmTaskResultDto = {
  id: string;
  status: "planned";
  confirmedAt: string;
  reminders: TaskReminderDto[];
};
