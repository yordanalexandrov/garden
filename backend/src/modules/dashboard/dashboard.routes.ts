import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { toDashboardSummaryDto } from "./dashboard.dto.js";
import { KyselyDashboardRepository } from "./dashboard.repository.js";
import { DashboardService } from "./dashboard.service.js";
import type { DashboardQuery } from "./dashboard.types.js";
import { dashboardQuerySchema, type DashboardQueryInput } from "./dashboard.validation.js";

export type DashboardRouteOptions = {
  db?: DbClient;
};

export const registerDashboardRoutes: FastifyPluginCallback<DashboardRouteOptions> = (app, options, done) => {
  const dashboardService = createDashboardService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { query } = validateRequest(request, { query: dashboardQuerySchema });
    const result = await requireDashboardService(dashboardService).getDashboard(actor, toDashboardQuery(query));

    return successEnvelope(toDashboardSummaryDto(result));
  });

  done();
};

function createDashboardService(db: DbClient | undefined): DashboardService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new DashboardService(new KyselyDashboardRepository(db));
}

function requireDashboardService(service: DashboardService | undefined): DashboardService {
  if (service === undefined) {
    throw new Error("Dashboard routes require a database client");
  }

  return service;
}

function toDashboardQuery(query: DashboardQueryInput): DashboardQuery {
  return {
    ...(query.placeId === undefined ? {} : { placeId: query.placeId })
  };
}
