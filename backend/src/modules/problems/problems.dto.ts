import type { Problem, ProblemDetail, ProblemListItem, ProblemObservation, UploadProblemPhotoResult } from "./problems.types.js";

export function toProblemListItemDto(item: ProblemListItem): ProblemListItemDto {
  return {
    id: item.id,
    type: item.type,
    placeId: item.placeId,
    targetType: item.targetType,
    targetId: item.targetId,
    targetLabel: item.targetLabel,
    title: item.title,
    category: item.category,
    severity: item.severity,
    status: item.status,
    observedAt: item.observedAt.toISOString(),
    resolvedAt: item.resolvedAt ? item.resolvedAt.toISOString() : null,
    photosCount: item.photosCount
  };
}

export function toProblemDetailDto(problem: ProblemDetail): ProblemDetailDto {
  return {
    id: problem.id,
    type: problem.type,
    placeId: problem.placeId,
    targetType: problem.targetType,
    targetId: problem.targetId,
    targetLabel: problem.targetLabel,
    title: problem.title,
    description: problem.description,
    category: problem.category,
    severity: problem.severity,
    status: problem.status,
    observedAt: problem.observedAt.toISOString(),
    resolvedAt: problem.resolvedAt ? problem.resolvedAt.toISOString() : null,
    photos: problem.photos,
    observations: problem.observations.map(toObservationDto),
    linkedActivity:
      problem.linkedActivity === null
        ? null
        : {
            id: problem.linkedActivity.id,
            type: problem.linkedActivity.type,
            performedAt: problem.linkedActivity.performedAt.toISOString()
          }
  };
}

export function toProblemMutationDto(problem: Problem): ProblemMutationDto {
  return { id: problem.id };
}

function toObservationDto(obs: ProblemObservation): ObservationDto {
  return {
    id: obs.id,
    problemId: obs.problemId,
    summary: obs.summary,
    recommendation: obs.recommendation,
    source: obs.source,
    createdAt: obs.createdAt.toISOString(),
    updatedAt: obs.updatedAt.toISOString()
  };
}

export function toProblemPhotoMutationDto(photo: UploadProblemPhotoResult): ProblemPhotoMutationDto {
  return { id: photo.id, storageKey: photo.storageKey };
}

type ObservationDto = {
  id: string;
  problemId: string;
  summary: string;
  recommendation: string | null;
  source: 'user' | 'ai';
  createdAt: string;
  updatedAt: string;
};

type ProblemListItemDto = Omit<ProblemListItem, "observedAt" | "resolvedAt"> & {
  observedAt: string;
  resolvedAt: string | null;
};

type ProblemDetailDto = Omit<ProblemDetail, "observedAt" | "resolvedAt" | "linkedActivity" | "linkedActivityId" | "observations"> & {
  observedAt: string;
  resolvedAt: string | null;
  linkedActivity: { id: string; type: string; performedAt: string } | null;
  observations: ObservationDto[];
};

type ProblemMutationDto = {
  id: string;
};

type ProblemPhotoMutationDto = {
  id: string;
  storageKey: string;
};
