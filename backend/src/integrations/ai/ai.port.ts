import type { AssistProblemInput, AssistProblemResult, IngestProductInput, IngestProductResult, SuggestBedPlanInput, SuggestBedPlanResult } from "./ai.types.js";

export interface AiPort {
  ingestProduct(input: IngestProductInput): Promise<IngestProductResult>;
  suggestBedPlan(input: SuggestBedPlanInput): Promise<SuggestBedPlanResult>;
  assistProblem(input: AssistProblemInput): Promise<AssistProblemResult>;
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
