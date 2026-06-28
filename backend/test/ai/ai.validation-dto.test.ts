import { describe, expect, it } from "vitest";

import { AiProviderError, isAiProviderError } from "../../src/integrations/ai/ai.port.js";
import { TestAiAdapter } from "../../src/integrations/ai/test-ai.adapter.js";
import { toAcceptResponseDto, toGenerationResponseDto, toRejectResponseDto } from "../../src/modules/ai/ai.dto.js";
import type { AiSession, AiSuggestion } from "../../src/modules/ai/ai.types.js";
import {
  acceptSuggestionBodySchema,
  bedPlanningBodySchema,
  problemAssistBodySchema,
  productIngestionBodySchema,
  productRuleGenerationBodySchema,
  suggestionParamsSchema
} from "../../src/modules/ai/ai.validation.js";

describe("AI validation schemas", () => {
  it("validates product ingestion with productName only", () => {
    expect(productIngestionBodySchema.safeParse({ productName: "Fungicide X" }).success).toBe(true);
  });

  it("validates product ingestion with labelText only", () => {
    expect(productIngestionBodySchema.safeParse({ labelText: "Active substance: Copper" }).success).toBe(true);
  });

  it("validates product ingestion with both fields", () => {
    expect(productIngestionBodySchema.safeParse({ productName: "Fungicide X", labelText: "Copper-based" }).success).toBe(true);
  });

  it("rejects product ingestion with no fields", () => {
    expect(productIngestionBodySchema.safeParse({}).success).toBe(false);
  });

  it("validates bed planning with required fields", () => {
    expect(
      bedPlanningBodySchema.safeParse({
        bedId: "11111111-1111-4111-8111-111111111111",
        year: 2026,
        candidatePlantIds: ["22222222-2222-4222-8222-222222222222"]
      }).success
    ).toBe(true);
  });

  it("rejects bed planning with invalid bedId", () => {
    expect(
      bedPlanningBodySchema.safeParse({
        bedId: "not-a-uuid",
        year: 2026,
        candidatePlantIds: ["22222222-2222-4222-8222-222222222222"]
      }).success
    ).toBe(false);
  });

  it("rejects bed planning with empty candidatePlantIds", () => {
    expect(
      bedPlanningBodySchema.safeParse({
        bedId: "11111111-1111-4111-8111-111111111111",
        year: 2026,
        candidatePlantIds: []
      }).success
    ).toBe(false);
  });

  it("validates problem assist with problemId", () => {
    expect(
      problemAssistBodySchema.safeParse({ problemId: "11111111-1111-4111-8111-111111111111" }).success
    ).toBe(true);
  });

  it("validates problem assist with text", () => {
    expect(problemAssistBodySchema.safeParse({ text: "Leaves have yellow spots" }).success).toBe(true);
  });

  it("rejects problem assist with neither field", () => {
    expect(problemAssistBodySchema.safeParse({}).success).toBe(false);
  });

  it("validates problem assist with followUpAnswers", () => {
    expect(
      problemAssistBodySchema.safeParse({
        text: "Yellow spots on leaves",
        followUpAnswers: [{ question: "Are spots wet?", answer: "да" }],
      }).success,
    ).toBe(true);
  });

  it("accepts problem assist with empty followUpAnswers array", () => {
    expect(
      problemAssistBodySchema.safeParse({
        text: "Yellow spots",
        followUpAnswers: [],
      }).success,
    ).toBe(true);
  });

  it("rejects problem assist followUpAnswers with empty question string", () => {
    expect(
      problemAssistBodySchema.safeParse({
        text: "Yellow spots",
        followUpAnswers: [{ question: "", answer: "да" }],
      }).success,
    ).toBe(false);
  });

  it("rejects problem assist followUpAnswers with empty answer string", () => {
    expect(
      problemAssistBodySchema.safeParse({
        text: "Yellow spots",
        followUpAnswers: [{ question: "Are spots wet?", answer: "" }],
      }).success,
    ).toBe(false);
  });

  it("validates product rule generation with a valid productId", () => {
    expect(
      productRuleGenerationBodySchema.safeParse({ productId: "11111111-1111-4111-8111-111111111111" }).success
    ).toBe(true);
  });

  it("rejects product rule generation with an invalid productId", () => {
    expect(productRuleGenerationBodySchema.safeParse({ productId: "nope" }).success).toBe(false);
  });

  it("validates accept with no editedPayload", () => {
    expect(acceptSuggestionBodySchema.safeParse({}).success).toBe(true);
  });

  it("validates accept with editedPayload", () => {
    expect(acceptSuggestionBodySchema.safeParse({ editedPayload: { name: "Updated Name" } }).success).toBe(true);
  });

  it("validates suggestion params with valid uuid", () => {
    expect(suggestionParamsSchema.safeParse({ suggestionId: "11111111-1111-4111-8111-111111111111" }).success).toBe(true);
  });

  it("rejects suggestion params with invalid uuid", () => {
    expect(suggestionParamsSchema.safeParse({ suggestionId: "not-valid" }).success).toBe(false);
  });
});

