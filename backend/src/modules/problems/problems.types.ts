import type { Selectable } from "kysely";

import type { ProblemsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type { TargetType } from "../targets/target-resolver.types.js";

export const PROBLEM_TYPES = ["problem", "observation"] as const;
export const PROBLEM_STATUSES = ["open", "monitoring", "resolved"] as const;
export const PROBLEM_CATEGORIES = [
  "insect",
  "fungus",
  "bacteria",
  "nutrient_deficiency",
  "watering_issue",
  "weather_damage",
  "growth_issue",
  "unknown",
  "other"
] as const;

export type ProblemType = (typeof PROBLEM_TYPES)[number];
export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];
export type ProblemCategory = (typeof PROBLEM_CATEGORIES)[number];

export type Problem = {
  id: UUID;
  accountId: UUID;
  type: ProblemType;
  placeId: UUID;
  targetType: TargetType;
  targetId: UUID;
  title: string;
  description: string;
  category: ProblemCategory | null;
  severity: string | null;
  status: ProblemStatus;
  observedAt: Date;
  resolvedAt: Date | null;
  archivedAt: Date | null;
  linkedActivityId: UUID | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProblemListItem = Omit<Problem, "accountId" | "description" | "linkedActivityId" | "createdAt" | "updatedAt"> & {
  targetLabel: string | null;
  photosCount: number;
};

export type ProblemLinkedActivitySummary = {
  id: UUID;
  type: string;
  performedAt: Date;
};

export type ProblemPhotoMetadata = {
  id: UUID;
  storageKey: string;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  widthPx: number | null;
  heightPx: number | null;
  createdAt: Date;
};

export type ProblemPhotoSummary = {
  id: UUID;
  url: string;
  mimeType: string | null;
  originalFilename: string | null;
  fileSizeBytes: number | null;
};

export type ProblemObservation = {
  id: UUID;
  problemId: UUID;
  summary: string;
  recommendation: string | null;
  source: 'user' | 'ai';
  createdAt: Date;
  updatedAt: Date;
};

export type CreateObservationInput = {
  problemId: UUID;
  summary: string;
  recommendation?: string | null;
  source: 'user' | 'ai';
};

export type UpdateObservationInput = {
  summary?: string;
  recommendation?: string | null;
};

export type ProblemDetailRecord = Omit<Problem, "accountId" | "createdAt" | "updatedAt"> & {
  targetLabel: string | null;
  photos: ProblemPhotoMetadata[];
  linkedActivity: ProblemLinkedActivitySummary | null;
  observations: ProblemObservation[];
};

export type ProblemDetail = Omit<ProblemDetailRecord, "photos"> & {
  photos: ProblemPhotoSummary[];
};

export type CreateProblemRequest = {
  type: ProblemType;
  placeId: UUID;
  targetType: TargetType;
  targetId: UUID;
  title: string;
  description: string;
  category?: ProblemCategory | null;
  severity?: string | null;
  status: ProblemStatus;
  observedAt: Date;
  linkedActivityId?: UUID | null;
};

export type CreateProblemInput = CreateProblemRequest & {
  accountId: UUID;
};

export type UpdateProblemRequest = {
  title?: string;
  description?: string;
  category?: ProblemCategory | null;
  severity?: string | null;
  status?: ProblemStatus;
  observedAt?: Date;
  linkedActivityId?: UUID | null;
};

export type UpdateProblemInput = UpdateProblemRequest & {
  resolvedAt?: Date | null;
};

export type ListProblemsFilters = {
  placeId?: UUID;
  type?: ProblemType;
  status?: ProblemStatus;
  category?: ProblemCategory;
  from?: Date;
  to?: Date;
  includeArchived?: boolean;
  page: number;
  pageSize: number;
};

export type PaginatedProblems = {
  items: ProblemListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type ProblemTargetLookup = {
  targetType: TargetType;
  targetId: UUID;
  label: string | null;
  placeId: UUID;
};

export type LinkedActivityLookup = {
  id: UUID;
  accountId: UUID;
  placeId: UUID | null;
  type: string;
  performedAt: Date;
};

export type CreateProblemPhotoMetadataInput = {
  id: UUID;
  problemId: UUID;
  storageKey: string;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  widthPx: number | null;
  heightPx: number | null;
};

export type ProblemForPhotoUpload = {
  id: UUID;
  accountId: UUID;
  type: ProblemType;
  placeId: UUID;
};

export type UploadProblemPhotoRequest = {
  originalFilename: string | null;
  mimeType: string;
  fileSizeBytes: number;
  body: Buffer;
};

export type UploadProblemPhotoResult = {
  id: UUID;
  storageKey: string;
};

export type ProblemRow = Selectable<ProblemsTable>;

export interface ProblemsRepository {
  create(input: CreateProblemInput, db?: DbHandle): Promise<Problem>;
  list(accountId: UUID, filters: ListProblemsFilters, db?: DbHandle): Promise<PaginatedProblems>;
  getDetail(accountId: UUID, problemId: UUID, db?: DbHandle): Promise<ProblemDetailRecord | null>;
  findStatus(accountId: UUID, problemId: UUID, db?: DbHandle): Promise<{ status: ProblemStatus } | null>;
  update(accountId: UUID, problemId: UUID, patch: UpdateProblemInput, db?: DbHandle): Promise<Problem | null>;
  findPlace(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<{ id: UUID } | null>;
  findTarget(accountId: UUID, targetType: TargetType, targetId: UUID, db?: DbHandle): Promise<ProblemTargetLookup | null>;
  findLinkedActivity(accountId: UUID, activityId: UUID, db?: DbHandle): Promise<LinkedActivityLookup | null>;
  findProblemForPhotoUpload(accountId: UUID, problemId: UUID, db?: DbHandle): Promise<ProblemForPhotoUpload | null>;
  createPhotoMetadata(input: CreateProblemPhotoMetadataInput, db?: DbHandle): Promise<ProblemPhotoMetadata>;
  createObservation(input: CreateObservationInput, db?: DbHandle): Promise<ProblemObservation>;
  listObservations(problemId: UUID, db?: DbHandle): Promise<ProblemObservation[]>;
  updateObservation(problemId: UUID, obsId: UUID, patch: UpdateObservationInput, db?: DbHandle): Promise<ProblemObservation | null>;
  archiveObservation(problemId: UUID, obsId: UUID, db?: DbHandle): Promise<boolean>;
  archive(accountId: UUID, problemId: UUID, db?: DbHandle): Promise<boolean>;
}
