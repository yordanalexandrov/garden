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

export type ProblemPhotoSummary = {
  id: UUID;
  url: string;
  mimeType: string | null;
};

export type ProblemDetail = Omit<Problem, "accountId" | "createdAt" | "updatedAt"> & {
  targetLabel: string | null;
  photos: ProblemPhotoSummary[];
  linkedActivity: ProblemLinkedActivitySummary | null;
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

export type UpdateProblemInput = UpdateProblemRequest;

export type ListProblemsFilters = {
  placeId?: UUID;
  type?: ProblemType;
  status?: ProblemStatus;
  category?: ProblemCategory;
  from?: Date;
  to?: Date;
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

export type ProblemRow = Selectable<ProblemsTable>;

export interface ProblemsRepository {
  create(input: CreateProblemInput, db?: DbHandle): Promise<Problem>;
  list(accountId: UUID, filters: ListProblemsFilters, db?: DbHandle): Promise<PaginatedProblems>;
  getDetail(accountId: UUID, problemId: UUID, db?: DbHandle): Promise<ProblemDetail | null>;
  update(accountId: UUID, problemId: UUID, patch: UpdateProblemInput, db?: DbHandle): Promise<Problem | null>;
  findPlace(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<{ id: UUID } | null>;
  findTarget(accountId: UUID, targetType: TargetType, targetId: UUID, db?: DbHandle): Promise<ProblemTargetLookup | null>;
  findLinkedActivity(accountId: UUID, activityId: UUID, db?: DbHandle): Promise<LinkedActivityLookup | null>;
}
