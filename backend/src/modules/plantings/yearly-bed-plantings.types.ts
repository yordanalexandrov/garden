import type { Selectable } from "kysely";

import type { YearlyBedPlantingsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";

export const YEARLY_BED_PLANTING_STATUSES = ["planned", "planted", "removed", "harvested", "archived"] as const;

export type YearlyBedPlantingStatus = (typeof YEARLY_BED_PLANTING_STATUSES)[number];
export type YearlyBedPlantingRow = Selectable<YearlyBedPlantingsTable>;
export type YearlyBedPlantingWithPlantRow = YearlyBedPlantingRow & {
  common_name: string;
  variety: string | null;
};

export type YearlyBedPlanting = {
  id: UUID;
  accountId: UUID;
  bedId: UUID;
  plantId: UUID;
  year: number;
  quantity: number | null;
  notes: string | null;
  status: YearlyBedPlantingStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type YearlyBedPlantingWithPlant = YearlyBedPlanting & {
  plantName: string;
};

export type CreateYearlyBedPlantingInput = {
  accountId: UUID;
  bedId: UUID;
  plantId: UUID;
  year: number;
  quantity?: number | null;
  notes?: string | null;
  status: YearlyBedPlantingStatus;
};

export type UpdateYearlyBedPlantingInput = {
  plantId?: UUID;
  year?: number;
  quantity?: number | null;
  notes?: string | null;
  status?: YearlyBedPlantingStatus;
};

export type ListYearlyBedPlantingsFilters = {
  year?: number;
  status?: YearlyBedPlantingStatus;
  page: number;
  pageSize: number;
};

export type PaginatedYearlyBedPlantings = {
  items: YearlyBedPlantingWithPlant[];
  page: number;
  pageSize: number;
  total: number;
};

export type YearlyBedPlantingListItemDto = {
  id: UUID;
  bedId: UUID;
  plantId: UUID;
  plantName: string;
  year: number;
  quantity: number | null;
  notes: string | null;
  status: YearlyBedPlantingStatus;
};

export type YearlyBedPlantingDetailDto = YearlyBedPlantingListItemDto & {
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type YearlyBedPlantingMutationDto = {
  id: UUID;
};

export interface YearlyBedPlantingsRepository {
  listByBed(
    accountId: UUID,
    bedId: UUID,
    filters: ListYearlyBedPlantingsFilters,
    db?: DbHandle
  ): Promise<PaginatedYearlyBedPlantings>;
  listByBedAndYear(accountId: UUID, bedId: UUID, year: number, db?: DbHandle): Promise<YearlyBedPlanting[]>;
  findById(accountId: UUID, id: UUID, db?: DbHandle): Promise<YearlyBedPlantingWithPlant | null>;
  findManyByIds(accountId: UUID, ids: UUID[], db?: DbHandle): Promise<YearlyBedPlanting[]>;
  create(input: CreateYearlyBedPlantingInput, db?: DbHandle): Promise<YearlyBedPlanting>;
  update(
    accountId: UUID,
    id: UUID,
    patch: UpdateYearlyBedPlantingInput,
    db?: DbHandle
  ): Promise<YearlyBedPlanting | null>;
  archive(accountId: UUID, id: UUID, db?: DbHandle): Promise<boolean>;
}
