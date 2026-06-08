import type { AuthenticatedActor } from "../auth/auth.types.js";
import type { CalendarFeed, CalendarQuery, CalendarRepository } from "./calendar.types.js";

export class CalendarService {
  constructor(private readonly calendarRepository: CalendarRepository) {}

  async getCalendarFeed(actor: AuthenticatedActor, input: CalendarQuery): Promise<CalendarFeed> {
    if (input.placeId !== undefined) {
      await this.calendarRepository.ensurePlaceBelongsToAccount(actor.accountId, input.placeId);
    }

    const [activities, tasks, quarantinePeriods, weatherEvents] = await Promise.all([
      this.calendarRepository.listActivities(actor.accountId, input),
      this.calendarRepository.listTasks(actor.accountId, input),
      this.calendarRepository.listQuarantinePeriods(actor.accountId, input),
      this.calendarRepository.listWeatherEvents(actor.accountId, input)
    ]);

    return {
      activities,
      tasks,
      quarantinePeriods,
      weatherEvents
    };
  }
}
