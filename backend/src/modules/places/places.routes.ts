import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { AppError } from "../../shared/errors/app-error.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { toPlaceDetailDto, toPlaceListItemDto, toPlaceMutationDto } from "./places.dto.js";
import { KyselyPlacesRepository } from "./places.repository.js";
import { PlacesService, type CreatePlaceServiceInput } from "./places.service.js";
import type { ListPlacesFilters, UpdatePlaceInput } from "./places.types.js";
import {
  createPlaceBodySchema,
  type CreatePlaceBody,
  listPlacesQuerySchema,
  type ListPlacesQuery,
  placeParamsSchema,
  updatePlaceBodySchema,
  type UpdatePlaceBody
} from "./places.validation.js";

export type PlacesRouteOptions = {
  db?: DbClient;
};

export const registerPlacesRoutes: FastifyPluginCallback<PlacesRouteOptions> = (app, options, done) => {
  const placesService =
    options.db === undefined ? undefined : new PlacesService(new KyselyPlacesRepository(options.db));
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { query } = validateRequest(request, { query: listPlacesQuerySchema });
    const result = await requirePlacesService(placesService).listPlaces(actor, toListPlacesFilters(query));

    return successEnvelope({
      items: result.items.map(toPlaceListItemDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  app.post("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: createPlaceBodySchema });
    const place = await requirePlacesService(placesService).createPlace(actor, toCreatePlaceInput(body));

    return successEnvelope(toPlaceMutationDto(place));
  });

  app.get("/:placeId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: placeParamsSchema });
    const place = await requirePlacesService(placesService).getPlace(actor, params.placeId);

    return successEnvelope(toPlaceDetailDto(place));
  });

  app.patch("/:placeId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: placeParamsSchema,
      body: updatePlaceBodySchema
    });
    const place = await requirePlacesService(placesService).updatePlace(actor, params.placeId, toUpdatePlaceInput(body));

    return successEnvelope(toPlaceMutationDto(place));
  });

  app.post("/:placeId/archive", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: placeParamsSchema });
    await requirePlacesService(placesService).archivePlace(actor, params.placeId);

    return successEnvelope({ archived: true });
  });

  done();
};

function requirePlacesService(service: PlacesService | undefined): PlacesService {
  if (service === undefined) {
    throw new AppError("INTERNAL_ERROR", "Places routes require a database client");
  }

  return service;
}

function toListPlacesFilters(query: ListPlacesQuery): ListPlacesFilters {
  const filters: ListPlacesFilters = {
    includeArchived: query.includeArchived,
    page: query.page,
    pageSize: query.pageSize
  };

  if (query.q !== undefined) {
    filters.q = query.q;
  }

  return filters;
}

function toCreatePlaceInput(body: CreatePlaceBody): CreatePlaceServiceInput {
  const input: CreatePlaceServiceInput = {
    name: body.name,
    weatherEnabled: body.weatherEnabled
  };

  if (body.description !== undefined) {
    input.description = body.description;
  }

  if (body.notes !== undefined) {
    input.notes = body.notes;
  }

  if (body.weatherLocationLabel !== undefined) {
    input.weatherLocationLabel = body.weatherLocationLabel;
  }

  if (body.latitude !== undefined) {
    input.latitude = body.latitude;
  }

  if (body.longitude !== undefined) {
    input.longitude = body.longitude;
  }

  if (body.timezone !== undefined) {
    input.timezone = body.timezone;
  }

  return input;
}

function toUpdatePlaceInput(body: UpdatePlaceBody): UpdatePlaceInput {
  const patch: UpdatePlaceInput = {};

  if (body.name !== undefined) {
    patch.name = body.name;
  }

  if (body.description !== undefined) {
    patch.description = body.description;
  }

  if (body.notes !== undefined) {
    patch.notes = body.notes;
  }

  if (body.weatherEnabled !== undefined) {
    patch.weatherEnabled = body.weatherEnabled;
  }

  if (body.weatherLocationLabel !== undefined) {
    patch.weatherLocationLabel = body.weatherLocationLabel;
  }

  if (body.latitude !== undefined) {
    patch.latitude = body.latitude;
  }

  if (body.longitude !== undefined) {
    patch.longitude = body.longitude;
  }

  if (body.timezone !== undefined) {
    patch.timezone = body.timezone;
  }

  return patch;
}
