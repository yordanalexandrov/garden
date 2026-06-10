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

const DEFAULT_MODEL = "gpt-4o-mini";

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
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
      `You are a gardening product catalog assistant.
Extract structured product metadata from the given product name or label text.
Return a JSON object with these fields:
- product: { name, category, activeSubstance, manufacturer, formulation, defaultUnit, notes }
  - category must be one of: fungicide, herbicide, insecticide, fertilizer, growth_regulator, other
  - defaultUnit must be one of: ml, l, g, kg, tablet, sachet, other
- product_rule (optional): { plantName, doseValue, doseUnit, dilutionText, reapplicationIntervalDays, quarantinePeriodDays }
- warnings: string[] — list uncertainty notes if data is missing or unclear

Return only valid JSON. Do not include markdown fences.`,
      userContent,
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
      suggestions.push({
        type: "product_rule",
        payload: {
          ...(typeof r.plantName === "string" ? { plantName: r.plantName } : {}),
          doseValue: typeof r.doseValue === "number" ? r.doseValue : 0,
          doseUnit: str(r.doseUnit, "ml"),
          dilutionText: strOrNull(r.dilutionText),
          reapplicationIntervalDays:
            typeof r.reapplicationIntervalDays === "number" ? r.reapplicationIntervalDays : null,
          quarantinePeriodDays:
            typeof r.quarantinePeriodDays === "number" ? r.quarantinePeriodDays : null,
        },
      });
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

  private async callJson(systemPrompt: string, userContent: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
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
