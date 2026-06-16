import OpenAI, { APIConnectionError, APIError, AuthenticationError, RateLimitError } from "openai";

import { AiProviderError, type AiPort } from "./ai.port.js";
import type {
  AssistProblemInput,
  AssistProblemResult,
  GenerateProductRulesInput,
  GenerateProductRulesResult,
  IngestPlantInput,
  IngestPlantResult,
  IngestProductInput,
  IngestProductResult,
  NormalizedPlantPayload,
  NormalizedProductRulePayload,
  NormalizedSuggestion,
  ProductRuleOperation,
  SuggestBedPlanInput,
  SuggestBedPlanResult,
} from "./ai.types.js";

const DEFAULT_MODEL = "gpt-5.4";

// Deterministic extraction: low temperature keeps structured output stable.
const EXTRACTION_TEMPERATURE = 0;

const PRODUCT_CATEGORIES = [
  "fungicide",
  "herbicide",
  "insecticide",
  "fertilizer",
  "growth_regulator",
  "other",
] as const;

const PRODUCT_UNITS = ["ml", "l", "g", "kg", "tablet", "sachet", "other"] as const;

// product_usage_rules.dose_unit is constrained to these four in the database, so
// the rule-generation flow restricts doseUnit to them to avoid accept failures.
const RULE_UNITS = ["ml", "l", "g", "kg"] as const;

// Strict JSON Schema for product ingestion. Enforces valid enum values so the
// model can no longer return categories/units that silently collapse to "other".
// product_rule is always present but its inner fields may be null when the
// product has no sprayable application rule (e.g. a plain fertilizer).
const PRODUCT_INGESTION_SCHEMA = {
  name: "product_ingestion",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      product: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: [...PRODUCT_CATEGORIES] },
          activeSubstance: { type: ["string", "null"] },
          manufacturer: { type: ["string", "null"] },
          formulation: { type: ["string", "null"] },
          defaultUnit: { type: "string", enum: [...PRODUCT_UNITS] },
          notes: { type: ["string", "null"] },
        },
        required: [
          "name",
          "category",
          "activeSubstance",
          "manufacturer",
          "formulation",
          "defaultUnit",
          "notes",
        ],
      },
      product_rule: {
        type: "object",
        additionalProperties: false,
        properties: {
          plantName: { type: ["string", "null"] },
          doseValue: { type: ["number", "null"] },
          doseUnit: { type: ["string", "null"], enum: [...PRODUCT_UNITS, null] },
          dilutionText: { type: ["string", "null"] },
          reapplicationIntervalDays: { type: ["integer", "null"] },
          quarantinePeriodDays: { type: ["integer", "null"] },
        },
        required: [
          "plantName",
          "doseValue",
          "doseUnit",
          "dilutionText",
          "reapplicationIntervalDays",
          "quarantinePeriodDays",
        ],
      },
      warnings: { type: "array", items: { type: "string" } },
    },
    required: ["product", "product_rule", "warnings"],
  },
} as const;

const PLANT_LIFECYCLE_TYPES = ["annual", "biennial", "perennial"] as const;
const PLANT_GROWING_STYLES = [
  "tree",
  "shrub",
  "vine",
  "herb",
  "vegetable",
  "berry",
  "flower",
  "other",
] as const;

// Strict JSON Schema for plant ingestion. The model returns an array of
// plant variants so the user can choose the one they want. Each variant
// must carry rich Bulgarian notes (origin, characteristics, growing days, etc.).
const PLANT_INGESTION_SCHEMA = {
  name: "plant_ingestion",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      plants: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            commonName: { type: "string" },
            variety: { type: ["string", "null"] },
            plantCategory: { type: ["string", "null"] },
            lifecycleType: { type: "string", enum: [...PLANT_LIFECYCLE_TYPES] },
            growingStyle: { type: "string", enum: [...PLANT_GROWING_STYLES] },
            notes: { type: ["string", "null"] },
          },
          required: ["commonName", "variety", "plantCategory", "lifecycleType", "growingStyle", "notes"],
        },
      },
      warnings: { type: "array", items: { type: "string" } },
    },
    required: ["plants", "warnings"],
  },
} as const;

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// A product_rule is only a real spraying/application rule when at least one
// substantive field is present. All-null rules (non-sprayable products) are
// dropped so the UI is not offered an empty rule.
function hasSprayingRule(rule: Record<string, unknown>): boolean {
  return (
    typeof rule.plantName === "string" ||
    numOrNull(rule.doseValue) !== null ||
    typeof rule.dilutionText === "string" ||
    numOrNull(rule.reapplicationIntervalDays) !== null ||
    numOrNull(rule.quarantinePeriodDays) !== null
  );
}

