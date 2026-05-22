import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { KyselyBedsRepository } from "../beds/beds.repository.js";
import { KyselyPlantsRepository } from "../plants/plants.repository.js";
import {
  toPersistentBedPlantListItemDto,
  toPersistentBedPlantMutationDto
} from "./persistent-bed-plants.dto.js";
import { KyselyPersistentBedPlantsRepository } from "./persistent-bed-plants.repository.js";
import {
  PersistentBedPlantsService,
  type CreatePersistentBedPlantServiceInput
} from "./persistent-bed-plants.service.js";
import type { ListPersistentBedPlantsFilters, UpdatePersistentBedPlantInput } from "./persistent-bed-plants.types.js";
import {
  bedPersistentPlantsParamsSchema,
  createPersistentBedPlantBodySchema,
  type CreatePersistentBedPlantBody,
  listPersistentBedPlantsQuerySchema,
  type ListPersistentBedPlantsQuery,
  persistentBedPlantParamsSchema,
  updatePersistentBedPlantBodySchema,
  type UpdatePersistentBedPlantBody
} from "./persistent-bed-plants.validation.js";

export type PersistentBedPlantsRouteOptions = {
  db?: DbClient;
};

export const registerBedPersistentPlantsRoutes: FastifyPluginCallback<PersistentBedPlantsRouteOptions> = (
  app,
  options,
  done
) => {
  const persistentBedPlantsService = createPersistentBedPlantsService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, query } = validateRequest(request, {
      params: bedPersistentPlantsParamsSchema,
      query: listPersistentBedPlantsQuerySchema
    });
    const result = await requirePersistentBedPlantsService(persistentBedPlantsService).listPersistentBedPlants(
      actor,
      params.bedId,
      toListPersistentBedPlantsFilters(query)
    );

    return successEnvelope({
      items: result.items.map(toPersistentBedPlantListItemDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  app.post("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: bedPersistentPlantsParamsSchema,
      body: createPersistentBedPlantBodySchema
    });
    const persistentBedPlant = await requirePersistentBedPlantsService(
      persistentBedPlantsService
    ).createPersistentBedPlant(actor, params.bedId, toCreatePersistentBedPlantInput(body));

    return successEnvelope(toPersistentBedPlantMutationDto(persistentBedPlant));
  });

  done();
};

export const registerPersistentBedPlantsRoutes: FastifyPluginCallback<PersistentBedPlantsRouteOptions> = (
  app,
  options,
  done
) => {
  const persistentBedPlantsService = createPersistentBedPlantsService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.patch("/:id", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: persistentBedPlantParamsSchema,
      body: updatePersistentBedPlantBodySchema
    });
    const persistentBedPlant = await requirePersistentBedPlantsService(
      persistentBedPlantsService
    ).updatePersistentBedPlant(actor, params.id, toUpdatePersistentBedPlantInput(body));

    return successEnvelope(toPersistentBedPlantMutationDto(persistentBedPlant));
  });

  app.post("/:id/archive", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: persistentBedPlantParamsSchema });
    await requirePersistentBedPlantsService(persistentBedPlantsService).archivePersistentBedPlant(actor, params.id);

    return successEnvelope({ archived: true });
  });

  done();
};

function createPersistentBedPlantsService(db: DbClient | undefined): PersistentBedPlantsService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new PersistentBedPlantsService(
    new KyselyPersistentBedPlantsRepository(db),
    new KyselyBedsRepository(db),
    new KyselyPlantsRepository(db)
  );
}

function requirePersistentBedPlantsService(service: PersistentBedPlantsService | undefined): PersistentBedPlantsService {
  if (service === undefined) {
    throw new Error("Persistent bed plants routes require a database client");
  }

  return service;
}

function toListPersistentBedPlantsFilters(query: ListPersistentBedPlantsQuery): ListPersistentBedPlantsFilters {
  const filters: ListPersistentBedPlantsFilters = {
    page: query.page,
    pageSize: query.pageSize
  };

  if (query.status !== undefined) {
    filters.status = query.status;
  }

  return filters;
}

function toCreatePersistentBedPlantInput(body: CreatePersistentBedPlantBody): CreatePersistentBedPlantServiceInput {
  const input: CreatePersistentBedPlantServiceInput = {
    plantId: body.plantId
  };

  if (body.plantedYear !== undefined) {
    input.plantedYear = body.plantedYear;
  }

  if (body.quantity !== undefined) {
    input.quantity = body.quantity;
  }

  if (body.notes !== undefined) {
    input.notes = body.notes;
  }

  return input;
}

function toUpdatePersistentBedPlantInput(body: UpdatePersistentBedPlantBody): UpdatePersistentBedPlantInput {
  const patch: UpdatePersistentBedPlantInput = {};

  if (body.plantId !== undefined) {
    patch.plantId = body.plantId;
  }

  if (body.plantedYear !== undefined) {
    patch.plantedYear = body.plantedYear;
  }

  if (body.quantity !== undefined) {
    patch.quantity = body.quantity;
  }

  if (body.notes !== undefined) {
    patch.notes = body.notes;
  }

  if (body.status !== undefined) {
    patch.status = body.status;
  }

  return patch;
}