describe("AI DTOs", () => {
  it("maps generation response to canonical shape", () => {
    const session = makeSession();
    const suggestions = [makeSuggestion("product"), makeSuggestion("product_rule")];
    const dto = toGenerationResponseDto(session, suggestions, ["Review before saving."]);

    expect(dto).toEqual({
      aiSession: {
        id: session.id,
        kind: session.kind,
        inputMode: session.inputMode,
        status: session.status
      },
      suggestions: [
        { id: suggestions[0]?.id, suggestionType: "product", payload: suggestions[0]?.payload },
        { id: suggestions[1]?.id, suggestionType: "product_rule", payload: suggestions[1]?.payload }
      ],
      warnings: ["Review before saving."]
    });
  });

  it("omits warnings from generation response when empty", () => {
    const dto = toGenerationResponseDto(makeSession(), [], []);

    expect(dto).not.toHaveProperty("warnings");
  });

  it("omits warnings from generation response when undefined", () => {
    const dto = toGenerationResponseDto(makeSession(), []);

    expect(dto).not.toHaveProperty("warnings");
  });

  it("maps accept response to canonical shape", () => {
    const dto = toAcceptResponseDto({
      acceptedSuggestionId: "11111111-1111-4111-8111-111111111111",
      createdEntities: [{ entityType: "product", entityId: "22222222-2222-4222-8222-222222222222" }],
      updatedEntities: []
    });

    expect(dto).toEqual({
      acceptedSuggestionId: "11111111-1111-4111-8111-111111111111",
      createdEntities: [{ entityType: "product", entityId: "22222222-2222-4222-8222-222222222222" }],
      updatedEntities: []
    });
  });

  it("maps reject response to canonical shape", () => {
    expect(toRejectResponseDto()).toEqual({ rejected: true });
  });
});

describe("TestAiAdapter", () => {
  it("returns stable product and rule suggestions for product ingestion", async () => {
    const adapter = new TestAiAdapter();
    const result = await adapter.ingestProduct({ productName: "Test Product" });

    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "product" }),
        expect.objectContaining({ type: "product_rule" })
      ])
    );
    expect(result.warnings).toBeDefined();
  });

  it("returns stable bed plan suggestions", async () => {
    const adapter = new TestAiAdapter();
    const result = await adapter.suggestBedPlan({
      bedId: "11111111-1111-4111-8111-111111111111",
      year: 2026,
      candidatePlantIds: ["22222222-2222-4222-8222-222222222222"]
    });

    expect(result.suggestions).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "bed_plan" })])
    );
  });

  it("returns stable problem summary suggestions without diagnosis-as-fact language", async () => {
    const adapter = new TestAiAdapter();
    const result = await adapter.assistProblem({ text: "Yellow spots on leaves" });

    expect(result.suggestions).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "problem_summary" })])
    );

    const summaryPayload = result.suggestions.find((s) => s.type === "problem_summary")?.payload as { summary?: string };
    expect(summaryPayload?.summary).toBeDefined();
    expect(summaryPayload?.summary?.toLowerCase()).not.toContain("diagnosed");
    expect(summaryPayload?.summary?.toLowerCase()).not.toContain("definitely");
  });

  it("simulates provider failure for all methods", async () => {
    const failing = new TestAiAdapter({ failRequests: true });

    await expect(failing.ingestProduct({ productName: "Test" })).rejects.toBeInstanceOf(AiProviderError);
    await expect(
      failing.suggestBedPlan({ bedId: "11111111-1111-4111-8111-111111111111", year: 2026, candidatePlantIds: ["22222222-2222-4222-8222-222222222222"] })
    ).rejects.toBeInstanceOf(AiProviderError);
    await expect(failing.assistProblem({ text: "test" })).rejects.toBeInstanceOf(AiProviderError);
  });

  it("isAiProviderError identifies AiProviderError instances", () => {
    expect(isAiProviderError(new AiProviderError())).toBe(true);
    expect(isAiProviderError(new Error("plain error"))).toBe(false);
    expect(isAiProviderError("string")).toBe(false);
    expect(isAiProviderError(null)).toBe(false);
  });

  it("records calls for inspection", async () => {
    const adapter = new TestAiAdapter();
    await adapter.ingestProduct({ productName: "Test" });

    expect(adapter.ingestProductCalls).toHaveLength(1);
    expect(adapter.ingestProductCalls[0]).toEqual({ productName: "Test" });
  });

  it("generates create and update rule suggestions per plant", async () => {
    const adapter = new TestAiAdapter();
    const result = await adapter.generateProductRules({
      product: {
        id: "prod-1",
        name: "Test Fungicide",
        category: "fungicide",
        defaultUnit: "g"
      },
      existingRules: [
        {
          ruleId: "rule-1",
          plantId: "plant-1",
          plantName: "Домат",
          doseValue: 20,
          doseUnit: "g"
        }
      ],
      plants: [
        { plantId: "plant-1", commonName: "Домат" },
        { plantId: "plant-2", commonName: "Краставица" }
      ]
    });

    expect(result.suggestions).toHaveLength(2);
    const update = result.suggestions.find(
      (s) => s.type === "product_rule" && (s.payload as { plantId?: string }).plantId === "plant-1"
    );
    const create = result.suggestions.find(
      (s) => s.type === "product_rule" && (s.payload as { plantId?: string }).plantId === "plant-2"
    );
    expect((update?.payload as { operation?: string }).operation).toBe("update");
    expect((update?.payload as { ruleId?: string }).ruleId).toBe("rule-1");
    expect((create?.payload as { operation?: string }).operation).toBe("create");
  });
});

function makeSession(overrides: Partial<AiSession> = {}): AiSession {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    accountId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    kind: "product_ingestion",
    inputMode: "text",
    status: "completed",
    rawInputText: null,
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: new Date("2026-06-01T00:00:00Z"),
    updatedAt: new Date("2026-06-01T00:00:00Z"),
    ...overrides
  };
}

function makeSuggestion(suggestionType: AiSuggestion["suggestionType"], overrides: Partial<AiSuggestion> = {}): AiSuggestion {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    aiSessionId: "11111111-1111-4111-8111-111111111111",
    suggestionType,
    payload: { name: "Test" },
    accepted: null,
    acceptedAt: null,
    createdAt: new Date("2026-06-01T00:00:00Z"),
    ...overrides
  };
}
