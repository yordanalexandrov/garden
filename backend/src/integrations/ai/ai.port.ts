import type {
  AssistProblemInput,
  AssistProblemResult,
  GenerateProductRulesInput,
  GenerateProductRulesResult,
  IngestPlantInput,
  IngestPlantResult,
  IngestProductInput,
  IngestProductResult,
  SuggestBedPlanInput,
  SuggestBedPlanResult,
} from "./ai.types.js";

export interface AiPort {
  ingestProduct(input: IngestProductInput): Promise<IngestProductResult>;
  ingestPlant(input: IngestPlantInput): Promise<IngestPlantResult>;
  suggestBedPlan(input: SuggestBedPlanInput): Promise<SuggestBedPlanResult>;
  assistProblem(input: AssistProblemInput): Promise<AssistProblemResult>;
  generateProductRules(input: GenerateProductRulesInput): Promise<GenerateProductRulesResult>;
}

export class AiProviderError extends Error {
  constructor(message = "AI provider failed") {
    super(message);
    this.name = "AiProviderError";
  }
}

export function isAiProviderError(error: unknown): error is AiProviderError {
  return error instanceof AiProviderError;
}
