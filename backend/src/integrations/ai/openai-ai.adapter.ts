import OpenAI, { APIConnectionError, APIError, AuthenticationError, RateLimitError } from "openai";

import { AiProviderError, type AiPort } from "./ai.port.js";
import type {
  AssistProblemInput,
  AssistProblemResult,
  IngestProductInput,
  IngestProductResult,
  NormalizedSuggestion,
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

export class OpenAiAdapter implements AiPort {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
  }

  async ingestProduct(input: IngestProductInput): Promise<IngestProductResult> {
    const userContent = [
      input.productName ? `Product name: ${input.productName}` : null,
      input.labelText ? `Label text: ${input.labelText}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await this.callJson(
      `You are an expert assistant for a gardening app that catalogs plant-protection
products (fungicides, herbicides, insecticides, growth regulators) and fertilizers.

Given a product name and/or the text of its label, do TWO things:
1. Extract structured catalog metadata for the product.
2. Whenever the product is a sprayable plant-protection product, OR any product
   whose label carries dosing/application instructions, derive a concrete
   spraying/application rule. This is the most important output — do not omit it
   for sprayable products.

Source-of-truth and honesty rules:
- The label text is the primary source of truth. If only a product name is given,
  you may rely on well-known manufacturer label information, but you MUST add a
  warning that the values are not confirmed from a label, and leave a field null
  rather than inventing a precise dose, interval, or quarantine you are unsure of.
- Detect the language of the input and write free-text fields (notes, dilutionText,
  warnings) in that same language. Keep enum values (category, units) exactly as
  the English tokens listed below.

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
- coexistenceNotes: string[] — companion planting notes
- warnings: string[] — any caveats or uncertainties
- roughQuantityGuidance: [{ plant, recommendedCount }] — rough plant counts

The plant identifiers are UUIDs — use them as-is in your suggestions.
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
Return a JSON object with these fields:
- summary: string — a brief, cautious advisory summary
- possibleCategories: string[] — possible problem categories (e.g. fungus, pest, nutrient_deficiency, environmental)
- followUpQuestions: string[] — clarifying questions to narrow down the problem

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

  private async callJson(
    systemPrompt: string,
    userContent: string,
    schema?: typeof PRODUCT_INGESTION_SCHEMA,
  ): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: EXTRACTION_TEMPERATURE,
        response_format: schema
          ? { type: "json_schema", json_schema: schema }
          : { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      });

      const content = response.choices[0]?.message?.content ?? "{}";
      return JSON.parse(content) as Record<string, unknown>;
    } catch (error) {
      if (
        error instanceof AuthenticationError ||
        error instanceof RateLimitError ||
        error instanceof APIConnectionError ||
        error instanceof APIError
      ) {
        throw new AiProviderError("AI provider request failed");
      }
      throw error;
    }
  }
}
