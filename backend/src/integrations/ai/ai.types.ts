export type IngestProductInput = {
  productName?: string;
  labelText?: string;
};

export type NormalizedProductPayload = {
  name: string;
  category: string;
  activeSubstance?: string | null;
  manufacturer?: string | null;
  formulation?: string | null;
  defaultUnit: string;
  notes?: string | null;
};

export type NormalizedProductRulePayload = {
  plantName?: string;
  doseValue: number;
  doseUnit: string;
  dilutionText?: string | null;
  reapplicationIntervalDays?: number | null;
  quarantinePeriodDays?: number | null;
};

export type NormalizedBedPlanPayload = {
  spacingSuggestions: unknown[];
  coexistenceNotes: unknown[];
  warnings: unknown[];
  roughQuantityGuidance: unknown[];
};

export type NormalizedProblemSummaryPayload = {
  summary: string;
  possibleCategories: string[];
  followUpQuestions: unknown[];
};

export type NormalizedFollowupQuestionsPayload = {
  questions: string[];
};

export type NormalizedPlantPayload = {
  commonName: string;
  variety: string | null;
  plantCategory: string | null;
  lifecycleType: string;
  growingStyle: string;
  notes: string | null;
};

export type NormalizedSuggestion =
  | { type: "product"; payload: NormalizedProductPayload }
  | { type: "product_rule"; payload: NormalizedProductRulePayload }
  | { type: "bed_plan"; payload: NormalizedBedPlanPayload }
  | { type: "problem_summary"; payload: NormalizedProblemSummaryPayload }
  | { type: "followup_questions"; payload: NormalizedFollowupQuestionsPayload }
  | { type: "plant"; payload: NormalizedPlantPayload };

export type IngestProductResult = {
  suggestions: NormalizedSuggestion[];
  warnings?: string[];
};

export type IngestPlantInput = {
  plantName: string;
  notes?: string;
};

export type IngestPlantResult = {
  suggestions: NormalizedSuggestion[];
  warnings?: string[];
};

export type SuggestBedPlanInput = {
  bedId: string;
  year: number;
  candidatePlantIds: string[];
  notes?: string;
};

export type SuggestBedPlanResult = {
  suggestions: NormalizedSuggestion[];
};

export type AssistProblemInput = {
  problemId?: string;
  text?: string;
};

export type AssistProblemResult = {
  suggestions: NormalizedSuggestion[];
};
