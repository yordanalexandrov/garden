import { describe, expect, it } from "vitest";

import { buildTaskReminders } from "../../src/modules/tasks/reminder-scheduler.js";

describe("task reminder scheduler", () => {
  it("creates day-before and same-day reminders at 09:00 in the place timezone", () => {
    const reminders = buildTaskReminders({
      taskId: "11111111-1111-4111-8111-111111111111",
      dueDate: "2026-05-20",
      status: "planned",
      timezone: "Europe/Sofia"
    });

    expect(reminders.map((reminder) => reminder.reminderType)).toEqual(["day_before", "same_day"]);
    expect(reminders.map((reminder) => reminder.scheduledFor.toISOString())).toEqual([
      "2026-05-19T06:00:00.000Z",
      "2026-05-20T06:00:00.000Z"
    ]);
  });

  it("falls back to UTC and rejects non-planned tasks", () => {
    expect(
      buildTaskReminders({
        taskId: "11111111-1111-4111-8111-111111111111",
        dueDate: "2026-05-20",
        status: "planned"
      }).map((reminder) => reminder.scheduledFor.toISOString())
    ).toEqual(["2026-05-19T09:00:00.000Z", "2026-05-20T09:00:00.000Z"]);

    expect(() =>
      buildTaskReminders({
        taskId: "11111111-1111-4111-8111-111111111111",
        dueDate: "2026-05-20",
        status: "suggested"
      })
    ).toThrow("planned");
  });
});
