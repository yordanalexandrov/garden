export const AI_SUGGESTION_STATUSES = [
  'unaccepted',
  'accepting',
  'accepted',
  'rejecting',
  'rejected',
  'error',
] as const;

export type AiSuggestionStatus = (typeof AI_SUGGESTION_STATUSES)[number];

export interface AiSessionDto {
  readonly id: string;
  readonly kind: string;
  readonly inputMode: string;
  readonly status: string;
}

export interface AiSuggestionDto {
  readonly id: string;
  readonly suggestionType: string;
  readonly payload: unknown;
}

export interface AiGenerationResult {
  readonly aiSession: AiSessionDto;
  readonly suggestions: readonly AiSuggestionDto[];
  readonly warnings?: readonly string[];
}

export interface AiEntityRef {
  readonly entityType: string;
  readonly entityId: string;
}

export interface AcceptSuggestionResult {
  readonly acceptedSuggestionId: string;
  readonly createdEntities: readonly AiEntityRef[];
  readonly updatedEntities: readonly AiEntityRef[];
}

export interface RejectSuggestionResult {
  readonly rejected: true;
}

export interface ProductIngestionRequest {
  readonly productName?: string;
  readonly labelText?: string;
}

export interface BedPlanningRequest {
  readonly bedId: string;
  readonly year: number;
  readonly candidatePlantIds: readonly string[];
  readonly notes?: string;
}

export interface ProblemAssistRequest {
  readonly problemId?: string;
  readonly text?: string;
  readonly followUpAnswers?: readonly FollowUpAnswer[];
}

export interface FollowUpQuestion {
  readonly text: string;
  readonly type: 'yes_no' | 'free_text';
}

export interface FollowUpAnswer {
  readonly question: string;
  readonly answer: string;
}

export interface PlantIngestionRequest {
  readonly plantName?: string;
  readonly group?: string;
  readonly variety?: string;
  readonly notes?: string;
  /** Base64 data URL; ephemeral AI input, never persisted by the backend. */
  readonly photoDataUrl?: string;
  readonly followUpAnswers?: readonly FollowUpAnswer[];
}

export interface FollowupQuestionsPayload {
  readonly questions?: readonly FollowUpQuestion[];
}

export interface ProductRuleGenerationRequest {
  readonly productId: string;
}

export interface PlantSuggestionPayload {
  readonly commonName?: string;
  readonly variety?: string | null;
  readonly plantCategory?: string | null;
  readonly lifecycleType?: string;
  readonly growingStyle?: string;
  readonly notes?: string | null;
}

export interface AcceptSuggestionRequest {
  readonly editedPayload?: unknown;
  readonly problemId?: string;
  readonly acceptedCategory?: string;
}

export interface ProductSuggestionPayload {
  readonly name?: string;
  readonly category?: string;
  readonly activeSubstance?: string;
  readonly manufacturer?: string;
  readonly formulation?: string;
  readonly defaultUnit?: string;
  readonly notes?: string;
}

export interface ProductRuleSuggestionPayload {
  readonly plantName?: string;
  readonly plantId?: string;
  readonly productId?: string;
  readonly ruleId?: string;
  readonly operation?: 'create' | 'update';
  readonly doseValue?: number | null;
  readonly doseUnit?: string;
  readonly dilutionText?: string;
  readonly applicationMethod?: string | null;
  readonly reapplicationIntervalDays?: number | null;
  readonly quarantinePeriodDays?: number | null;
  readonly notes?: string | null;
}

export interface SpacingSuggestion {
  readonly plantName: string;
  readonly spacingCm?: number | null;
  readonly notes?: string | null;
}

export interface CoexistenceNote {
  readonly plants: readonly string[];
  readonly note: string;
}

export interface RoughQuantityGuidance {
  readonly plantName: string;
  readonly estimatedCount?: number | null;
  readonly notes?: string | null;
}

export interface BedPlanSuggestionPayload {
  readonly spacingSuggestions: readonly SpacingSuggestion[];
  readonly coexistenceNotes: readonly CoexistenceNote[];
  readonly warnings: readonly string[];
  readonly roughQuantityGuidance: readonly RoughQuantityGuidance[];
}

export interface ProblemSummarySuggestionPayload {
  readonly summary?: string;
  readonly possibleCategories?: readonly string[];
  readonly followUpQuestions?: readonly FollowUpQuestion[];
  readonly recommendation?: string;
}

export interface AiSuggestionUiState {
  readonly suggestion: AiSuggestionDto;
  status: AiSuggestionStatus;
  error: unknown | null;
  acceptResult: AcceptSuggestionResult | null;
  editedPayload: unknown | null;
}
