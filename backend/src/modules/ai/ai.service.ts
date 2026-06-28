import { z } from "zod";

import type { DbClient, DbHandle } from "../../db/transaction.js";
import { isAiProviderError, type AiPort } from "../../integrations/ai/ai.port.js";
import { uuidSchema } from "../../shared/validation/common-schemas.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type { BedsRepository } from "../beds/beds.types.js";
import type { CreatePlantInput, PlantsRepository } from "../plants/plants.types.js";
import type { CreateProductServiceInput, CreateProductUsageRuleServiceInput, ProductsService } from "../products/products.service.js";
import type { UpdateProductUsageRuleInput } from "../products/products.types.js";
import type {
  GenerateProductRulesExistingRule,
  GenerateProductRulesPlant
} from "../../integrations/ai/ai.types.js";
import type { ProblemsRepository } from "../problems/problems.types.js";
import type {
  AcceptSuggestionResult,
  AiRepository,
  AiSession,
  AiSuggestion
} from "./ai.types.js";

const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();
const nullableNonNegativeIntegerSchema = z.number().int().min(0).nullable().optional();

const acceptedProductPayloadSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  activeSubstance: optionalTextBodyFieldSchema,
  manufacturer: optionalTextBodyFieldSchema,
  formulation: optionalTextBodyFieldSchema,
  defaultUnit: z.string().trim().min(1),
  notes: optionalTextBodyFieldSchema
});

const acceptedPlantPayloadSchema = z.object({
  commonName: z.string().trim().min(1),
  variety: optionalTextBodyFieldSchema,
  plantCategory: optionalTextBodyFieldSchema,
  lifecycleType: z.enum(["annual", "biennial", "perennial"]),
  growingStyle: z.enum(["tree", "shrub", "vine", "herb", "vegetable", "berry", "flower", "other"]),
  notes: optionalTextBodyFieldSchema
});

const acceptedProductRulePayloadSchema = z.object({
  productId: uuidSchema,
  plantId: uuidSchema,
  ruleId: uuidSchema.optional(),
  doseValue: z.number().positive(),
  doseUnit: z.string().trim().min(1),
  dilutionText: optionalTextBodyFieldSchema,
  applicationMethod: optionalTextBodyFieldSchema,
  reapplicationIntervalDays: nullableNonNegativeIntegerSchema,
  quarantinePeriodDays: nullableNonNegativeIntegerSchema,
  notes: optionalTextBodyFieldSchema
});

export type IngestProductInput = {
  productName?: string;
  labelText?: string;
};

export type IngestPlantInput = {
  plantName: string;
  notes?: string;
};

export type SuggestBedPlanInput = {
  bedId: UUID;
  year: number;
  candidatePlantIds: UUID[];
  notes?: string;
};

export type AssistProblemInput = {
  problemId?: UUID;
  text?: string;
};

export type GenerationResult = {
  session: AiSession;
  suggestions: AiSuggestion[];
  warnings?: string[];
};

export class AiService {
  constructor(
    private readonly aiRepository: AiRepository,
    private readonly aiPort: AiPort,
    private readonly productsService: ProductsService,
    private readonly bedsRepository: BedsRepository,
    private readonly plantsRepository: PlantsRepository,
    private readonly dbClient: DbClient,
    private readonly auditService?: AuditService,
    private readonly problemsRepository?: ProblemsRepository
  ) {}

  async ingestProduct(actor: AuthenticatedActor, input: IngestProductInput): Promise<GenerationResult> {
    let portResult;

    try {
      portResult = await this.aiPort.ingestProduct({
        ...(input.productName !== undefined ? { productName: input.productName } : {}),
        ...(input.labelText !== undefined ? { labelText: input.labelText } : {})
      });
    } catch (error) {
      if (isAiProviderError(error)) {
        throw new AppError("EXTERNAL_SERVICE_ERROR", "AI provider failed");
      }

      throw error;
    }

    const session = await this.aiRepository.createSession({
      accountId: actor.accountId,
      kind: "product_ingestion",
      inputMode: input.productName !== undefined && input.labelText !== undefined ? "mixed" : input.labelText !== undefined ? "text" : "name",
      status: "completed",
      rawInputText: input.labelText ?? input.productName ?? null
    });

    const suggestions = await this.aiRepository.addSuggestions(
      session.id,
      portResult.suggestions.map((s) => ({
        suggestionType: s.type,
        payload: s.payload
      }))
    );

    return {
      session,
      suggestions,
      ...(portResult.warnings !== undefined ? { warnings: portResult.warnings } : {})
    };
  }

