import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { KyselyPlacesRepository } from "../places/places.repository.js";
import { KyselyPlantsRepository } from "../plants/plants.repository.js";
import { toPerennialDetailDto, toPerennialListItemDto, toPerennialMutationDto } from "./perennials.dto.js";
import { KyselyPerennialsRepository } from "./perennials.repository.js";
import { PerennialsService, type CreatePerennialServiceInput } from "./perennials.service.js";
import type { ListPerennialsFilters, UpdatePerennialInput } from "./perennials.types.js";
import {
  createPerennialBodySchema,
  type CreatePerennialBody,
  listPerennialsQuerySchema,
  type ListPerennialsQuery,
  perennialParamsSchema,
  placePerennialsParamsSchema,
  updatePerennialBodySchema,
  type UpdatePerennialBody
} from "./perennials.validation.js";

export type PerennialsRouteOptions = {
  db?: DbClient;
};

export const registerPlacePerennialsRoutes: FastifyPluginCallback<PerennialsRouteOptions> = (app, options, done) => {
  const perennialsService = createPerennialsService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, query } = validateRequest(request, {
      params: placePerennialsParamsSchema,
      query: listPerennialsQuerySchema
    });
    const result = await requirePerennialsService(perennialsService).listPerennials(
      actor,
      params.placeId,
      toListPerennialsFilters(query)
    );

    return successEnvelope({
      items: result.items.map(toPerennialListItemDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  app.post("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: placePerennialsParamsSchema,
      body: createPerennialBodySchema
    });
    const perennial = await requirePerennialsService(perennialsService).createPerennial(
      actor,
      params.placeId,
      toCreatePerennialInput(body)
    );

    return successEnvelope(toPerennialMutationDto(perennial));
  });

  done();
};

export const registerPerennialsRoutes: FastifyPluginCallback<PerennialsRouteOptions> = (app, options, done) => {
  const perennialsService = createPerennialsService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/:perennialId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: perennialParamsSchema });
    const perennial = await requirePerennialsService(perennialsService).getPerennial(actor, params.perennialId);

    return successEnvelope(toPerennialDetailDto(perennial));
  });

  app.patch("/:perennialId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: perennialParamsSchema,
      body: updatePerennialBodySchema
    });
    const perennial = await requirePerennialsService(perennialsService).updatePerennial(
      actor,
      params.perennialId,
      toUpdatePerennialInput(body)
    );

    return successEnvelope(toPerennialMutationDto(perennial));
  });

  app.post("/:perennialId/archive", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: perennialParamsSchema });
    await requirePerennialsService(perennialsService).archivePerennial(actor, params.perennialId);

    return successEnvelope({ archived: true });
  });

  done();
};

function createPerennialsService(db: DbClient | undefined): PerennialsService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new PerennialsService(
    new KyselyPerennialsRepository(db),
    new KyselyPlacesRepository(db),
    new KyselyPlantsRepository(db)
  );
}

function requirePerennialsService(service: PerennialsService | undefined): PerennialsService {
  if (service === undefined) {
    throw new Error("Perennials routes require a database client");
  }

  return service;
}

function toListPerennialsFilters(query: ListPerennialsQuery): ListPerennialsFilters {
  const filters: ListPerennialsFilters = {
    page: query.page,
    pageSize: query.pageSize
  };

  if (query.q !== undefined) {
    filters.q = query.q;
  }

  if (query.status !== undefined) {
    filters.status = query.status;
  }

  return filters;
}

function toCreatePerennialInput(body: CreatePerennialBody): CreatePerennialServiceInput {
  const input: CreatePerennialServiceInput = {
    plantId: body.plantId
  };

  if (body.label !== undefined) {
    input.label = body.label;
  }

  if (body.plantedYear !== undefined) {
    input.plantedYear = body.plantedYear;
  }

  if (body.notes !== undefined) {
    input.notes = body.notes;
  }

  return input;
}

function toUpdatePerennialInput(body: UpdatePerennialBody): UpdatePerennialInput {
  const patch: UpdatePerennialInput = {};

  if (body.plantId !== undefined) {
    patch.plantId = body.plantId;
  }

  if (body.label !== undefined) {
    patch.label = body.label;
  }

  if (body.plantedYear !== undefined) {
    patch.plantedYear = body.plantedYear;
  }

  if (body.notes !== undefined) {
    patch.notes = body.notes;
  }

  if (body.status !== undefined) {
    patch.status = body.status;
  }

  return patch;
}
