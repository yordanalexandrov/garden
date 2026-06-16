import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../../core/api/api-client';
import {
  AcceptSuggestionRequest,
  AcceptSuggestionResult,
  AiGenerationResult,
  BedPlanningRequest,
  PlantIngestionRequest,
  ProblemAssistRequest,
  ProductIngestionRequest,
  ProductRuleGenerationRequest,
  RejectSuggestionResult,
} from '../ai.models';

@Injectable({ providedIn: 'root' })
export class AiApiService {
  private readonly api = inject(ApiClient);

  productIngestion(request: ProductIngestionRequest): Observable<AiGenerationResult> {
    return this.api.post<AiGenerationResult>('/ai/product-ingestion', request);
  }

  plantIngestion(request: PlantIngestionRequest): Observable<AiGenerationResult> {
    return this.api.post<AiGenerationResult>('/ai/plant-ingestion', request);
  }

  productRuleGeneration(request: ProductRuleGenerationRequest): Observable<AiGenerationResult> {
    return this.api.post<AiGenerationResult>('/ai/product-rule-generation', request);
  }

  bedPlanning(request: BedPlanningRequest): Observable<AiGenerationResult> {
    return this.api.post<AiGenerationResult>('/ai/bed-planning', request);
  }

  problemAssist(request: ProblemAssistRequest): Observable<AiGenerationResult> {
    return this.api.post<AiGenerationResult>('/ai/problem-assist', request);
  }

  acceptSuggestion(
    suggestionId: string,
    request: AcceptSuggestionRequest = {},
  ): Observable<AcceptSuggestionResult> {
    return this.api.post<AcceptSuggestionResult>(
      `/ai/suggestions/${encodeURIComponent(suggestionId)}/accept`,
      request,
    );
  }

  rejectSuggestion(suggestionId: string): Observable<RejectSuggestionResult> {
    return this.api.post<RejectSuggestionResult>(
      `/ai/suggestions/${encodeURIComponent(suggestionId)}/reject`,
      {},
    );
  }
}