  async ingestPlant(actor: AuthenticatedActor, input: IngestPlantInput): Promise<GenerationResult> {
    let portResult;

    try {
      portResult = await this.aiPort.ingestPlant({
        plantName: input.plantName,
        ...(input.notes !== undefined ? { notes: input.notes } : {})
      });
    } catch (error) {
      if (isAiProviderError(error)) {
        throw new AppError("EXTERNAL_SERVICE_ERROR", "AI provider failed");
      }

      throw error;
    }

    const session = await this.aiRepository.createSession({
      accountId: actor.accountId,
      kind: "plant_ingestion",
      inputMode: "name",
      status: "completed",
      rawInputText: input.plantName
    });

    const suggestions = await this.aiRepository.addSuggestions(
      session.id,
      portResult.suggestions.map((s) => ({
        suggestionType: s.type,
        payload: s.payload
      }))
    );

    return {
      session,
      suggestions,
      ...(portResult.warnings !== undefined ? { warnings: portResult.warnings } : {})
    };
  }

  async suggestBedPlan(actor: AuthenticatedActor, input: SuggestBedPlanInput): Promise<GenerationResult> {
    const bed = await this.bedsRepository.findBaseById(actor.accountId, input.bedId);

    if (bed === null) {
      throw new AppError("NOT_FOUND", "Bed not found");
    }

    for (const plantId of input.candidatePlantIds) {
      const plant = await this.plantsRepository.findById(actor.accountId, plantId);

      if (plant === null) {
        throw new AppError("NOT_FOUND", `Plant not found: ${plantId}`);
      }
    }

    let portResult;

    try {
      portResult = await this.aiPort.suggestBedPlan({
        bedId: input.bedId,
        year: input.year,
        candidatePlantIds: input.candidatePlantIds,
        ...(input.notes !== undefined ? { notes: input.notes } : {})
      });
    } catch (error) {
      if (isAiProviderError(error)) {
        throw new AppError("EXTERNAL_SERVICE_ERROR", "AI provider failed");
      }

      throw error;
    }

    const session = await this.aiRepository.createSession({
      accountId: actor.accountId,
      kind: "bed_planning",
      inputMode: "text",
      status: "completed",
      relatedEntityType: "bed",
      relatedEntityId: input.bedId
    });

    const suggestions = await this.aiRepository.addSuggestions(
      session.id,
      portResult.suggestions.map((s) => ({
        suggestionType: s.type,
        payload: s.payload
      }))
    );

    return { session, suggestions };
  }

  async assistProblem(actor: AuthenticatedActor, input: AssistProblemInput): Promise<GenerationResult> {
    let problemContext: Parameters<AiPort["assistProblem"]>[0]["problemContext"];

    if (input.problemId !== undefined) {
      if (this.problemsRepository !== undefined) {
        const detail = await this.problemsRepository.getDetail(actor.accountId, input.problemId);

        if (detail === null) {
          throw new AppError("NOT_FOUND", "Problem not found");
        }

        problemContext = {
          title: detail.title,
          description: detail.description,
          targetLabel: detail.targetLabel,
          category: detail.category,
          severity: detail.severity,
          observedAt: detail.observedAt.toISOString().slice(0, 10),
          photosCount: detail.photos.length
        };
      } else {
        const exists = await this.findProblemForAccount(actor.accountId, input.problemId);

        if (!exists) {
          throw new AppError("NOT_FOUND", "Problem not found");
        }
      }
    }

    let portResult;

    try {
      portResult = await this.aiPort.assistProblem({
        ...(input.problemId !== undefined ? { problemId: input.problemId } : {}),
        ...(input.text !== undefined ? { text: input.text } : {}),
        ...(problemContext !== undefined ? { problemContext } : {})
      });
    } catch (error) {
      if (isAiProviderError(error)) {
        throw new AppError("EXTERNAL_SERVICE_ERROR", "AI provider failed");
      }

      throw error;
    }

    const session = await this.aiRepository.createSession({
      accountId: actor.accountId,
      kind: "problem_assist",
      inputMode: "text",
      status: "completed",
      rawInputText: input.text ?? null,
      relatedEntityType: input.problemId !== undefined ? "problem" : null,
      relatedEntityId: input.problemId ?? null
    });

    const suggestions = await this.aiRepository.addSuggestions(
      session.id,
      portResult.suggestions.map((s) => ({
        suggestionType: s.type,
        payload: s.payload
      }))
    );

    return { session, suggestions };
  }

