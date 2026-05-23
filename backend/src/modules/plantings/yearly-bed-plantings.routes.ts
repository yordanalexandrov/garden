import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { KyselyBedsRepository } from "../beds/beds.repository.js";
import { KyselyPlantsRepository } from "../plants/plants.repository.js";
import {
  toYearlyBedPlantingListItemDto,
  toYearlyBedPlantingMutationDto
} from "./yearly-bed-plantings.dto.js";
import { KyselyYearlyBedPlantingsRepository } from "./yearly-bed-plantings.repository.js";
import {
  YearlyBedPlantingsService,
  type CreateYearlyBedPlantingServiceInput
} from "./yearly-bed-plantings.service.js";
import type { ListYearlyBedPlantingsFilters, UpdateYearlyBedPlantingInput } from "./yearly-bed-plantings.types.js";
import {
  bedPlantingsParamsSchema,
  createYearlyBedPlantingBodySchema,
  type CreateYearlyBedPlantingBody,
  listYearlyBedPlantingsQuerySchema,
  type ListYearlyBedPlantingsQuery,
  updateYearlyBedPlantingBodySchema,
  type UpdateYearlyBedPlantingBody,
  yearlyBedPlantingParamsSchema
} from "./yearly-bed-plantings.validation.js";

export type YearlyBedPlantingsRouteOptions = {
  db?: DbClient;
};

export const registerBedPlantingsRoutes: FastifyPluginCallback<YearlyBedPlantingsRouteOptions> = (
  app,
  options,
  done
) => {
  const yearlyBedPlantingsService = createYearlyBedPlantingsService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, query } = validateRequest(request, {
      params: bedPlantingsParamsSchema,
      query: listYearlyBedPlantingsQuerySchema
    });
    const result = await requireYearlyBedPlantingsService(yearlyBedPlantingsService).listYearlyBedPlantings(
      actor,
      params.bedId,
      toListYearlyBedPlantingsFilters(query)
    );

    return successEnvelope({
      items: result.items.map(toYearlyBedPlantingListItemDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  app.post("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: bedPlantingsParamsSchema,
      body: createYearlyBedPlantingBodySchema
    });
    const yearlyBedPlanting = await requireYearlyBedPlantingsService(
      yearlyBedPlantingsService
    ).createYearlyBedPlanting(actor, params.bedId, toCreateYearlyBedPlantingInput(body));

    return successEnvelope(toYearlyBedPlantingMutationDto(yearlyBedPlanting));
  });

  done();
};

export const registerYearlyBedPlantingsRoutes: FastifyPluginCallback<YearlyBedPlantingsRouteOptions> = (
  app,
  options,
  done
) => {
  const yearlyBedPlantingsService = createYearlyBedPlantingsService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.patch("/:plantingId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: yearlyBedPlantingParamsSchema,
      body: updateYearlyBedPlantingBodySchema
    });
    const yearlyBedPlanting = await requireYearlyBedPlantingsService(
      yearlyBedPlantingsService
    ).updateYearlyBedPlanting(actor, params.plantingId, toUpdateYearlyBedPlantingInput(body));

    return successEnvelope(toYearlyBedPlantingMutationDto(yearlyBedPlanting));
  });

  app.post("/:plantingId/archive", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: yearlyBedPlantingParamsSchema });
    await requireYearlyBedPlantingsService(yearlyBedPlantingsService).archiveYearlyBedPlanting(
      actor,
      params.plantingId
    );

    return successEnvelope({ archived: true });
  });

  done();
};

function createYearlyBedPlantingsService(db: DbClient | undefined): YearlyBedPlantingsService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new YearlyBedPlantingsService(
    new KyselyYearlyBedPlantingsRepository(db),
    new KyselyBedsRepository(db),
    new KyselyPlantsRepository(db)
  );
}

function requireYearlyBedPlantingsService(
  service: YearlyBedPlantingsService | undefined
): YearlyBedPlantingsService {
  if (service === undefined) {
    throw new Error("Yearly bed plantings routes require a database client");
  }

  return service;
}

function toListYearlyBedPlantingsFilters(query: ListYearlyBedPlantingsQuery): ListYearlyBedPlantingsFilters {
  const filters: ListYearlyBedPlantingsFilters = {
    year: query.year ?? new Date().getFullYear(),
    page: query.page,
    pageSize: query.pageSize
  };

  if (query.status !== undefined) {
    filters.status = query.status;
  }

  return filters;
}

function toCreateYearlyBedPlantingInput(body: CreateYearlyBedPlantingBody): CreateYearlyBedPlantingServiceInput {
  const input: CreateYearlyBedPlantingServiceInput = {
    plantId: body.plantId,
    year: body.year,
    status: body.status
  };

  if (body.quantity !== undefined) {
    input.quantity = body.quantity;
  }

  if (body.notes !== undefined) {
    input.notes = body.notes;
  }

  return input;
}

function toUpdateYearlyBedPlantingInput(body: UpdateYearlyBedPlantingBody): UpdateYearlyBedPlantingInput {
  const patch: UpdateYearlyBedPlantingInput = {};

  if (body.plantId !== undefined) {
    patch.plantId = body.plantId;
  }

  if (body.year !== undefined) {
    patch.year = body.year;
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
