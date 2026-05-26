import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { KyselyInventoryRepository } from "../inventory/inventory.repository.js";
import { KyselyProductsRepository } from "../products/products.repository.js";
import { KyselyTargetResolverRepository } from "../targets/target-resolver.repository.js";
import { BackendTargetResolver } from "../targets/target-resolver.service.js";
import { toActivityDetailDto, toActivityListItemDto, toCreateActivityResultDto } from "./activities.dto.js";
import { KyselyActivitiesRepository } from "./activities.repository.js";
import { ActivitiesService } from "./activities.service.js";
import type { CreateActivityRequest, ListActivitiesFilters } from "./activities.types.js";
import {
  activityListQuerySchema,
  activityParamsSchema,
  createActivityBodySchema,
  type ActivityListQuery,
  type CreateActivityBody
} from "./activities.validation.js";

export type ActivitiesRouteOptions = {
  db?: DbClient;
};

export const registerActivitiesRoutes: FastifyPluginCallback<ActivitiesRouteOptions> = (app, options, done) => {
  const activitiesService = createActivitiesService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { query } = validateRequest(request, { query: activityListQuerySchema });
    const result = await requireActivitiesService(activitiesService).listActivities(actor, toListActivitiesFilters(query));

    return successEnvelope({
      items: result.items.map(toActivityListItemDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  app.post("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: createActivityBodySchema });
    const result = await requireActivitiesService(activitiesService).createActivity(actor, toCreateActivityRequest(body));

    return successEnvelope(toCreateActivityResultDto(result));
  });

  app.get("/:activityId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: activityParamsSchema });
    const result = await requireActivitiesService(activitiesService).getActivity(actor, params.activityId);

    return successEnvelope(toActivityDetailDto(result));
  });

  done();
};

function createActivitiesService(db: DbClient | undefined): ActivitiesService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new ActivitiesService(
    new KyselyActivitiesRepository(db),
    new KyselyProductsRepository(db),
    new KyselyInventoryRepository(db),
    new BackendTargetResolver(new KyselyTargetResolverRepository(db)),
    db
  );
}

function requireActivitiesService(service: ActivitiesService | undefined): ActivitiesService {
  if (service === undefined) {
    throw new Error("Activities routes require a database client");
  }

  return service;
}

function toListActivitiesFilters(query: ActivityListQuery): ListActivitiesFilters {
  const filters: ListActivitiesFilters = {
    page: query.page,
    pageSize: query.pageSize
  };

  if (query.placeId !== undefined) {
    filters.placeId = query.placeId;
  }

  if (query.type !== undefined) {
    filters.type = query.type;
  }

  if (query.from !== undefined) {
    filters.from = new Date(query.from);
  }

  if (query.to !== undefined) {
    filters.to = new Date(query.to);
  }

  if (query.targetType !== undefined) {
    filters.targetType = query.targetType;
  }

  if (query.targetId !== undefined) {
    filters.targetId = query.targetId;
  }

  return filters;
}

function toCreateActivityRequest(body: CreateActivityBody): CreateActivityRequest {
  const request: CreateActivityRequest = {
    placeId: body.placeId,
    type: body.type,
    performedAt: new Date(body.performedAt),
    targetScopeType: body.targetScopeType,
    allowInventoryShortage: body.allowInventoryShortage
  };

  if (body.targetSelection !== undefined) {
    request.targetSelection = {
      ...(body.targetSelection.perennialIds === undefined ? {} : { perennialIds: body.targetSelection.perennialIds }),
      ...(body.targetSelection.bedIds === undefined ? {} : { bedIds: body.targetSelection.bedIds }),
      ...(body.targetSelection.yearlyPlantingIds === undefined
        ? {}
        : { yearlyPlantingIds: body.targetSelection.yearlyPlantingIds }),
      ...(body.targetSelection.persistentBedPlantIds === undefined
        ? {}
        : { persistentBedPlantIds: body.targetSelection.persistentBedPlantIds })
    };
  }

  if (body.notes !== undefined) {
    request.notes = body.notes;
  }

  if (body.productUsages !== undefined) {
    request.productUsages = body.productUsages.map((usage) => ({
      productId: usage.productId,
      quantityUsed: usage.quantityUsed,
      unit: usage.unit,
      ...(usage.productUsageRuleId === undefined ? {} : { productUsageRuleId: usage.productUsageRuleId }),
      ...(usage.notes === undefined ? {} : { notes: usage.notes })
    }));
  }

  return request;
}