  async generateProductRules(actor: AuthenticatedActor, productId: UUID): Promise<GenerationResult> {
    // Validates the product belongs to the actor's account and loads its rules.
    const product = await this.productsService.getProduct(actor, productId);

    const activeRules = product.usageRules.filter((rule) => rule.archivedAt === null);

    const plantsPage = await this.plantsRepository.list(actor.accountId, {
      includeArchived: false,
      page: 1,
      pageSize: 1000
    });
    const plants = plantsPage.items;

    const plantNameById = new Map(
      plants.map((plant) => [plant.id, plant.variety ? `${plant.commonName} — ${plant.variety}` : plant.commonName])
    );

    const existingRules: GenerateProductRulesExistingRule[] = activeRules.map((rule) => ({
      ruleId: rule.id,
      plantId: rule.plantId,
      plantName: plantNameById.get(rule.plantId) ?? "—",
      doseValue: rule.doseValue,
      doseUnit: rule.doseUnit,
      dilutionText: rule.dilutionText,
      applicationMethod: rule.applicationMethod,
      reapplicationIntervalDays: rule.reapplicationIntervalDays,
      quarantinePeriodDays: rule.quarantinePeriodDays
    }));

    const aiPlants: GenerateProductRulesPlant[] = plants.map((plant) => ({
      plantId: plant.id,
      commonName: plant.commonName,
      variety: plant.variety,
      plantCategory: plant.plantCategory
    }));

    let portResult;

    try {
      portResult = await this.aiPort.generateProductRules({
        product: {
          id: product.id,
          name: product.name,
          category: product.category,
          activeSubstance: product.activeSubstance,
          manufacturer: product.manufacturer,
          formulation: product.formulation,
          defaultUnit: product.defaultUnit,
          notes: product.notes
        },
        existingRules,
        plants: aiPlants
      });
    } catch (error) {
      if (isAiProviderError(error)) {
        throw new AppError("EXTERNAL_SERVICE_ERROR", "AI provider failed");
      }

      throw error;
    }

    const plantIdSet = new Set(plants.map((plant) => plant.id));
    const activeRuleByPlantId = new Map(activeRules.map((rule) => [rule.plantId, rule]));
    const warnings: string[] = portResult.warnings ? [...portResult.warnings] : [];

    const suggestionPayloads: Array<Record<string, unknown>> = [];

    for (const suggestion of portResult.suggestions) {
      if (suggestion.type !== "product_rule") {
        continue;
      }

      const payload = suggestion.payload;
      const plantId = typeof payload.plantId === "string" ? payload.plantId : undefined;

      if (plantId === undefined || !plantIdSet.has(plantId)) {
        warnings.push("Пропуснато предложение за непознато растение.");
        continue;
      }

      // The DB allows at most one active rule per (product, plant): refresh the
      // existing one when present, otherwise create a new rule.
      const existing = activeRuleByPlantId.get(plantId);

      suggestionPayloads.push({
        productId: product.id,
        plantId,
        operation: existing !== undefined ? "update" : "create",
        ...(existing !== undefined ? { ruleId: existing.id } : {}),
        ...(payload.plantName !== undefined ? { plantName: payload.plantName } : {}),
        doseValue: payload.doseValue,
        doseUnit: payload.doseUnit,
        dilutionText: payload.dilutionText ?? null,
        applicationMethod: payload.applicationMethod ?? null,
        reapplicationIntervalDays: payload.reapplicationIntervalDays ?? null,
        quarantinePeriodDays: payload.quarantinePeriodDays ?? null,
        notes: payload.notes ?? null
      });
    }

    const session = await this.aiRepository.createSession({
      accountId: actor.accountId,
      kind: "product_rule_generation",
      inputMode: "name",
      status: "completed",
      relatedEntityType: "product",
      relatedEntityId: product.id
    });

    const suggestions = await this.aiRepository.addSuggestions(
      session.id,
      suggestionPayloads.map((payload) => ({ suggestionType: "product_rule" as const, payload }))
    );

    return {
      session,
      suggestions,
      ...(warnings.length > 0 ? { warnings } : {})
    };
  }

