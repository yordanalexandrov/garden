import type { Selectable } from "kysely";

import type { PerennialsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";

export const PERENNIAL_STATUSES = ["active", "removed", "dead", "archived"] as const;

export type PerennialStatus = (typeof PERENNIAL_STATUSES)[number];
export type PerennialRow = Selectable<PerennialsTable>;
export type PerennialWithPlantRow = PerennialRow & {
  common_name: string;
  variety: string | null;
};

export type Perennial = {
  id: UUID;
  accountId: UUID;
  placeId: UUID;
  plantId: UUID;
  label: string | null;
  plantedYear: number | null;
  notes: string | null;
  status: PerennialStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type PerennialWithPlant = Perennial & {
  plantName: string;
};

export type CreatePerennialInput = {
  accountId: UUID;
  placeId: UUID;
  plantId: UUID;
  label?: string | null;
  plantedYear?: number | null;
  notes?: string | null;
};

export type UpdatePerennialInput = {
  plantId?: UUID;
  label?: string | null;
  plantedYear?: number | null;
  notes?: string | null;
  status?: PerennialStatus;
};

export type ListPerennialsFilters = {
  q?: string;
  status?: PerennialStatus;
  page: number;
  pageSize: number;
};

export type PaginatedPerennials = {
  items: PerennialWithPlant[];
  page: number;
  pageSize: number;
  total: number;
};

export type PerennialListItemDto = {
  id: UUID;
  placeId: UUID;
  plantId: UUID;
  plantName: string;
  label: string | null;
  plantedYear: number | null;
  status: PerennialStatus;
  notes: string | null;
};

export type PerennialDetailDto = PerennialListItemDto & {
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type PerennialMutationDto = {
  id: UUID;
};

export interface PerennialsRepository {
  listByPlace(accountId: UUID, placeId: UUID, filters: ListPerennialsFilters, db?: DbHandle): Promise<PaginatedPerennials>;
  findById(accountId: UUID, perennialId: UUID, db?: DbHandle): Promise<PerennialWithPlant | null>;
  findManyByIds(accountId: UUID, ids: UUID[], db?: DbHandle): Promise<Perennial[]>;
  listActiveByPlace(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<Perennial[]>;
  create(input: CreatePerennialInput, db?: DbHandle): Promise<Perennial>;
  update(accountId: UUID, perennialId: UUID, patch: UpdatePerennialInput, db?: DbHandle): Promise<Perennial | null>;
  archive(accountId: UUID, perennialId: UUID, db?: DbHandle): Promise<boolean>;
}
