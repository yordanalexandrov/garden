import type { Problem, ProblemDetail, ProblemListItem, UploadProblemPhotoResult } from "./problems.types.js";

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
    photos: problem.photos,
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

export function toProblemPhotoMutationDto(photo: UploadProblemPhotoResult): ProblemPhotoMutationDto {
  return { id: photo.id, storageKey: photo.storageKey };
}

type ProblemListItemDto = Omit<ProblemListItem, "observedAt"> & {
  observedAt: string;
};

type ProblemDetailDto = Omit<ProblemDetail, "observedAt" | "linkedActivity" | "linkedActivityId"> & {
  observedAt: string;
  linkedActivity: { id: string; type: string; performedAt: string } | null;
};

type ProblemMutationDto = {
  id: string;
};

type ProblemPhotoMutationDto = {
  id: string;
  storageKey: string;
};