  async acceptSuggestion(
    actor: AuthenticatedActor,
    suggestionId: UUID,
    editedPayload?: Record<string, unknown>
  ): Promise<AcceptSuggestionResult> {
    const suggestion = await this.aiRepository.findSuggestionById(actor.accountId, suggestionId);

    if (suggestion === null) {
      throw new AppError("NOT_FOUND", "Suggestion not found");
    }

    if (suggestion.accepted === true) {
      throw new AppError("CONFLICT", "Suggestion has already been accepted");
    }

    if (suggestion.accepted === false) {
      throw new AppError("CONFLICT", "Suggestion has been rejected and cannot be accepted");
    }

    const finalPayload = mergePayload(suggestion.payload, editedPayload);

    return this.dbClient.transaction(async (trx) => {
      const result = await this.createBusinessRecordsForSuggestion(actor, suggestion.suggestionType, finalPayload, trx);

      const marked = await this.aiRepository.markAccepted(suggestionId, trx);

      if (marked === null) {
        throw new AppError("CONFLICT", "Suggestion was concurrently accepted or rejected");
      }

      await this.auditService?.logActorEvent(
        {
          actor,
          entityType: "ai_suggestion",
          entityId: suggestionId,
          action: "ai_suggestion.accepted",
          afterJson: { suggestionType: suggestion.suggestionType }
        },
        trx
      );

      return {
        acceptedSuggestionId: suggestionId,
        createdEntities: result.createdEntities,
        updatedEntities: result.updatedEntities
      };
    });
  }

  async rejectSuggestion(actor: AuthenticatedActor, suggestionId: UUID): Promise<void> {
    const suggestion = await this.aiRepository.findSuggestionById(actor.accountId, suggestionId);

    if (suggestion === null) {
      throw new AppError("NOT_FOUND", "Suggestion not found");
    }

    if (suggestion.accepted === false) {
      throw new AppError("CONFLICT", "Suggestion has already been rejected");
    }

    if (suggestion.accepted === true) {
      throw new AppError("CONFLICT", "Suggestion has already been accepted and cannot be rejected");
    }

    await this.aiRepository.markRejected(suggestionId);

    await this.auditService?.logActorEvent({
      actor,
      entityType: "ai_suggestion",
      entityId: suggestionId,
      action: "ai_suggestion.rejected",
      afterJson: { suggestionType: suggestion.suggestionType }
    });
  }

