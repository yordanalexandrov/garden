import { ActivityType } from '../activities/activities.models';
import { TaskStatus, TaskType } from '../tasks/tasks.models';

export interface CalendarQuery {
  readonly from: string;
  readonly to: string;
  readonly placeId?: string;
}

export interface CalendarActivityItem {
  readonly id: string;
  readonly type: 'activity';
  readonly activityType: ActivityType;
  readonly dateTime: string;
  readonly title: string;
  readonly placeId: string | null;
  readonly targetSummary: string;
}

export interface CalendarTaskItem {
  readonly id: string;
  readonly type: 'task';
  readonly taskType: TaskType;
  readonly dueDate: string;
  readonly status: TaskStatus;
  readonly title: string;
  readonly placeId: string | null;
  readonly targetSummary: string;
}

export interface CalendarQuarantinePeriodItem {
  readonly id: string;
  readonly type: 'quarantine';
  readonly startsOn: string;
  readonly endsOn: string;
  readonly title: string;
  readonly activityId: string;
  readonly productId: string;
  readonly placeId: string | null;
}

export interface CalendarWeatherEventItem {
  readonly id: string;
  readonly type: 'weather';
  readonly date: string;
  readonly eventType: string;
  readonly userConfirmationStatus: string | null;
  readonly placeId: string;
}

export interface CalendarFeed {
  readonly activities: readonly CalendarActivityItem[];
  readonly tasks: readonly CalendarTaskItem[];
  readonly quarantinePeriods: readonly CalendarQuarantinePeriodItem[];
  readonly weatherEvents: readonly CalendarWeatherEventItem[];
}

export type CalendarItem =
  | CalendarActivityItem
  | CalendarTaskItem
  | CalendarQuarantinePeriodItem
  | CalendarWeatherEventItem;

export interface CalendarDay {
  readonly date: string;
  readonly dayNumber: number;
  readonly inMonth: boolean;
  readonly items: readonly CalendarItem[];
}
