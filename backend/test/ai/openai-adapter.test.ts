import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AiProviderError } from "../../src/integrations/ai/ai.port.js";
import { OpenAiAdapter } from "../../src/integrations/ai/openai-ai.adapter.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConstructor = new (...args: any[]) => Error;

const mockCreate = vi.fn();
const mockResponsesCreate = vi.fn();

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
    responses = { create: mockResponsesCreate };
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

// Responses API returns an aggregated `output_text` convenience field.
function makeResponse(content: string) {
  return { output_text: content };
}

describe("OpenAiAdapter", () => {
  let adapter: OpenAiAdapter;

  beforeEach(() => {
    adapter = new OpenAiAdapter("test-api-key", "gpt-4o-mini", { webSearch: true });
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

      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

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
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      await adapter.ingestProduct({ productName: "X" });

      const request = mockResponsesCreate.mock.calls[0]![0] as {
        temperature: number;
        tools?: Array<{ type: string }>;
        text: { format: { type: string; strict: boolean; name: string } };
      };
      expect(request.temperature).toBe(0);
      expect(request.text.format.type).toBe("json_schema");
      expect(request.text.format.strict).toBe(true);
      expect(request.text.format.name).toBe("product_ingestion");
      // web_search enabled for this adapter (constructed with webSearch: true)
      expect(request.tools).toEqual([{ type: "web_search" }]);
    });

    it("omits the web_search tool when web search is disabled", async () => {
      const offAdapter = new OpenAiAdapter("test-api-key", "gpt-4o-mini", { webSearch: false });
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
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      await offAdapter.ingestProduct({ productName: "X" });

      const request = mockResponsesCreate.mock.calls[0]![0] as { tools?: unknown };
      expect(request.tools).toBeUndefined();
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
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

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
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

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

      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      const result = await adapter.ingestProduct({ labelText: "Herbicide label text" });

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]!.type).toBe("product");
      expect(result.warnings).toBeUndefined();
    });
  });

  describe("ingestPlant", () => {
    it("returns multiple plant suggestions (one per variant)", async () => {
      const payload = {
        plants: [
          {
            commonName: "Домат",
            variety: "Воловско сърце",
            plantCategory: "Плодови зеленчуци",
            lifecycleType: "annual",
            growingStyle: "vegetable",
            notes: "Едроплоден сорт, 80 дни до зреене.",
          },
          {
            commonName: "Домат",
            variety: "Черри Бела",
            plantCategory: "Плодови зеленчуци",
            lifecycleType: "annual",
            growingStyle: "vegetable",
            notes: "Черешов тип, 60 дни.",
          },
        ],
        warnings: ["Информацията е проверена от kalina-sad.bg"],
      };
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      const result = await adapter.ingestPlant({ plantName: "Домат" });

      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0]!.type).toBe("plant");
      expect(result.suggestions[1]!.type).toBe("plant");
      expect(result.warnings).toEqual(["Информацията е проверена от kalina-sad.bg"]);

      const first = result.suggestions[0]!.payload as Record<string, unknown>;
      expect(first.variety).toBe("Воловско сърце");
      expect(first.lifecycleType).toBe("annual");
      expect(first.growingStyle).toBe("vegetable");
    });

    it("uses Responses API with strict json_schema and web_search", async () => {
      const payload = { plants: [], warnings: [] };
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      await adapter.ingestPlant({ plantName: "Краставица" });

      const request = mockResponsesCreate.mock.calls[0]![0] as {
        temperature: number;
        tools?: Array<{ type: string }>;
        text: { format: { type: string; strict: boolean; name: string } };
      };
      expect(request.temperature).toBe(0);
      expect(request.text.format.type).toBe("json_schema");
      expect(request.text.format.strict).toBe(true);
      expect(request.text.format.name).toBe("plant_ingestion");
      expect(request.tools).toEqual([{ type: "web_search" }]);
    });

    it("returns no suggestions when model finds no variants", async () => {
      const payload = {
        plants: [],
        warnings: ["Не са намерени конкретни сортове."],
      };
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      const result = await adapter.ingestPlant({ plantName: "Неизвестно растение" });

      expect(result.suggestions).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
    });

    it("includes group, variety and follow-up answers in the user content", async () => {
      const payload = { plants: [], followUpQuestions: [], warnings: [] };
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      await adapter.ingestPlant({
        plantName: "Домат",
        group: "Домат",
        variety: "Воловско сърце",
        notes: "за оранжерия",
        followUpAnswers: [{ question: "За оранжерия ли?", answer: "да" }],
      });

      const request = mockResponsesCreate.mock.calls[0]![0] as {
        input: Array<{ role: string; content: unknown }>;
      };
      const userContent = request.input.find((m) => m.role === "user")?.content as string;

      expect(userContent).toContain("Домат");
      expect(userContent).toContain("Воловско сърце");
      expect(userContent).toContain("за оранжерия");
      expect(userContent).toContain("За оранжерия ли? → да");
    });

    it("attaches the photo as an input_image part alongside the text", async () => {
      const payload = { plants: [], followUpQuestions: [], warnings: [] };
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      const photoDataUrl = "data:image/jpeg;base64,aGVsbG8=";
      await adapter.ingestPlant({ photoDataUrl });

      const request = mockResponsesCreate.mock.calls[0]![0] as {
        input: Array<{ role: string; content: unknown }>;
      };
      const userContent = request.input.find((m) => m.role === "user")?.content as Array<Record<string, unknown>>;

      expect(Array.isArray(userContent)).toBe(true);
      expect(userContent[0]).toMatchObject({ type: "input_text" });
      expect(userContent[1]).toMatchObject({ type: "input_image", image_url: photoDataUrl });
    });

    it("maps followUpQuestions into a followup_questions suggestion", async () => {
      const payload = {
        plants: [
          {
            commonName: "Домат",
            variety: null,
            plantCategory: "Плодови зеленчуци",
            lifecycleType: "annual",
            growingStyle: "vegetable",
            notes: null,
          },
        ],
        followUpQuestions: [
          { text: "За оранжерия ли търсите сорта?", type: "yes_no" },
          { text: "Каква е основната употреба?", type: "free_text" },
        ],
        warnings: [],
      };
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      const result = await adapter.ingestPlant({ plantName: "Домат" });

      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0]!.type).toBe("plant");
      expect(result.suggestions[1]!.type).toBe("followup_questions");
      expect(result.suggestions[1]!.payload).toEqual({
        questions: [
          { text: "За оранжерия ли търсите сорта?", type: "yes_no" },
          { text: "Каква е основната употреба?", type: "free_text" },
        ],
      });
    });

    it("omits the followup_questions suggestion when the model asks nothing", async () => {
      const payload = { plants: [], followUpQuestions: [], warnings: [] };
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      const result = await adapter.ingestPlant({ plantName: "Домат" });

      expect(result.suggestions.filter((s) => s.type === "followup_questions")).toHaveLength(0);
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

    it("filters out categories not in the valid enum", async () => {
      const payload = {
        summary: "Possible pest or environmental issue.",
        possibleCategories: ["fungus", "pest", "environmental", "unknown"],
        followUpQuestions: [],
      };

      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      const result = await adapter.assistProblem({ text: "Yellow spots on leaves" });
      const p = result.suggestions[0]!.payload as Record<string, unknown>;

      expect(p.possibleCategories).toEqual(["fungus", "unknown"]);
    });

    it("returns typed followUpQuestions with yes_no and free_text", async () => {
      const payload = {
        summary: "Possible fungal infection.",
        possibleCategories: ["fungus"],
        followUpQuestions: [
          { text: "Влажни ли са петната?", type: "yes_no" },
          { text: "Кога за последен път полихте?", type: "free_text" },
        ],
      };
      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      const result = await adapter.assistProblem({ text: "Yellow spots" });
      const p = result.suggestions[0]!.payload as Record<string, unknown>;
      const questions = p.followUpQuestions as Array<{ text: string; type: string }>;

      expect(questions).toHaveLength(2);
      expect(questions[0]!.type).toBe("yes_no");
      expect(questions[0]!.text).toBe("Влажни ли са петната?");
      expect(questions[1]!.type).toBe("free_text");
    });

    it("defaults unknown question type to free_text", async () => {
      const payload = {
        summary: "Possible infection.",
        possibleCategories: [],
        followUpQuestions: [{ text: "Кога забелязахте?", type: "unknown_type" }],
      };
      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      const result = await adapter.assistProblem({ text: "Yellow spots" });
      const p = result.suggestions[0]!.payload as Record<string, unknown>;
      const questions = p.followUpQuestions as Array<{ text: string; type: string }>;

      expect(questions[0]!.type).toBe("free_text");
    });

    it("handles legacy string question format with free_text type", async () => {
      const payload = {
        summary: "Possible infection.",
        possibleCategories: [],
        followUpQuestions: ["Кога забелязахте?"],
      };
      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      const result = await adapter.assistProblem({ text: "Yellow spots" });
      const p = result.suggestions[0]!.payload as Record<string, unknown>;
      const questions = p.followUpQuestions as Array<{ text: string; type: string }>;

      expect(questions[0]!.type).toBe("free_text");
      expect(questions[0]!.text).toBe("Кога забелязахте?");
    });

    it("sends image_url content blocks when photoUrls provided", async () => {
      const payload = {
        summary: "Possible infection.",
        possibleCategories: ["fungus"],
        followUpQuestions: [],
      };
      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      await adapter.assistProblem({
        text: "Yellow spots",
        photoUrls: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
      });

      expect(mockCreate).toHaveBeenCalledOnce();
      const call = mockCreate.mock.calls[0]![0] as {
        messages: Array<{ role: string; content: unknown }>;
      };
      const userMsg = call.messages[1]!;
      expect(Array.isArray(userMsg.content)).toBe(true);
      const parts = userMsg.content as Array<{ type: string; image_url?: { url: string } }>;
      const imageParts = parts.filter((c) => c.type === "image_url");
      expect(imageParts).toHaveLength(2);
      expect(imageParts[0]!.image_url!.url).toBe("https://example.com/photo1.jpg");
    });

    it("uses plain text message (not multimodal) when no photoUrls", async () => {
      const payload = {
        summary: "Possible infection.",
        possibleCategories: [],
        followUpQuestions: [],
      };
      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      await adapter.assistProblem({ text: "Yellow spots" });

      const call = mockCreate.mock.calls[0]![0] as {
        messages: Array<{ role: string; content: unknown }>;
      };
      const userContent = call.messages[1]!.content;
      expect(typeof userContent).toBe("string");
    });

    it("appends followUpAnswers to user content when provided", async () => {
      const payload = {
        summary: "More specific advice.",
        possibleCategories: ["fungus"],
        followUpQuestions: [],
      };
      mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

      await adapter.assistProblem({
        text: "Yellow spots",
        followUpAnswers: [
          { question: "Влажни ли са петната?", answer: "да" },
          { question: "Кога забелязахте?", answer: "Преди 3 дни" },
        ],
      });

      const call = mockCreate.mock.calls[0]![0] as {
        messages: Array<{ role: string; content: unknown }>;
      };
      const userContent = call.messages[1]!.content as string;
      expect(userContent).toContain("Влажни ли са петната?");
      expect(userContent).toContain("да");
      expect(userContent).toContain("Преди 3 дни");
    });
  });

  describe("generateProductRules", () => {
    const baseInput = {
      product: {
        id: "prod-1",
        name: "Copper Fungicide",
        category: "fungicide",
        activeSubstance: "Copper",
        manufacturer: null,
        formulation: null,
        defaultUnit: "g",
        notes: null,
      },
      existingRules: [
        {
          ruleId: "rule-1",
          plantId: "plant-1",
          plantName: "Домат",
          doseValue: 20,
          doseUnit: "g",
          dilutionText: null,
          applicationMethod: null,
          reapplicationIntervalDays: null,
          quarantinePeriodDays: null,
        },
      ],
      plants: [
        { plantId: "plant-1", commonName: "Домат", variety: null, plantCategory: null },
        { plantId: "plant-2", commonName: "Краставица", variety: null, plantCategory: null },
      ],
    };

    it("maps create and update rule proposals from a valid response", async () => {
      const payload = {
        rules: [
          {
            plantId: "plant-1",
            operation: "update",
            ruleId: "rule-1",
            doseValue: 15,
            doseUnit: "g",
            dilutionText: "15 g / 10 l вода",
            applicationMethod: null,
            reapplicationIntervalDays: 7,
            quarantinePeriodDays: 14,
            notes: "Опреснени стойности.",
          },
          {
            plantId: "plant-2",
            operation: "create",
            ruleId: null,
            doseValue: 10,
            doseUnit: "g",
            dilutionText: null,
            applicationMethod: null,
            reapplicationIntervalDays: null,
            quarantinePeriodDays: null,
            notes: null,
          },
        ],
        warnings: ["Потвърдете преди запис."],
      };
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      const result = await adapter.generateProductRules(baseInput);

      expect(result.suggestions).toHaveLength(2);
      const first = result.suggestions[0]!.payload as Record<string, unknown>;
      expect(first.plantId).toBe("plant-1");
      expect(first.operation).toBe("update");
      expect(first.ruleId).toBe("rule-1");
      const second = result.suggestions[1]!.payload as Record<string, unknown>;
      expect(second.operation).toBe("create");
      expect(second.ruleId).toBeUndefined();
      expect(result.warnings).toEqual(["Потвърдете преди запис."]);
    });

    it("uses a strict json_schema named product_rule_generation", async () => {
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify({ rules: [], warnings: [] })));

      await adapter.generateProductRules(baseInput);

      const request = mockResponsesCreate.mock.calls[0]![0] as {
        text: { format: { type: string; strict: boolean; name: string } };
      };
      expect(request.text.format.type).toBe("json_schema");
      expect(request.text.format.strict).toBe(true);
      expect(request.text.format.name).toBe("product_rule_generation");
    });

    it("drops proposals for plants not in the provided set", async () => {
      const payload = {
        rules: [
          {
            plantId: "unknown-plant",
            operation: "create",
            ruleId: null,
            doseValue: 10,
            doseUnit: "g",
            dilutionText: null,
            applicationMethod: null,
            reapplicationIntervalDays: null,
            quarantinePeriodDays: null,
            notes: null,
          },
        ],
        warnings: [],
      };
      mockResponsesCreate.mockResolvedValue(makeResponse(JSON.stringify(payload)));

      const result = await adapter.generateProductRules(baseInput);

      expect(result.suggestions).toHaveLength(0);
    });

    it("returns early without calling the model when there are no plants", async () => {
      const result = await adapter.generateProductRules({ ...baseInput, plants: [] });

      expect(result.suggestions).toHaveLength(0);
      expect(result.warnings).toBeDefined();
      expect(mockResponsesCreate).not.toHaveBeenCalled();
    });
  });

  describe("error mapping", () => {
    it("maps AuthenticationError to AiProviderError", async () => {
      const { AuthenticationError } = await import("openai") as unknown as { AuthenticationError: AnyConstructor };
      mockResponsesCreate.mockRejectedValue(new AuthenticationError());

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
      mockResponsesCreate.mockRejectedValue(new APIError(500, "internal error"));

      await expect(adapter.ingestProduct({ productName: "test" })).rejects.toBeInstanceOf(AiProviderError);
    });

    it("does not expose api key in error message", async () => {
      const { APIError } = await import("openai") as unknown as { APIError: AnyConstructor };
      mockResponsesCreate.mockRejectedValue(new APIError(401, "Invalid API key sk-test-secret-key"));

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
