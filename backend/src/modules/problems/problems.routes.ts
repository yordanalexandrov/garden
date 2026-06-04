import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { toProblemDetailDto, toProblemListItemDto, toProblemMutationDto } from "./problems.dto.js";
import { KyselyProblemsRepository } from "./problems.repository.js";
import { ProblemsService } from "./problems.service.js";
import type { CreateProblemRequest, ListProblemsFilters, UpdateProblemRequest } from "./problems.types.js";
import {
  createProblemBodySchema,
  problemListQuerySchema,
  problemParamsSchema,
  updateProblemBodySchema,
  type CreateProblemBody,
  type ProblemListQuery,
  type UpdateProblemBody
} from "./problems.validation.js";

export type ProblemsRouteOptions = {
  db?: DbClient;
};

export const registerProblemsRoutes: FastifyPluginCallback<ProblemsRouteOptions> = (app, options, done) => {
  const problemsService = createProblemsService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { query } = validateRequest(request, { query: problemListQuerySchema });
    const result = await requireProblemsService(problemsService).listProblems(actor, toListProblemsFilters(query));

    return successEnvelope({
      items: result.items.map(toProblemListItemDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  app.post("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: createProblemBodySchema });
    const result = await requireProblemsService(problemsService).createProblem(actor, toCreateProblemRequest(body));

    return successEnvelope(toProblemMutationDto(result));
  });

  app.get("/:problemId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: problemParamsSchema });
    const result = await requireProblemsService(problemsService).getProblem(actor, params.problemId);

    return successEnvelope(toProblemDetailDto(result));
  });

  app.patch("/:problemId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: problemParamsSchema,
      body: updateProblemBodySchema
    });
    const result = await requireProblemsService(problemsService).updateProblem(
      actor,
      params.problemId,
      toUpdateProblemRequest(body)
    );

    return successEnvelope(toProblemMutationDto(result));
  });

  done();
};

function createProblemsService(db: DbClient | undefined): ProblemsService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new ProblemsService(new KyselyProblemsRepository(db), db);
}

function requireProblemsService(service: ProblemsService | undefined): ProblemsService {
  if (service === undefined) {
    throw new Error("Problems routes require a database client");
  }

  return service;
}

function toListProblemsFilters(query: ProblemListQuery): ListProblemsFilters {
  const filters: ListProblemsFilters = {
    page: query.page,
    pageSize: query.pageSize
  };

  if (query.placeId !== undefined) {
    filters.placeId = query.placeId;
  }

  if (query.type !== undefined) {
    filters.type = query.type;
  }

  if (query.status !== undefined) {
    filters.status = query.status;
  }

  if (query.category !== undefined) {
    filters.category = query.category;
  }

  if (query.from !== undefined) {
    filters.from = new Date(query.from);
  }

  if (query.to !== undefined) {
    filters.to = new Date(query.to);
  }

  return filters;
}

function toCreateProblemRequest(body: CreateProblemBody): CreateProblemRequest {
  return {
    type: body.type,
    placeId: body.placeId,
    targetType: body.targetType,
    targetId: body.targetId,
    title: body.title,
    description: body.description,
    ...(body.category === undefined ? {} : { category: body.category }),
    ...(body.severity === undefined ? {} : { severity: body.severity }),
    status: body.status,
    observedAt: new Date(body.observedAt),
    ...(body.linkedActivityId === undefined ? {} : { linkedActivityId: body.linkedActivityId })
  };
}

function toUpdateProblemRequest(body: UpdateProblemBody): UpdateProblemRequest {
  return {
    ...(body.title === undefined ? {} : { title: body.title }),
    ...(body.description === undefined ? {} : { description: body.description }),
    ...(body.category === undefined ? {} : { category: body.category }),
    ...(body.severity === undefined ? {} : { severity: body.severity }),
    ...(body.status === undefined ? {} : { status: body.status }),
    ...(body.observedAt === undefined ? {} : { observedAt: new Date(body.observedAt) }),
    ...(body.linkedActivityId === undefined ? {} : { linkedActivityId: body.linkedActivityId })
  };
}
