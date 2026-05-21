import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { toPlantDetailDto, toPlantListItemDto, toPlantMutationDto } from "./plants.dto.js";
import { KyselyPlantsRepository } from "./plants.repository.js";
import { PlantsService, type CreatePlantServiceInput } from "./plants.service.js";
import type { ListPlantsFilters, UpdatePlantInput } from "./plants.types.js";
import {
  createPlantBodySchema,
  type CreatePlantBody,
  listPlantsQuerySchema,
  type ListPlantsQuery,
  plantParamsSchema,
  updatePlantBodySchema,
  type UpdatePlantBody
} from "./plants.validation.js";

export type PlantsRouteOptions = {
  db?: DbClient;
};

export const registerPlantsRoutes: FastifyPluginCallback<PlantsRouteOptions> = (app, options, done) => {
  const plantsService =
    options.db === undefined ? undefined : new PlantsService(new KyselyPlantsRepository(options.db));
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { query } = validateRequest(request, { query: listPlantsQuerySchema });
    const result = await requirePlantsService(plantsService).listPlants(actor, toListPlantsFilters(query));

    return successEnvelope({
      items: result.items.map(toPlantListItemDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  app.post("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: createPlantBodySchema });
    const plant = await requirePlantsService(plantsService).createPlant(actor, toCreatePlantInput(body));

    return successEnvelope(toPlantMutationDto(plant));
  });

  app.get("/:plantId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: plantParamsSchema });
    const plant = await requirePlantsService(plantsService).getPlant(actor, params.plantId);

    return successEnvelope(toPlantDetailDto(plant));
  });

  app.patch("/:plantId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: plantParamsSchema,
      body: updatePlantBodySchema
    });
    const plant = await requirePlantsService(plantsService).updatePlant(actor, params.plantId, toUpdatePlantInput(body));

    return successEnvelope(toPlantMutationDto(plant));
  });

  app.post("/:plantId/archive", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: plantParamsSchema });
    await requirePlantsService(plantsService).archivePlant(actor, params.plantId);

    return successEnvelope({ archived: true });
  });

  done();
};

function requirePlantsService(service: PlantsService | undefined): PlantsService {
  if (service === undefined) {
    throw new Error("Plants routes require a database client");
  }

  return service;
}

function toListPlantsFilters(query: ListPlantsQuery): ListPlantsFilters {
  const filters: ListPlantsFilters = {
    includeArchived: query.includeArchived,
    page: query.page,
    pageSize: query.pageSize
  };

  if (query.q !== undefined) {
    filters.q = query.q;
  }

  if (query.lifecycleType !== undefined) {
    filters.lifecycleType = query.lifecycleType;
  }

  if (query.growingStyle !== undefined) {
    filters.growingStyle = query.growingStyle;
  }

  return filters;
}

function toCreatePlantInput(body: CreatePlantBody): CreatePlantServiceInput {
  const input: CreatePlantServiceInput = {
    commonName: body.commonName,
    lifecycleType: body.lifecycleType,
    growingStyle: body.growingStyle
  };

  if (body.variety !== undefined) {
    input.variety = body.variety;
  }

  if (body.plantCategory !== undefined) {
    input.plantCategory = body.plantCategory;
  }

  if (body.notes !== undefined) {
    input.notes = body.notes;
  }

  return input;
}

function toUpdatePlantInput(body: UpdatePlantBody): UpdatePlantInput {
  const patch: UpdatePlantInput = {};

  if (body.commonName !== undefined) {
    patch.commonName = body.commonName;
  }

  if (body.variety !== undefined) {
    patch.variety = body.variety;
  }

  if (body.plantCategory !== undefined) {
    patch.plantCategory = body.plantCategory;
  }

  if (body.lifecycleType !== undefined) {
    patch.lifecycleType = body.lifecycleType;
  }

  if (body.growingStyle !== undefined) {
    patch.growingStyle = body.growingStyle;
  }

  if (body.notes !== undefined) {
    patch.notes = body.notes;
  }

  return patch;
}
