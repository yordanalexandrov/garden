import { ApiListData } from '../../core/api/api.types';
import { PagedFilter } from '../garden-structure-api.types';

export const PROBLEM_TYPES = ['problem', 'observation'] as const;
export const PROBLEM_STATUSES = ['open', 'monitoring', 'resolved'] as const;
export const PROBLEM_CATEGORIES = [
  'insect',
  'fungus',
  'bacteria',
  'nutrient_deficiency',
  'watering_issue',
  'weather_damage',
  'growth_issue',
  'unknown',
  'other',
] as const;
export const PROBLEM_TARGET_TYPES = [
  'place',
  'perennial',
  'bed',
  'yearly_bed_planting',
  'persistent_bed_plant',
] as const;

export type ProblemType = (typeof PROBLEM_TYPES)[number];
export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];
export type ProblemCategory = (typeof PROBLEM_CATEGORIES)[number];
export type ProblemTargetType = (typeof PROBLEM_TARGET_TYPES)[number];

export interface ProblemListItem {
  readonly id: string;
  readonly type: ProblemType;
  readonly placeId: string;
  readonly targetType: ProblemTargetType;
  readonly targetId: string;
  readonly targetLabel: string | null;
  readonly title: string;
  readonly category: ProblemCategory | null;
  readonly severity: string | null;
  readonly status: ProblemStatus;
  readonly observedAt: string;
  readonly resolvedAt: string | null;
  readonly photosCount: number;
}

export interface ProblemPhoto {
  readonly id: string;
  readonly url: string;
  readonly mimeType: string | null;
  readonly originalFilename: string | null;
  readonly fileSizeBytes: number | null;
}

export interface ProblemLinkedActivity {
  readonly id: string;
  readonly type: string;
  readonly performedAt: string;
}

export interface ProblemObservation {
  readonly id: string;
  readonly problemId: string;
  readonly summary: string;
  readonly recommendation: string | null;
  readonly source: 'user' | 'ai';
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateObservationRequest {
  readonly summary: string;
  readonly recommendation?: string | null;
}

export interface UpdateObservationRequest {
  readonly summary?: string;
  readonly recommendation?: string | null;
}

export interface ProblemDetail {
  readonly id: string;
  readonly type: ProblemType;
  readonly placeId: string;
  readonly targetType: ProblemTargetType;
  readonly targetId: string;
  readonly targetLabel: string | null;
  readonly title: string;
  readonly description: string;
  readonly category: ProblemCategory | null;
  readonly severity: string | null;
  readonly status: ProblemStatus;
  readonly observedAt: string;
  readonly resolvedAt: string | null;
  readonly photos: readonly ProblemPhoto[];
  readonly observations: readonly ProblemObservation[];
  readonly linkedActivity: ProblemLinkedActivity | null;
}

export interface CreateProblemRequest {
  readonly type: ProblemType;
  readonly placeId: string;
  readonly targetType: ProblemTargetType;
  readonly targetId: string;
  readonly title: string;
  readonly description: string;
  readonly category?: ProblemCategory | null;
  readonly severity?: string | null;
  readonly status: ProblemStatus;
  readonly observedAt: string;
  readonly linkedActivityId?: string | null;
}

export interface UpdateProblemRequest {
  readonly title?: string;
  readonly description?: string;
  readonly category?: ProblemCategory | null;
  readonly severity?: string | null;
  readonly status?: ProblemStatus;
  readonly observedAt?: string;
  readonly linkedActivityId?: string | null;
}

export interface ProblemMutationResult {
  readonly id: string;
}

export interface ProblemPhotoMutationResult {
  readonly id: string;
  readonly storageKey: string;
}

export interface ListProblemsFilters extends PagedFilter {
  readonly placeId?: string;
  readonly type?: ProblemType;
  readonly status?: ProblemStatus;
  readonly category?: ProblemCategory;
  readonly from?: string;
  readonly to?: string;
}

export type ProblemsPage = ApiListData<ProblemListItem>;
