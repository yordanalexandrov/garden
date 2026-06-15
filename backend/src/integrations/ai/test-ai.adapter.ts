import { AiProviderError, type AiPort } from "./ai.port.js";
import type {
  AssistProblemInput,
  AssistProblemResult,
  IngestPlantInput,
  IngestPlantResult,
  IngestProductInput,
  IngestProductResult,
  NormalizedSuggestion,
  SuggestBedPlanInput,
  SuggestBedPlanResult
} from "./ai.types.js";

export type TestAiAdapterOptions = {
  failRequests?: boolean;
};

const DEFAULT_PRODUCT_SUGGESTIONS: NormalizedSuggestion[] = [
  {
    type: "product",
    payload: {
      name: "Test Fungicide",
      category: "fungicide",
      activeSubstance: "Copper",
      manufacturer: "Test Co",
      formulation: "WG",
      defaultUnit: "g",
      notes: null
    }
  },
  {
    type: "product_rule",
    payload: {
      plantName: "Tomato",
      doseValue: 20,
      doseUnit: "g",
      dilutionText: "20 g / 10 l water",
      reapplicationIntervalDays: 10,
      quarantinePeriodDays: 14
    }
  }
];

const DEFAULT_BED_PLAN_SUGGESTIONS: NormalizedSuggestion[] = [
  {
    type: "bed_plan",
    payload: {
      spacingSuggestions: [{ plant: "Tomato", spacingCm: 50 }],
      coexistenceNotes: ["Tomato and basil grow well together"],
      warnings: [],
      roughQuantityGuidance: [{ plant: "Tomato", recommendedCount: 2 }]
    }
  }
];

const DEFAULT_PROBLEM_SUGGESTIONS: NormalizedSuggestion[] = [
  {
    type: "problem_summary",
    payload: {
      summary: "Possible fungal infection based on the described symptoms.",
      possibleCategories: ["fungus", "nutrient_deficiency"],
      followUpQuestions: ["When did you first notice the symptoms?"]
    }
  }
];

const DEFAULT_PLANT_SUGGESTIONS: NormalizedSuggestion[] = [
  {
    type: "plant",
    payload: {
      commonName: "Домат",
      variety: "Воловско сърце",
      plantCategory: "Плодови зеленчуци",
      lifecycleType: "annual",
      growingStyle: "vegetable",
      notes: "Едроплоден български сорт. Плодовете достигат 300-500 г. Зреене около 80 дни."
    }
  },
  {
    type: "plant",
    payload: {
      commonName: "Домат",
      variety: "Белозерка",
      plantCategory: "Плодови зеленчуци",
      lifecycleType: "annual",
      growingStyle: "vegetable",
      notes: "Месест, слабо семенен сорт. Подходящ за консерви. Зреене 75 дни."
    }
  }
];

export class TestAiAdapter implements AiPort {
  readonly ingestProductCalls: IngestProductInput[] = [];
  readonly ingestPlantCalls: IngestPlantInput[] = [];
  readonly suggestBedPlanCalls: SuggestBedPlanInput[] = [];
  readonly assistProblemCalls: AssistProblemInput[] = [];

  constructor(private readonly options: TestAiAdapterOptions = {}) {}

  async ingestProduct(input: IngestProductInput): Promise<IngestProductResult> {
    await Promise.resolve();
    this.ingestProductCalls.push(input);

    if (this.options.failRequests === true) {
      throw new AiProviderError("Test AI product ingestion failed");
    }

    return {
      suggestions: DEFAULT_PRODUCT_SUGGESTIONS,
      warnings: ["Review label data before saving."]
    };
  }

  async ingestPlant(input: IngestPlantInput): Promise<IngestPlantResult> {
    await Promise.resolve();
    this.ingestPlantCalls.push(input);

    if (this.options.failRequests === true) {
      throw new AiProviderError("Test AI plant ingestion failed");
    }

    return {
      suggestions: DEFAULT_PLANT_SUGGESTIONS,
      warnings: ["Данните са тестови и не са потвърдени от реален източник."]
    };
  }

  async suggestBedPlan(input: SuggestBedPlanInput): Promise<SuggestBedPlanResult> {
    await Promise.resolve();
    this.suggestBedPlanCalls.push(input);

    if (this.options.failRequests === true) {
      throw new AiProviderError("Test AI bed planning failed");
    }

    return { suggestions: DEFAULT_BED_PLAN_SUGGESTIONS };
  }

  async assistProblem(input: AssistProblemInput): Promise<AssistProblemResult> {
    await Promise.resolve();
    this.assistProblemCalls.push(input);

    if (this.options.failRequests === true) {
      throw new AiProviderError("Test AI problem assist failed");
    }

    return { suggestions: DEFAULT_PROBLEM_SUGGESTIONS };
  }
}
