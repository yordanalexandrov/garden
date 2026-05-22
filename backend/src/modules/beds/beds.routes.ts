import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { KyselyPlacesRepository } from "../places/places.repository.js";
import { toBedDetailDto, toBedListItemDto, toBedMutationDto } from "./beds.dto.js";
import { KyselyBedsRepository } from "./beds.repository.js";
import { BedsService, type CreateBedServiceInput } from "./beds.service.js";
import type { ListBedsFilters, UpdateBedInput } from "./beds.types.js";
import {
  bedDetailQuerySchema,
  bedParamsSchema,
  createBedBodySchema,
  type BedDetailQuery,
  type CreateBedBody,
  listBedsQuerySchema,
  type ListBedsQuery,
  placeBedsParamsSchema,
  updateBedBodySchema,
  type UpdateBedBody
} from "./beds.validation.js";

export type BedsRouteOptions = {
  db?: DbClient;
};

export const registerPlaceBedsRoutes: FastifyPluginCallback<BedsRouteOptions> = (app, options, done) => {
  const bedsService = createBedsService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, query } = validateRequest(request, {
      params: placeBedsParamsSchema,
      query: listBedsQuerySchema
    });
    const result = await requireBedsService(bedsService).listBeds(actor, params.placeId, toListBedsFilters(query));

    return successEnvelope({
      items: result.items.map((bed) => toBedListItemDto(bed)),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  app.post("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: placeBedsParamsSchema,
      body: createBedBodySchema
    });
    const bed = await requireBedsService(bedsService).createBed(actor, params.placeId, toCreateBedInput(body));

    return successEnvelope(toBedMutationDto(bed));
  });

  done();
};

export const registerBedsRoutes: FastifyPluginCallback<BedsRouteOptions> = (app, options, done) => {
  const bedsService = createBedsService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/:bedId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, query } = validateRequest(request, {
      params: bedParamsSchema,
      query: bedDetailQuerySchema
    });
    const bed = await requireBedsService(bedsService).getBed(actor, params.bedId, toBedDetailYear(query));

    return successEnvelope(toBedDetailDto(bed));
  });

  app.patch("/:bedId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: bedParamsSchema,
      body: updateBedBodySchema
    });
    const bed = await requireBedsService(bedsService).updateBed(actor, params.bedId, toUpdateBedInput(body));

    return successEnvelope(toBedMutationDto(bed));
  });

  app.post("/:bedId/archive", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: bedParamsSchema });
    await requireBedsService(bedsService).archiveBed(actor, params.bedId);

    return successEnvelope({ archived: true });
  });

  done();
};

function createBedsService(db: DbClient | undefined): BedsService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new BedsService(new KyselyBedsRepository(db), new KyselyPlacesRepository(db));
}

function requireBedsService(service: BedsService | undefined): BedsService {
  if (service === undefined) {
    throw new Error("Beds routes require a database client");
  }

  return service;
}

function toListBedsFilters(query: ListBedsQuery): ListBedsFilters {
  const filters: ListBedsFilters = {
    page: query.page,
    pageSize: query.pageSize
  };

  if (query.q !== undefined) {
    filters.q = query.q;
  }

  if (query.status !== undefined) {
    filters.status = query.status;
  }

  if (query.year !== undefined) {
    filters.year = query.year;
  }

  return filters;
}

function toBedDetailYear(query: BedDetailQuery): number | undefined {
  return query.year;
}

function toCreateBedInput(body: CreateBedBody): CreateBedServiceInput {
  const input: CreateBedServiceInput = {
    name: body.name
  };

  if (body.description !== undefined) {
    input.description = body.description;
  }

  if (body.notes !== undefined) {
    input.notes = body.notes;
  }

  if (body.widthM !== undefined) {
    input.widthM = body.widthM;
  }

  if (body.lengthM !== undefined) {
    input.lengthM = body.lengthM;
  }

  if (body.areaM2 !== undefined) {
    input.areaM2 = body.areaM2;
  }

  return input;
}

function toUpdateBedInput(body: UpdateBedBody): UpdateBedInput {
  const patch: UpdateBedInput = {};

  if (body.name !== undefined) {
    patch.name = body.name;
  }

  if (body.description !== undefined) {
    patch.description = body.description;
  }

  if (body.notes !== undefined) {
    patch.notes = body.notes;
  }

  if (body.widthM !== undefined) {
    patch.widthM = body.widthM;
  }

  if (body.lengthM !== undefined) {
    patch.lengthM = body.lengthM;
  }

  if (body.areaM2 !== undefined) {
    patch.areaM2 = body.areaM2;
  }

  if (body.status !== undefined) {
    patch.status = body.status;
  }

  return patch;
}
