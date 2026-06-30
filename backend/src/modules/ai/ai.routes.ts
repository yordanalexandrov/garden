import type { FastifyPluginCallback } from "fastify";

import type { AppConfig } from "../../config/config.js";
import type { DbClient } from "../../db/transaction.js";
import { createAiAdapter } from "../../integrations/ai/ai-provider.factory.js";
import type { AiPort } from "../../integrations/ai/ai.port.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { KyselyAuditLogsRepository } from "../audit/audit.repository.js";
import { AuditService } from "../audit/audit.service.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { KyselyBedsRepository } from "../beds/beds.repository.js";
import type { StoragePort } from "../files/storage.port.js";
import { TestStorageAdapter } from "../files/test-storage.adapter.js";
import { SupabaseStorageAdapter } from "../files/supabase-storage.adapter.js";
import { KyselyPlantsRepository } from "../plants/plants.repository.js";
import { KyselyProblemsRepository } from "../problems/problems.repository.js";
import { KyselyProductsRepository } from "../products/products.repository.js";
import { ProductsService } from "../products/products.service.js";
import { toAcceptResponseDto, toGenerationResponseDto, toRejectResponseDto } from "./ai.dto.js";
import { KyselyAiRepository } from "./ai.repository.js";
import { AiService } from "./ai.service.js";
import {
  acceptSuggestionBodySchema,
  bedPlanningBodySchema,
  plantIngestionBodySchema,
  problemAssistBodySchema,
  productIngestionBodySchema,
  productRuleGenerationBodySchema,
  rejectSuggestionBodySchema,
  suggestionParamsSchema
} from "./ai.validation.js";

export type AiRouteOptions = {
  db?: DbClient;
  config?: AppConfig;
  ai?: AiPort;
  storage?: StoragePort;
};

export const registerAiRoutes: FastifyPluginCallback<AiRouteOptions> = (app, options, done) => {
  const aiService = createAiService(options);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.post("/product-ingestion", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: productIngestionBodySchema });
    const result = await requireAiService(aiService).ingestProduct(actor, {
      ...(body.productName !== undefined ? { productName: body.productName } : {}),
      ...(body.labelText !== undefined ? { labelText: body.labelText } : {})
    });

    return successEnvelope(toGenerationResponseDto(result.session, result.suggestions, result.warnings));
  });

  app.post("/plant-ingestion", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: plantIngestionBodySchema });
    const result = await requireAiService(aiService).ingestPlant(actor, {
      plantName: body.plantName,
      ...(body.notes !== undefined ? { notes: body.notes } : {})
    });

    return successEnvelope(toGenerationResponseDto(result.session, result.suggestions, result.warnings));
  });

  app.post("/product-rule-generation", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: productRuleGenerationBodySchema });
    const result = await requireAiService(aiService).generateProductRules(actor, body.productId);

    return successEnvelope(toGenerationResponseDto(result.session, result.suggestions, result.warnings));
  });

  app.post("/bed-planning", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: bedPlanningBodySchema });
    const result = await requireAiService(aiService).suggestBedPlan(actor, {
      bedId: body.bedId,
      year: body.year,
      candidatePlantIds: body.candidatePlantIds,
      ...(body.notes !== undefined ? { notes: body.notes } : {})
    });

    return successEnvelope(toGenerationResponseDto(result.session, result.suggestions));
  });

  app.post("/problem-assist", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: problemAssistBodySchema });
    const result = await requireAiService(aiService).assistProblem(actor, {
      ...(body.problemId !== undefined ? { problemId: body.problemId } : {}),
      ...(body.text !== undefined ? { text: body.text } : {}),
      ...(body.followUpAnswers !== undefined ? { followUpAnswers: body.followUpAnswers } : {})
    });

    return successEnvelope(toGenerationResponseDto(result.session, result.suggestions));
  });

  app.post("/suggestions/:suggestionId/accept", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: suggestionParamsSchema,
      body: acceptSuggestionBodySchema
    });
    const result = await requireAiService(aiService).acceptSuggestion(actor, params.suggestionId, body.editedPayload, {
      problemId: body.problemId,
      acceptedCategory: body.acceptedCategory
    });

    return successEnvelope(toAcceptResponseDto(result));
  });

  app.post("/suggestions/:suggestionId/reject", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, {
      params: suggestionParamsSchema,
      body: rejectSuggestionBodySchema
    });
    await requireAiService(aiService).rejectSuggestion(actor, params.suggestionId);

    return successEnvelope(toRejectResponseDto());
  });

  done();
};

function createAiService(options: AiRouteOptions): AiService | undefined {
  if (options.db === undefined) {
    return undefined;
  }

  const db = options.db;
  const aiPort = options.ai ?? (options.config !== undefined ? createAiAdapter(options.config) : undefined);

  if (aiPort === undefined) {
    return undefined;
  }

  const auditService = new AuditService(new KyselyAuditLogsRepository(db));
  const productsService = new ProductsService(
    new KyselyProductsRepository(db),
    new KyselyPlantsRepository(db),
    auditService
  );

  return new AiService(
    new KyselyAiRepository(db),
    aiPort,
    productsService,
    new KyselyBedsRepository(db),
    new KyselyPlantsRepository(db),
    db,
    auditService,
    new KyselyProblemsRepository(db),
    options.storage ?? createStoragePort(options.config)
  );
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
      bucket,
      serviceRoleKey,
      ...(storagePublicUrl !== undefined ? { storagePublicUrl } : {})
    });
  }

  return new TestStorageAdapter();
}

function requireAiService(service: AiService | undefined): AiService {
  if (service === undefined) {
    throw new Error("AI routes require a database client and AI port");
  }

  return service;
}
