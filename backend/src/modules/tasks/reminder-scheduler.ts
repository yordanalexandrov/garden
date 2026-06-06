import type { CreateTaskReminderInput, ReminderType, TaskStatus } from "./tasks.types.js";

export type BuildTaskRemindersInput = {
  taskId: string;
  dueDate: string;
  status: TaskStatus;
  timezone?: string | null;
};

export function buildTaskReminders(input: BuildTaskRemindersInput): CreateTaskReminderInput[] {
  if (input.status !== "planned") {
    throw new Error("Task reminders can only be built for planned tasks");
  }

  const timezone = input.timezone ?? "UTC";
  const dayBefore = addDays(input.dueDate, -1);

  return [
    buildReminder(input.taskId, "day_before", dayBefore, timezone),
    buildReminder(input.taskId, "same_day", input.dueDate, timezone)
  ];
}

function buildReminder(taskId: string, reminderType: ReminderType, date: string, timezone: string): CreateTaskReminderInput {
  return {
    taskId,
    reminderType,
    scheduledFor: localTimeToUtcDate(date, "09:00:00", timezone),
    status: "scheduled"
  };
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function localTimeToUtcDate(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute, second] = time.split(":").map(Number);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined ||
    second === undefined
  ) {
    throw new Error("Invalid local date/time");
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = timezoneOffsetMilliseconds(new Date(utcGuess), timezone);
  return new Date(utcGuess - offset);
}

function timezoneOffsetMilliseconds(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(values.get("year"));
  const month = Number(values.get("month"));
  const day = Number(values.get("day"));
  const hour = Number(values.get("hour"));
  const minute = Number(values.get("minute"));
  const second = Number(values.get("second"));

  return Date.UTC(year, month - 1, day, hour, minute, second) - date.getTime();
}
