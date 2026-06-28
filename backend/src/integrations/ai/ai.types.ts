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

export type ProductRuleOperation = "create" | "update";

export type NormalizedProductRulePayload = {
  plantName?: string;
  /** Resolved plant id, present when the rule targets a known account plant. */
  plantId?: string;
  /** Existing rule id, present only when operation is "update" (refresh). */
  ruleId?: string;
  operation?: ProductRuleOperation;
  doseValue: number;
  doseUnit: string;
  dilutionText?: string | null;
  applicationMethod?: string | null;
  reapplicationIntervalDays?: number | null;
  quarantinePeriodDays?: number | null;
  notes?: string | null;
};

export type NormalizedBedPlanPayload = {
  spacingSuggestions: unknown[];
  coexistenceNotes: unknown[];
  warnings: unknown[];
  roughQuantityGuidance: unknown[];
};

export type FollowUpQuestion = {
  text: string;
  type: "yes_no" | "free_text";
};

export type FollowUpAnswer = {
  question: string;
  answer: string;
};

export type NormalizedProblemSummaryPayload = {
  summary: string;
  possibleCategories: string[];
  followUpQuestions: FollowUpQuestion[];
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

export type ProblemContextInput = {
  title: string;
  description: string;
  targetLabel: string | null;
  category: string | null;
  severity: string | null;
  observedAt: string;
  photosCount: number;
};

export type AssistProblemInput = {
  problemId?: string;
  text?: string;
  problemContext?: ProblemContextInput;
  photoUrls?: string[];
  followUpAnswers?: FollowUpAnswer[];
};

export type AssistProblemResult = {
  suggestions: NormalizedSuggestion[];
};

export type GenerateProductRulesProductContext = {
  id: string;
  name: string;
  category: string;
  activeSubstance?: string | null;
  manufacturer?: string | null;
  formulation?: string | null;
  defaultUnit: string;
  notes?: string | null;
};

export type GenerateProductRulesExistingRule = {
  ruleId: string;
  plantId: string;
  plantName: string;
  doseValue: number;
  doseUnit: string;
  dilutionText?: string | null;
  applicationMethod?: string | null;
  reapplicationIntervalDays?: number | null;
  quarantinePeriodDays?: number | null;
};

export type GenerateProductRulesPlant = {
  plantId: string;
  commonName: string;
  variety?: string | null;
  plantCategory?: string | null;
};

export type GenerateProductRulesInput = {
  product: GenerateProductRulesProductContext;
  existingRules: GenerateProductRulesExistingRule[];
  plants: GenerateProductRulesPlant[];
};

export type GenerateProductRulesResult = {
  suggestions: NormalizedSuggestion[];
  warnings?: string[];
};
