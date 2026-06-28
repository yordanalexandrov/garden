import type { FastifyInstance, FastifyPluginCallback } from "fastify";

import type { AppConfig } from "../../config/config.js";
import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import type { StoragePort } from "../files/storage.port.js";
import { TestStorageAdapter } from "../files/test-storage.adapter.js";
import { SupabaseStorageAdapter } from "../files/supabase-storage.adapter.js";
import { toProblemDetailDto, toProblemListItemDto, toProblemMutationDto, toProblemPhotoMutationDto } from "./problems.dto.js";
import { KyselyProblemsRepository } from "./problems.repository.js";
import { ProblemsService } from "./problems.service.js";
import { validateProblemPhotoMultipart } from "./problem-photo.validation.js";
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
  config?: AppConfig;
  storage?: StoragePort;
};

export const registerProblemsRoutes: FastifyPluginCallback<ProblemsRouteOptions> = (app, options, done) => {
  const config = options.config;
  registerMultipartParser(app, config);
  const problemsService = createProblemsService(options.db, config, options.storage);
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


  app.post("/:problemId/photos", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: problemParamsSchema });
    const file = validateProblemPhotoMultipart(request.headers["content-type"], request.body, {
      allowedMimeTypes: photoAllowedMimeTypes(config),
      maxBytes: photoMaxBytes(config)
    });
    const result = await requireProblemsService(problemsService).uploadProblemPhoto(actor, params.problemId, file);

    return successEnvelope(toProblemPhotoMutationDto(result));
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

function createProblemsService(
  db: DbClient | undefined,
  config: AppConfig | undefined,
  storage: StoragePort | undefined
): ProblemsService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new ProblemsService(
    new KyselyProblemsRepository(db),
    db,
    storage ?? createStoragePort(config),
    config?.integrations.problemPhotoSignedUrlTtlSeconds ?? 60 * 60
  );
}

function registerMultipartParser(app: FastifyInstance, config: AppConfig | undefined): void {
  if (app.hasContentTypeParser("multipart/form-data")) {
    return;
  }

  app.addContentTypeParser("multipart/form-data", { parseAs: "buffer", bodyLimit: photoMaxBytes(config) + 1024 * 1024 }, (_request, body, done) => {
    done(null, body);
  });
}

function createStoragePort(config: AppConfig | undefined): StoragePort {
  if (config?.nodeEnv === "production") {
    const storageUrl = config.integrations.supabaseStorageUrl;
    const storagePublicUrl = config.integrations.supabaseStoragePublicUrl;
    const bucket = config.integrations.supabaseStorageBucketProblemPhotos;
    const serviceRoleKey = config.backendOnly.supabaseServiceRoleKey;

    if (storageUrl === undefined || bucket === undefined || serviceRoleKey === undefined) {
      throw new Error("Production problem photo storage requires Supabase Storage URL, bucket, and backend service role key");
    }

    return new SupabaseStorageAdapter({
      storageUrl,
      ...(storagePublicUrl !== undefined ? { storagePublicUrl } : {}),
      bucket,
      serviceRoleKey,
    });
  }

  return new TestStorageAdapter();
}

function photoMaxBytes(config: AppConfig | undefined): number {
  return config?.integrations.problemPhotoMaxBytes ?? 5 * 1024 * 1024;
}

function photoAllowedMimeTypes(config: AppConfig | undefined): readonly string[] {
  return config?.integrations.problemPhotoAllowedMimeTypes ?? ["image/jpeg", "image/png", "image/webp"];
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