  private async createBusinessRecordsForSuggestion(
    actor: AuthenticatedActor,
    suggestionType: string,
    payload: unknown,
    db: DbHandle
  ): Promise<{ createdEntities: Array<{ entityType: string; entityId: UUID }>; updatedEntities: Array<{ entityType: string; entityId: UUID }> }> {
    if (suggestionType === "product") {
      const parsed = acceptedProductPayloadSchema.safeParse(payload);

      if (!parsed.success) {
        throw new AppError("VALIDATION_ERROR", "Invalid product payload", {
          fields: parsed.error.issues.map((i) => i.message)
        });
      }

      const input: CreateProductServiceInput = {
        name: parsed.data.name,
        category: parsed.data.category as CreateProductServiceInput["category"],
        activeSubstance: parsed.data.activeSubstance ?? null,
        manufacturer: parsed.data.manufacturer ?? null,
        formulation: parsed.data.formulation ?? null,
        defaultUnit: parsed.data.defaultUnit as CreateProductServiceInput["defaultUnit"],
        notes: parsed.data.notes ?? null
      };

      const product = await this.productsService.createProduct(actor, input, db);

      return {
        createdEntities: [{ entityType: "product", entityId: product.id }],
        updatedEntities: []
      };
    }

    if (suggestionType === "product_rule") {
      const parsed = acceptedProductRulePayloadSchema.safeParse(payload);

      if (!parsed.success) {
        throw new AppError("VALIDATION_ERROR", "Invalid product rule payload: productId and plantId are required", {
          fields: parsed.error.issues.map((i) => i.message)
        });
      }

      // Refresh: when a ruleId is present, update the existing rule in place
      // instead of creating a new one (add/refresh flow for existing products).
      if (parsed.data.ruleId !== undefined) {
        const patch: UpdateProductUsageRuleInput = {
          plantId: parsed.data.plantId,
          doseValue: parsed.data.doseValue,
          doseUnit: parsed.data.doseUnit as CreateProductUsageRuleServiceInput["doseUnit"],
          dilutionText: parsed.data.dilutionText ?? null,
          applicationMethod: parsed.data.applicationMethod ?? null,
          reapplicationIntervalDays: parsed.data.reapplicationIntervalDays ?? null,
          quarantinePeriodDays: parsed.data.quarantinePeriodDays ?? null,
          notes: parsed.data.notes ?? null
        };

        const rule = await this.productsService.updateProductUsageRule(actor, parsed.data.ruleId, patch, db);

        return {
          createdEntities: [],
          updatedEntities: [{ entityType: "product_rule", entityId: rule.id }]
        };
      }

      const ruleInput: CreateProductUsageRuleServiceInput = {
        plantId: parsed.data.plantId,
        doseValue: parsed.data.doseValue,
        doseUnit: parsed.data.doseUnit as CreateProductUsageRuleServiceInput["doseUnit"],
        dilutionText: parsed.data.dilutionText ?? null,
        applicationMethod: parsed.data.applicationMethod ?? null,
        reapplicationIntervalDays: parsed.data.reapplicationIntervalDays ?? null,
        quarantinePeriodDays: parsed.data.quarantinePeriodDays ?? null,
        notes: parsed.data.notes ?? null
      };

      const rule = await this.productsService.createProductUsageRule(actor, parsed.data.productId, ruleInput, db);

      return {
        createdEntities: [{ entityType: "product_rule", entityId: rule.id }],
        updatedEntities: []
      };
    }

    if (suggestionType === "plant") {
      const parsed = acceptedPlantPayloadSchema.safeParse(payload);

      if (!parsed.success) {
        throw new AppError("VALIDATION_ERROR", "Invalid plant payload", {
          fields: parsed.error.issues.map((i) => i.message)
        });
      }

      const plantInput: CreatePlantInput = {
        accountId: actor.accountId,
        commonName: parsed.data.commonName,
        variety: parsed.data.variety ?? null,
        plantCategory: parsed.data.plantCategory ?? null,
        lifecycleType: parsed.data.lifecycleType,
        growingStyle: parsed.data.growingStyle,
        notes: parsed.data.notes ?? null
      };

      const plant = await this.plantsRepository.create(plantInput, db);

      return {
        createdEntities: [{ entityType: "plant", entityId: plant.id }],
        updatedEntities: []
      };
    }

    // Guidance-only suggestion types: mark accepted but create no business records
    if (suggestionType === "bed_plan" || suggestionType === "problem_summary" || suggestionType === "followup_questions") {
      return { createdEntities: [], updatedEntities: [] };
    }

    throw new AppError("BUSINESS_RULE_VIOLATION", `Unsupported suggestion type: ${suggestionType}`);
  }

  private async findProblemForAccount(accountId: UUID, problemId: UUID): Promise<boolean> {
    const row = await this.dbClient.db
      .selectFrom("problems")
      .select("id")
      .where("account_id", "=", accountId)
      .where("id", "=", problemId)
      .executeTakeFirst();

    return row !== undefined;
  }
}

function mergePayload(base: unknown, edited: Record<string, unknown> | undefined): unknown {
  if (edited === undefined) {
    return base;
  }

  if (base !== null && typeof base === "object" && !Array.isArray(base)) {
    return { ...(base as Record<string, unknown>), ...edited };
  }

  return edited;
}
