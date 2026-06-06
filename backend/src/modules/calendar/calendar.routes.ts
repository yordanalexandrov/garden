import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { toCalendarFeedDto } from "./calendar.dto.js";
import { KyselyCalendarRepository } from "./calendar.repository.js";
import { CalendarService } from "./calendar.service.js";
import type { CalendarQuery } from "./calendar.types.js";
import { calendarQuerySchema, type CalendarQueryInput } from "./calendar.validation.js";

export type CalendarRouteOptions = {
  db?: DbClient;
};

export const registerCalendarRoutes: FastifyPluginCallback<CalendarRouteOptions> = (app, options, done) => {
  const calendarService = createCalendarService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { query } = validateRequest(request, { query: calendarQuerySchema });
    const result = await requireCalendarService(calendarService).getCalendarFeed(actor, toCalendarQuery(query));

    return successEnvelope(toCalendarFeedDto(result));
  });

  done();
};

function createCalendarService(db: DbClient | undefined): CalendarService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new CalendarService(new KyselyCalendarRepository(db));
}

function requireCalendarService(service: CalendarService | undefined): CalendarService {
  if (service === undefined) {
    throw new Error("Calendar routes require a database client");
  }

  return service;
}

function toCalendarQuery(query: CalendarQueryInput): CalendarQuery {
  return {
    from: query.from,
    to: query.to,
    ...(query.placeId === undefined ? {} : { placeId: query.placeId })
  };
}
