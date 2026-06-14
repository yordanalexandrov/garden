import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AiProviderError } from "../../src/integrations/ai/ai.port.js";
import { OpenAiAdapter } from "../../src/integrations/ai/openai-ai.adapter.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConstructor = new (...args: any[]) => Error;

const mockCreate = vi.fn();

vi.mock("openai", () => {
  const APIError = class extends Error {
    status: number;
    constructor(status = 500, message = "api error") {
      super(message);
      this.name = "APIError";
      this.status = status;
    }
  };
  const AuthenticationError = class extends APIError {
    constructor() {
      super(401, "authentication error");
      this.name = "AuthenticationError";
    }
  };
  const RateLimitError = class extends APIError {
    constructor() {
      super(429, "rate limit error");
      this.name = "RateLimitError";
    }
  };
  const APIConnectionError = class extends Error {
    constructor() {
      super("connection error");
      this.name = "APIConnectionError";
    }
  };

  class MockOpenAI {
    chat = { completions: { create: mockCreate } };
  }

  return {
    default: MockOpenAI,
    APIError,
    AuthenticationError,
    RateLimitError,
    APIConnectionError,
  };
});

function makeCompletionResponse(content: string) {
  return {
    choices: [{ message: { content } }],
  };
}

describe("OpenAiAdapter", () => {
  let adapter: OpenAiAdapter;

  beforeEach(() => {
    adapter = new OpenAiAdapter("test-api-key", "gpt-4o-mini");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ingestProduct", () => {
    it("returns product and product_rule suggestions from a valid response", async () => {
      const payload = {
        product: {
          name: "Copper Fungicide",
          category: "fungicide",
          activeSubstance: "Copper hydroxide",
          manufacturer: "AgroTech",
          formulation: "WG",
          defaultUnit: "g",
          notes: null,
        },
        product_rule: {
          plantName: "Tomato",
          doseValue: 20,
          doseUnit: "g",
          dilutionText: "20g / 10L water",
          reapplicationIntervalDays: 10,
          quarantinePeriodDays: 14,
        },
        warnings: ["Review label before saving."],
      };

      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      const result = await adapter.ingestProduct({ productName: "Copper Fungicide" });

      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0]!.type).toBe("product");
      expect(result.suggestions[1]!.type).toBe("product_rule");
      expect(result.warnings).toEqual(["Review label before saving."]);
    });

    it("uses deterministic temperature and strict json_schema for extraction", async () => {
      const payload = {
        product: {
          name: "X",
          category: "fungicide",
          activeSubstance: null,
          manufacturer: null,
          formulation: null,
          defaultUnit: "ml",
          notes: null,
        },
        product_rule: {
          plantName: null,
          doseValue: null,
          doseUnit: null,
          dilutionText: null,
          reapplicationIntervalDays: null,
          quarantinePeriodDays: null,
        },
        warnings: [],
      };
      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      await adapter.ingestProduct({ productName: "X" });

      const request = mockCreate.mock.calls[0]![0] as {
        temperature: number;
        response_format: {
          type: string;
          json_schema: { strict: boolean; name: string };
        };
      };
      expect(request.temperature).toBe(0);
      expect(request.response_format.type).toBe("json_schema");
      expect(request.response_format.json_schema.strict).toBe(true);
      expect(request.response_format.json_schema.name).toBe("product_ingestion");
    });

    it("drops an all-null product_rule (non-sprayable product)", async () => {
      const payload = {
        product: {
          name: "Granular Fertilizer",
          category: "fertilizer",
          activeSubstance: null,
          manufacturer: null,
          formulation: null,
          defaultUnit: "kg",
          notes: null,
        },
        product_rule: {
          plantName: null,
          doseValue: null,
          doseUnit: null,
          dilutionText: null,
          reapplicationIntervalDays: null,
          quarantinePeriodDays: null,
        },
        warnings: [],
      };
      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      const result = await adapter.ingestProduct({ productName: "Granular Fertilizer" });

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]!.type).toBe("product");
    });

    it("keeps a product_rule when only dilutionText is present", async () => {
      const payload = {
        product: {
          name: "Spray Fungicide",
          category: "fungicide",
          activeSubstance: null,
          manufacturer: null,
          formulation: null,
          defaultUnit: "ml",
          notes: null,
        },
        product_rule: {
          plantName: null,
          doseValue: null,
          doseUnit: null,
          dilutionText: "10 ml / 5 L water",
          reapplicationIntervalDays: 7,
          quarantinePeriodDays: null,
        },
        warnings: ["Dose not confirmed from label."],
      };
      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      const result = await adapter.ingestProduct({ productName: "Spray Fungicide" });

      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[1]!.type).toBe("product_rule");
      const rule = result.suggestions[1]!.payload as Record<string, unknown>;
      expect(rule.doseValue).toBe(0);
      expect(rule.dilutionText).toBe("10 ml / 5 L water");
      expect(rule.reapplicationIntervalDays).toBe(7);
    });

    it("returns only product suggestion when product_rule is absent", async () => {
      const payload = {
        product: {
          name: "Herbicide X",
          category: "herbicide",
          activeSubstance: null,
          manufacturer: null,
          formulation: null,
          defaultUnit: "ml",
          notes: null,
        },
        warnings: [],
      };

      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      const result = await adapter.ingestProduct({ labelText: "Herbicide label text" });

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]!.type).toBe("product");
      expect(result.warnings).toBeUndefined();
    });
  });

  describe("suggestBedPlan", () => {
    it("returns a bed_plan suggestion", async () => {
      const payload = {
        spacingSuggestions: [{ plant: "abc-uuid", spacingCm: 40 }],
        coexistenceNotes: ["Tomato and basil grow well together"],
        warnings: [],
        roughQuantityGuidance: [{ plant: "abc-uuid", recommendedCount: 3 }],
      };

      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      const result = await adapter.suggestBedPlan({
        bedId: "bed-uuid",
        year: 2026,
        candidatePlantIds: ["abc-uuid"],
      });

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]!.type).toBe("bed_plan");

      const p = result.suggestions[0]!.payload as Record<string, unknown>;
      expect(Array.isArray(p.spacingSuggestions)).toBe(true);
      expect(Array.isArray(p.coexistenceNotes)).toBe(true);
    });
  });

  describe("assistProblem", () => {
    it("returns a problem_summary suggestion", async () => {
      const payload = {
        summary: "Possible fungal infection based on described symptoms.",
        possibleCategories: ["fungus", "nutrient_deficiency"],
        followUpQuestions: ["When did you first notice this?"],
      };

      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      const result = await adapter.assistProblem({ text: "Yellow spots on leaves" });

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]!.type).toBe("problem_summary");

      const p = result.suggestions[0]!.payload as Record<string, unknown>;
      expect(p.summary).toBe("Possible fungal infection based on described symptoms.");
      expect(p.possibleCategories).toEqual(["fungus", "nutrient_deficiency"]);
    });
  });

  describe("error mapping", () => {
    it("maps AuthenticationError to AiProviderError", async () => {
      const { AuthenticationError } = await import("openai") as unknown as { AuthenticationError: AnyConstructor };
      mockCreate.mockRejectedValue(new AuthenticationError());

      await expect(adapter.ingestProduct({ productName: "test" })).rejects.toBeInstanceOf(AiProviderError);
    });

    it("maps RateLimitError to AiProviderError", async () => {
      const { RateLimitError } = await import("openai") as unknown as { RateLimitError: AnyConstructor };
      mockCreate.mockRejectedValue(new RateLimitError());

      await expect(adapter.suggestBedPlan({ bedId: "b", year: 2026, candidatePlantIds: [] })).rejects.toBeInstanceOf(AiProviderError);
    });

    it("maps APIConnectionError to AiProviderError", async () => {
      const { APIConnectionError } = await import("openai") as unknown as { APIConnectionError: AnyConstructor };
      mockCreate.mockRejectedValue(new APIConnectionError());

      await expect(adapter.assistProblem({ text: "test" })).rejects.toBeInstanceOf(AiProviderError);
    });

    it("maps generic APIError to AiProviderError", async () => {
      const { APIError } = await import("openai") as unknown as { APIError: AnyConstructor };
      mockCreate.mockRejectedValue(new APIError(500, "internal error"));

      await expect(adapter.ingestProduct({ productName: "test" })).rejects.toBeInstanceOf(AiProviderError);
    });

    it("does not expose api key in error message", async () => {
      const { APIError } = await import("openai") as unknown as { APIError: AnyConstructor };
      mockCreate.mockRejectedValue(new APIError(401, "Invalid API key sk-test-secret-key"));

      let thrownError: unknown;
      try {
        await adapter.ingestProduct({ productName: "test" });
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBeInstanceOf(AiProviderError);
      expect((thrownError as AiProviderError).message).not.toContain("sk-test-secret-key");
      expect((thrownError as AiProviderError).message).toBe("AI provider request failed");
    });
  });
});
