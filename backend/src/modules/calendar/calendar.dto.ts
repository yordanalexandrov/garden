import type {
  CalendarActivityItem,
  CalendarFeed,
  CalendarQuarantinePeriodItem,
  CalendarTaskItem,
  CalendarWeatherEventItem
} from "./calendar.types.js";

export function toCalendarFeedDto(feed: CalendarFeed): CalendarFeedDto {
  return {
    activities: feed.activities.map(toCalendarActivityDto),
    tasks: feed.tasks.map(toCalendarTaskDto),
    quarantinePeriods: feed.quarantinePeriods.map(toCalendarQuarantinePeriodDto),
    weatherEvents: feed.weatherEvents.map(toCalendarWeatherEventDto)
  };
}

function toCalendarActivityDto(item: CalendarActivityItem): CalendarActivityDto {
  return {
    id: item.id,
    type: item.type,
    activityType: item.activityType,
    dateTime: item.dateTime.toISOString(),
    title: item.title,
    placeId: item.placeId,
    targetSummary: item.targetSummary
  };
}

function toCalendarTaskDto(item: CalendarTaskItem): CalendarTaskDto {
  return { ...item };
}

function toCalendarQuarantinePeriodDto(item: CalendarQuarantinePeriodItem): CalendarQuarantinePeriodDto {
  return { ...item };
}

function toCalendarWeatherEventDto(item: CalendarWeatherEventItem): CalendarWeatherEventDto {
  return { ...item };
}

type CalendarActivityDto = Omit<CalendarActivityItem, "dateTime"> & {
  dateTime: string;
};

type CalendarTaskDto = CalendarTaskItem;
type CalendarQuarantinePeriodDto = CalendarQuarantinePeriodItem;
type CalendarWeatherEventDto = CalendarWeatherEventItem;

type CalendarFeedDto = {
  activities: CalendarActivityDto[];
  tasks: CalendarTaskDto[];
  quarantinePeriods: CalendarQuarantinePeriodDto[];
  weatherEvents: CalendarWeatherEventDto[];
};
