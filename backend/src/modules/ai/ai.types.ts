import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";

export const AI_SESSION_KINDS = ["product_ingestion", "bed_planning", "problem_assist", "plant_ingestion", "product_rule_generation"] as const;
export const AI_SESSION_INPUT_MODES = ["name", "text", "image", "mixed"] as const;
export const AI_SESSION_STATUSES = ["pending", "completed", "failed", "dismissed", "accepted"] as const;
export const AI_SUGGESTION_TYPES = ["product", "product_rule", "bed_plan", "problem_summary", "followup_questions", "plant"] as const;

export type AiSessionKind = (typeof AI_SESSION_KINDS)[number];
export type AiSessionInputMode = (typeof AI_SESSION_INPUT_MODES)[number];
export type AiSessionStatus = (typeof AI_SESSION_STATUSES)[number];
export type AiSuggestionType = (typeof AI_SUGGESTION_TYPES)[number];

export type AiSession = {
  id: UUID;
  accountId: UUID;
  kind: AiSessionKind;
  inputMode: AiSessionInputMode;
  status: AiSessionStatus;
  rawInputText: string | null;
  relatedEntityType: string | null;
  relatedEntityId: UUID | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AiSuggestion = {
  id: UUID;
  aiSessionId: UUID;
  suggestionType: AiSuggestionType;
  payload: unknown;
  accepted: boolean | null;
  acceptedAt: Date | null;
  createdAt: Date;
};

export type CreateAiSessionInput = {
  accountId: UUID;
  kind: AiSessionKind;
  inputMode: AiSessionInputMode;
  status: AiSessionStatus;
  rawInputText?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: UUID | null;
};

export type UpdateAiSessionStatusInput = {
  status: AiSessionStatus;
};

export type AddAiSuggestionInput = {
  suggestionType: AiSuggestionType;
  payload: unknown;
};

export interface AiRepository {
  createSession(input: CreateAiSessionInput, db?: DbHandle): Promise<AiSession>;
  updateSessionStatus(sessionId: UUID, status: AiSessionStatus, db?: DbHandle): Promise<AiSession | null>;
  addSuggestions(sessionId: UUID, suggestions: AddAiSuggestionInput[], db?: DbHandle): Promise<AiSuggestion[]>;
  findSuggestionById(accountId: UUID, suggestionId: UUID, db?: DbHandle): Promise<AiSuggestion | null>;
  findSessionById(accountId: UUID, sessionId: UUID, db?: DbHandle): Promise<AiSession | null>;
  listSessionSuggestions(accountId: UUID, sessionId: UUID, db?: DbHandle): Promise<AiSuggestion[]>;
  markAccepted(suggestionId: UUID, db?: DbHandle): Promise<AiSuggestion | null>;
  markRejected(suggestionId: UUID, db?: DbHandle): Promise<AiSuggestion | null>;
}

export type AcceptSuggestionResult = {
  acceptedSuggestionId: UUID;
  createdEntities: Array<{ entityType: string; entityId: UUID }>;
  updatedEntities: Array<{ entityType: string; entityId: UUID }>;
};
