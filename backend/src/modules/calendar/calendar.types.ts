import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type { ActivityType } from "../activities/activities.types.js";
import type { TaskStatus, TaskType } from "../tasks/tasks.types.js";
import type { ProblemStatus } from "../problems/problems.types.js";

export type CalendarQuery = {
  from: string;
  to: string;
  placeId?: UUID;
};

export type CalendarActivityItem = {
  id: UUID;
  type: "activity";
  activityType: ActivityType;
  dateTime: Date;
  title: string;
  placeId: UUID | null;
  targetSummary: string;
};

export type CalendarTaskItem = {
  id: UUID;
  type: "task";
  taskType: TaskType;
  dueDate: string;
  status: TaskStatus;
  title: string;
  placeId: UUID | null;
  targetSummary: string;
};

export type CalendarQuarantinePeriodItem = {
  id: UUID;
  type: "quarantine";
  startsOn: string;
  endsOn: string;
  title: string;
  activityId: UUID;
  productId: UUID;
  productName: string;
  placeId: UUID | null;
};

export type CalendarWeatherEventItem = {
  id: UUID;
  type: "weather";
  date: string;
  eventType: string;
  userConfirmationStatus: string | null;
  placeId: UUID;
};

export type CalendarProblemItem = {
  id: UUID;
  type: "problem";
  date: string;
  title: string;
  status: ProblemStatus;
  placeId: UUID | null;
  isResolutionEntry: boolean;
};

export type CalendarFeed = {
  activities: CalendarActivityItem[];
  tasks: CalendarTaskItem[];
  quarantinePeriods: CalendarQuarantinePeriodItem[];
  weatherEvents: CalendarWeatherEventItem[];
  problemDates: string[];
  problems: CalendarProblemItem[];
};

export interface CalendarRepository {
  ensurePlaceBelongsToAccount(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<void>;
  listActivities(accountId: UUID, query: CalendarQuery, db?: DbHandle): Promise<CalendarActivityItem[]>;
  listTasks(accountId: UUID, query: CalendarQuery, db?: DbHandle): Promise<CalendarTaskItem[]>;
  listQuarantinePeriods(accountId: UUID, query: CalendarQuery, db?: DbHandle): Promise<CalendarQuarantinePeriodItem[]>;
  listWeatherEvents(accountId: UUID, query: CalendarQuery, db?: DbHandle): Promise<CalendarWeatherEventItem[]>;
  listProblemDates(accountId: UUID, query: CalendarQuery, db?: DbHandle): Promise<string[]>;
  listProblems(accountId: UUID, query: CalendarQuery, db?: DbHandle): Promise<CalendarProblemItem[]>;
}