export type OpenAiAdapterOptions = {
  // When true, product ingestion may use OpenAI's hosted web_search tool to look
  // up products it does not already know. The search runs on OpenAI's side.
  webSearch?: boolean;
};

export class OpenAiAdapter implements AiPort {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly webSearch: boolean;

  constructor(apiKey: string, model?: string, options?: OpenAiAdapterOptions) {
    this.client = new OpenAI({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
    this.webSearch = options?.webSearch ?? false;
  }

  async ingestProduct(input: IngestProductInput): Promise<IngestProductResult> {
    const userContent = [
      input.productName ? `Product name: ${input.productName}` : null,
      input.labelText ? `Label text: ${input.labelText}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await this.callStructuredJson(
      `You are an expert assistant for a gardening app that catalogs plant-protection
products (fungicides, herbicides, insecticides, growth regulators) and fertilizers.

Given a product name and/or the text of its label, do TWO things:
1. Extract structured catalog metadata for the product.
2. Whenever the product is a sprayable plant-protection product, OR any product
   whose label carries dosing/application instructions, derive a concrete
   spraying/application rule. This is the most important output — do not omit it
   for sprayable products.

Source-of-truth and honesty rules:
- The label text is the primary source of truth.
- If the product is unknown to you or the label text is missing/incomplete, use the
  web_search tool to look up the official manufacturer label, product page, or
  safety data sheet, and extract the values from there. Prefer official/manufacturer
  and regulatory sources over forums or retailers.
- Never invent a precise dose, interval, or quarantine. If you cannot confirm a
  value from your knowledge or from web search, leave that field null and add a
  warning explaining what is missing.
- When you use web search, add a warning naming the source(s) you relied on so the
  user can verify before saving.
- Always write all free-text fields (notes, dilutionText, warnings) in Bulgarian,
  regardless of the language of the input. Keep enum values (category, units) exactly
  as the English tokens listed below.

Field rules:
- product.category must be exactly one of:
  fungicide, herbicide, insecticide, fertilizer, growth_regulator, other.
- product.defaultUnit and product_rule.doseUnit must be exactly one of:
  ml, l, g, kg, tablet, sachet, other.
- product_rule.plantName: the target crop/plant if the label specifies one, else null.
- product_rule.doseValue + doseUnit: the application dose (e.g. 20 + "g"), else null.
- product_rule.dilutionText: human-readable dilution (e.g. "20 g / 10 L water"), else null.
- product_rule.reapplicationIntervalDays: integer days between sprays, else null.
- product_rule.quarantinePeriodDays: integer days before harvest, else null.
- If the product genuinely has no spraying/application rule (e.g. a plain granular
  fertilizer), set every product_rule field to null.
- warnings: list every missing field, assumption, or uncertainty.

Return data that conforms to the provided JSON schema.`,
      userContent,
      PRODUCT_INGESTION_SCHEMA,
    );

    const suggestions: NormalizedSuggestion[] = [];
    const warnings: string[] = Array.isArray(raw.warnings) ? (raw.warnings as string[]) : [];

    if (raw.product && typeof raw.product === "object") {
      const p = raw.product as Record<string, unknown>;
      suggestions.push({
        type: "product",
        payload: {
          name: str(p.name),
          category: str(p.category, "other"),
          activeSubstance: strOrNull(p.activeSubstance),
          manufacturer: strOrNull(p.manufacturer),
          formulation: strOrNull(p.formulation),
          defaultUnit: str(p.defaultUnit, "other"),
          notes: strOrNull(p.notes),
        },
      });
    }

    if (raw.product_rule && typeof raw.product_rule === "object") {
      const r = raw.product_rule as Record<string, unknown>;
      if (hasSprayingRule(r)) {
        suggestions.push({
          type: "product_rule",
          payload: {
            ...(typeof r.plantName === "string" ? { plantName: r.plantName } : {}),
            doseValue: numOrNull(r.doseValue) ?? 0,
            doseUnit: str(r.doseUnit, "ml"),
            dilutionText: strOrNull(r.dilutionText),
            reapplicationIntervalDays: numOrNull(r.reapplicationIntervalDays),
            quarantinePeriodDays: numOrNull(r.quarantinePeriodDays),
          },
        });
      }
    }

    return warnings.length > 0 ? { suggestions, warnings } : { suggestions };
  }

  async ingestPlant(input: IngestPlantInput): Promise<IngestPlantResult> {
    const userContent = [
      `Plant name: ${input.plantName}`,
      input.notes ? `Additional notes from user: ${input.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await this.callStructuredJson(
      `You are an expert assistant for a Bulgarian gardening app that manages a plant catalog.

Given a plant name (and optional notes), search for and return 3 to 5 distinct varieties
or cultivars of that plant that are commonly grown or available in Bulgaria.

Search strategy:
- Use the web_search tool to look up Bulgarian gardening websites, seed catalogs,
  and nursery sites (e.g. kalina-sad.bg, rasadnik.bg, semena.bg, obi.bg/градина,
  Bulgarian agricultural extension sites). Prefer Bulgarian-language sources.
- If no distinct varieties are found for the plant, return the species itself as a
  single item with variety set to null.
- Never invent a variety that does not exist. If you are unsure, set variety to null
  and add a warning.

For each plant variant, include rich Bulgarian notes covering:
- origin and region (e.g. "Български сорт, създаден в Садово")
- key characteristics (color, size, flavor, disease resistance, etc.)
- growing season / days to maturity
- any special care requirements or known advantages
- availability in Bulgaria

Language: write ALL free-text fields (notes, warnings, plantCategory) in Bulgarian.
Keep enum fields (lifecycleType, growingStyle) as the exact English tokens below.

Enum rules:
- lifecycleType must be exactly one of: annual, biennial, perennial
- growingStyle must be exactly one of: tree, shrub, vine, herb, vegetable, berry, flower, other

When you use web search, add a warning naming the source(s) you relied on.

Return data that conforms to the provided JSON schema.`,
      userContent,
      PLANT_INGESTION_SCHEMA,
    );

    const rawPlants = Array.isArray(raw.plants) ? raw.plants : [];
    const warnings: string[] = Array.isArray(raw.warnings) ? (raw.warnings as string[]) : [];

    const suggestions: NormalizedSuggestion[] = rawPlants
      .filter((p): p is Record<string, unknown> => p !== null && typeof p === "object")
      .map((p): NormalizedSuggestion => {
        const payload: NormalizedPlantPayload = {
          commonName: str(p.commonName, input.plantName),
          variety: strOrNull(p.variety),
          plantCategory: strOrNull(p.plantCategory),
          lifecycleType: str(p.lifecycleType, "annual"),
          growingStyle: str(p.growingStyle, "other"),
          notes: strOrNull(p.notes),
        };
        return { type: "plant", payload };
      });

    return warnings.length > 0 ? { suggestions, warnings } : { suggestions };
  }

  async suggestBedPlan(input: SuggestBedPlanInput): Promise<SuggestBedPlanResult> {
    const userContent = [
      `Bed ID: ${input.bedId}`,
      `Year: ${input.year}`,
      `Candidate plant IDs: ${input.candidatePlantIds.join(", ")}`,
      input.notes ? `Notes: ${input.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await this.callJson(
      `You are a vegetable garden planning assistant.
Suggest a planting plan for the given bed based on the candidate plants.
Return a JSON object with these fields:
- spacingSuggestions: [{ plant, spacingCm }] — recommended spacing per plant
- coexistenceNotes: string[] — companion planting notes (in Bulgarian)
- warnings: string[] — any caveats or uncertainties (in Bulgarian)
- roughQuantityGuidance: [{ plant, recommendedCount }] — rough plant counts

The plant identifiers are UUIDs — use them as-is in your suggestions.
Always write all free-text fields (coexistenceNotes, warnings) in Bulgarian.
Return only valid JSON. Do not include markdown fences.`,
      userContent,
    );

    const suggestions: NormalizedSuggestion[] = [
      {
        type: "bed_plan",
        payload: {
          spacingSuggestions: Array.isArray(raw.spacingSuggestions) ? raw.spacingSuggestions : [],
          coexistenceNotes: Array.isArray(raw.coexistenceNotes) ? raw.coexistenceNotes : [],
          warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
          roughQuantityGuidance: Array.isArray(raw.roughQuantityGuidance)
            ? raw.roughQuantityGuidance
            : [],
        },
      },
    ];

    return { suggestions };
  }

  async assistProblem(input: AssistProblemInput): Promise<AssistProblemResult> {
    const userContent = [
      input.problemId ? `Problem ID: ${input.problemId}` : null,
      input.text ? `Description: ${input.text}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await this.callJson(
      `You are a gardening problem diagnostic assistant.
Analyze the described plant problem and provide advisory information only.
You must NOT make definitive diagnoses — present possibilities, not conclusions.
Always write all free-text output (summary, followUpQuestions) in Bulgarian.
Return a JSON object with these fields:
- summary: string — a brief, cautious advisory summary (in Bulgarian)
- possibleCategories: string[] — possible problem categories (e.g. fungus, pest, nutrient_deficiency, environmental)
- followUpQuestions: string[] — clarifying questions to narrow down the problem (in Bulgarian)

Return only valid JSON. Do not include markdown fences.`,
      userContent,
    );

    const suggestions: NormalizedSuggestion[] = [
      {
        type: "problem_summary",
        payload: {
          summary: typeof raw.summary === "string" ? raw.summary : "",
          possibleCategories: Array.isArray(raw.possibleCategories)
            ? (raw.possibleCategories as string[])
            : [],
          followUpQuestions: Array.isArray(raw.followUpQuestions) ? raw.followUpQuestions : [],
        },
      },
    ];

    return { suggestions };
  }

  async generateProductRules(input: GenerateProductRulesInput): Promise<GenerateProductRulesResult> {
    const plantIds = input.plants.map((p) => p.plantId);
    const ruleIds = input.existingRules.map((r) => r.ruleId);

    // No plants to target — nothing the model can produce.
    if (plantIds.length === 0) {
      return { suggestions: [], warnings: ["Няма налични растения в акаунта, за които да се генерира правило."] };
    }

    const userContent = [
      "Продукт:",
      JSON.stringify(input.product, null, 2),
      "",
      "Съществуващи правила за продукта (опресни ги, ако имаш по-добри данни):",
      input.existingRules.length > 0 ? JSON.stringify(input.existingRules, null, 2) : "няма",
      "",
      "Растения в акаунта (избери само подходящите за този продукт):",
      JSON.stringify(input.plants, null, 2),
    ].join("\n");

    // Constrain plantId/ruleId to the exact values we provided so the model can
    // only choose from the account's real rows; the service re-validates anyway.
    const schema = {
      name: "product_rule_generation",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          rules: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                plantId: { type: "string", enum: plantIds },
                operation: { type: "string", enum: ["create", "update"] },
                ruleId: { type: ["string", "null"], enum: [...ruleIds, null] },
                doseValue: { type: ["number", "null"] },
                doseUnit: { type: ["string", "null"], enum: [...RULE_UNITS, null] },
                dilutionText: { type: ["string", "null"] },
                applicationMethod: { type: ["string", "null"] },
                reapplicationIntervalDays: { type: ["integer", "null"] },
                quarantinePeriodDays: { type: ["integer", "null"] },
                notes: { type: ["string", "null"] },
              },
              required: [
                "plantId",
                "operation",
                "ruleId",
                "doseValue",
                "doseUnit",
                "dilutionText",
                "applicationMethod",
                "reapplicationIntervalDays",
                "quarantinePeriodDays",
                "notes",
              ],
            },
          },
          warnings: { type: "array", items: { type: "string" } },
        },
        required: ["rules", "warnings"],
      },
    };

    const raw = await this.callStructuredJson(
      `You are an expert assistant for a Bulgarian gardening app. The user owns a
specific plant-protection / fertilizer product and a set of plants. Your job is
to propose concrete spraying/application rules (dose, dilution, intervals,
quarantine) for the plants this product is suitable for.

Rules:
- Only propose rules for plants from the provided list, using their exact plantId.
- If a plant already has an existing rule and you can improve/refresh it, set
  operation to "update" and reference that rule's exact ruleId. Otherwise set
  operation to "create" and ruleId to null.
- Only include plants for which this product is genuinely appropriate. Skip the
  rest — do not pad the list.
- doseUnit must be exactly one of: ml, l, g, kg.
- Never invent a precise dose, interval, or quarantine. If you cannot confirm a
  value, set it to null and add a warning explaining what is missing.
- Write all free-text fields (dilutionText, applicationMethod, notes, warnings)
  in Bulgarian.

Return data that conforms to the provided JSON schema.`,
      userContent,
      schema,
    );

    const rawRules = Array.isArray(raw.rules) ? raw.rules : [];
    const warnings: string[] = Array.isArray(raw.warnings) ? (raw.warnings as string[]) : [];

    const plantIdSet = new Set(plantIds);
    const ruleIdSet = new Set(ruleIds);

    const suggestions: NormalizedSuggestion[] = rawRules
      .filter((r): r is Record<string, unknown> => r !== null && typeof r === "object")
      .filter((r) => typeof r.plantId === "string" && plantIdSet.has(r.plantId))
      .map((r): NormalizedSuggestion => {
        const operation: ProductRuleOperation = r.operation === "update" ? "update" : "create";
        const ruleId = typeof r.ruleId === "string" && ruleIdSet.has(r.ruleId) ? r.ruleId : undefined;
        const plant = input.plants.find((p) => p.plantId === r.plantId);

        const payload: NormalizedProductRulePayload = {
          plantId: r.plantId as string,
          ...(plant !== undefined ? { plantName: plant.commonName } : {}),
          operation,
          ...(operation === "update" && ruleId !== undefined ? { ruleId } : {}),
          doseValue: numOrNull(r.doseValue) ?? 0,
          doseUnit: str(r.doseUnit, "ml"),
          dilutionText: strOrNull(r.dilutionText),
          applicationMethod: strOrNull(r.applicationMethod),
          reapplicationIntervalDays: numOrNull(r.reapplicationIntervalDays),
          quarantinePeriodDays: numOrNull(r.quarantinePeriodDays),
          notes: strOrNull(r.notes),
        };

        return { type: "product_rule", payload };
      });

    return warnings.length > 0 ? { suggestions, warnings } : { suggestions };
  }

  // Structured extraction via the Responses API. Enables the hosted web_search
  // tool (when configured) so the model can look up products it does not know,
  // and enforces the strict JSON schema on the final message.
  private async callStructuredJson(
    systemPrompt: string,
    userContent: string,
    schema: { name: string; strict: boolean; schema: Record<string, unknown> },
  ): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.responses.create({
        model: this.model,
        temperature: EXTRACTION_TEMPERATURE,
        ...(this.webSearch ? { tools: [{ type: "web_search" }] } : {}),
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        text: {
          format: {
            type: "json_schema",
            name: schema.name,
            strict: schema.strict,
            schema: schema.schema,
          },
        },
      });

      const content = response.output_text.length > 0 ? response.output_text : "{}";
      return JSON.parse(content) as Record<string, unknown>;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private async callJson(systemPrompt: string, userContent: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: EXTRACTION_TEMPERATURE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      });

      const content = response.choices[0]?.message?.content ?? "{}";
      return JSON.parse(content) as Record<string, unknown>;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): unknown {
    if (
      error instanceof AuthenticationError ||
      error instanceof RateLimitError ||
      error instanceof APIConnectionError ||
      error instanceof APIError
    ) {
      return new AiProviderError("AI provider request failed");
    }
    return error;
  }
}
