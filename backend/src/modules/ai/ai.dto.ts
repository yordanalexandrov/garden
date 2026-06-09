import type { AcceptSuggestionResult, AiSession, AiSuggestion } from "./ai.types.js";

type AiSessionDto = {
  id: string;
  kind: string;
  inputMode: string;
  status: string;
};

type AiSuggestionDto = {
  id: string;
  suggestionType: string;
  payload: unknown;
};

type GenerationResponseDto = {
  aiSession: AiSessionDto;
  suggestions: AiSuggestionDto[];
  warnings?: string[];
};

type AcceptResponseDto = {
  acceptedSuggestionId: string;
  createdEntities: Array<{ entityType: string; entityId: string }>;
  updatedEntities: Array<{ entityType: string; entityId: string }>;
};

type RejectResponseDto = {
  rejected: true;
};

export function toAiSessionDto(session: AiSession): AiSessionDto {
  return {
    id: session.id,
    kind: session.kind,
    inputMode: session.inputMode,
    status: session.status
  };
}

export function toAiSuggestionDto(suggestion: AiSuggestion): AiSuggestionDto {
  return {
    id: suggestion.id,
    suggestionType: suggestion.suggestionType,
    payload: suggestion.payload
  };
}

export function toGenerationResponseDto(
  session: AiSession,
  suggestions: AiSuggestion[],
  warnings?: string[]
): GenerationResponseDto {
  const dto: GenerationResponseDto = {
    aiSession: toAiSessionDto(session),
    suggestions: suggestions.map(toAiSuggestionDto)
  };

  if (warnings !== undefined && warnings.length > 0) {
    dto.warnings = warnings;
  }

  return dto;
}

export function toAcceptResponseDto(result: AcceptSuggestionResult): AcceptResponseDto {
  return {
    acceptedSuggestionId: result.acceptedSuggestionId,
    createdEntities: result.createdEntities,
    updatedEntities: result.updatedEntities
  };
}

export function toRejectResponseDto(): RejectResponseDto {
  return { rejected: true };
}
