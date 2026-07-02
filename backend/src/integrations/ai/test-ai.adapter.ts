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
      followUpQuestions: [
        { text: "Кога за първи път забелязахте симптомите?", type: "free_text" },
        { text: "Влажни ли са петната при допир?", type: "yes_no" },
      ],
      recommendation: "Третирайте с фунгицид на база мед (напр. бордолезов разтвор) при сухо и безветровно време. Отстранете силно засегнатите листа и ги унищожете (не компостирайте). Повторете след 10–14 дни ако симптомите продължат.",
    },
  },
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
  readonly generateProductRulesCalls: GenerateProductRulesInput[] = [];

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

    // Mirror the real adapter's contract: a specific variety focuses the result
    // on a single suggestion, and follow-up questions are only asked on the
    // first pass (a refine request with answers returns no new questions).
    const plantSuggestions: NormalizedSuggestion[] =
      input.variety !== undefined
        ? [
            {
              type: "plant",
              payload: {
                commonName: input.plantName ?? "Домат",
                variety: input.variety,
                plantCategory: input.group ?? "Плодови зеленчуци",
                lifecycleType: "annual",
                growingStyle: "vegetable",
                notes: "Тестово предложение, фокусирано върху посочения сорт."
              }
            }
          ]
        : DEFAULT_PLANT_SUGGESTIONS;

    const hasFollowUpAnswers = input.followUpAnswers !== undefined && input.followUpAnswers.length > 0;
    const suggestions: NormalizedSuggestion[] = hasFollowUpAnswers
      ? plantSuggestions
      : [
          ...plantSuggestions,
          {
            type: "followup_questions",
            payload: {
              questions: [
                { text: "За оранжерия ли търсите сорта?", type: "yes_no" },
                { text: "Каква е основната употреба (салати, консерви, сушене)?", type: "free_text" },
              ]
            }
          }
        ];

    return {
      suggestions,
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

  async generateProductRules(input: GenerateProductRulesInput): Promise<GenerateProductRulesResult> {
    await Promise.resolve();
    this.generateProductRulesCalls.push(input);

    if (this.options.failRequests === true) {
      throw new AiProviderError("Test AI product rule generation failed");
    }

    const rulesByPlant = new Map(input.existingRules.map((rule) => [rule.plantId, rule]));

    const suggestions: NormalizedSuggestion[] = input.plants.map((plant) => {
      const existing = rulesByPlant.get(plant.plantId);

      if (existing !== undefined) {
        return {
          type: "product_rule",
          payload: {
            plantName: plant.commonName,
            plantId: plant.plantId,
            ruleId: existing.ruleId,
            operation: "update",
            doseValue: 12,
            doseUnit: "ml",
            dilutionText: "12 ml / 10 l вода",
            applicationMethod: null,
            reapplicationIntervalDays: 7,
            quarantinePeriodDays: 14,
            notes: "Обновени стойности по препоръка на ИИ."
          }
        };
      }

      return {
        type: "product_rule",
        payload: {
          plantName: plant.commonName,
          plantId: plant.plantId,
          operation: "create",
          doseValue: 10,
          doseUnit: "ml",
          dilutionText: "10 ml / 10 l вода",
          applicationMethod: null,
          reapplicationIntervalDays: 10,
          quarantinePeriodDays: 14,
          notes: "Предложено правило за пръскане."
        }
      };
    });

    return {
      suggestions,
      warnings: ["Данните са тестови и трябва да се потвърдят преди запис."]
    };
  }
}
