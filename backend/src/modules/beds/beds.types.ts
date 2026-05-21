import type { Selectable } from "kysely";

import type { BedCurrentContentsView, BedsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";

export const BED_STATUSES = ["active", "removed", "archived"] as const;
export const BED_CURRENT_CONTENT_SOURCE_TYPES = ["persistent_bed_plant", "yearly_bed_planting"] as const;

export type BedStatus = (typeof BED_STATUSES)[number];
export type BedCurrentContentSourceType = (typeof BED_CURRENT_CONTENT_SOURCE_TYPES)[number];
export type BedRow = Selectable<BedsTable>;
export type BedCurrentContentsRow = Selectable<BedCurrentContentsView>;

export type Bed = {
  id: UUID;
  accountId: UUID;
  placeId: UUID;
  name: string;
  description: string | null;
  notes: string | null;
  widthM: number | null;
  lengthM: number | null;
  areaM2: number | null;
  status: BedStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type BedCurrentPersistentPlant = {
  id: UUID;
  plantName: string;
  quantity: number | null;
};

export type BedCurrentYearlyPlanting = {
  id: UUID;
  plantName: string;
  year: number;
  quantity: number | null;
  status: string;
};

export type BedCurrentContents = {
  persistentPlants: BedCurrentPersistentPlant[];
  yearlyPlantings: BedCurrentYearlyPlanting[];
};

export type BedWithCurrentContents = Bed & {
  currentContents: BedCurrentContents;
};

export type CreateBedInput = {
  accountId: UUID;
  placeId: UUID;
  name: string;
  description?: string | null;
  notes?: string | null;
  widthM?: number | null;
  lengthM?: number | null;
  areaM2?: number | null;
};

export type UpdateBedInput = {
  name?: string;
  description?: string | null;
  notes?: string | null;
  widthM?: number | null;
  lengthM?: number | null;
  areaM2?: number | null;
  status?: BedStatus;
};

export type ListBedsFilters = {
  q?: string;
  status?: BedStatus;
  year?: number;
  page: number;
  pageSize: number;
};

export type PaginatedBeds = {
  items: BedWithCurrentContents[];
  page: number;
  pageSize: number;
  total: number;
};

export type BedCurrentContentsDto = {
  persistentPlants: BedCurrentPersistentPlant[];
  yearlyPlantings: BedCurrentYearlyPlanting[];
};

export type BedListItemDto = {
  id: UUID;
  placeId: UUID;
  name: string;
  description: string | null;
  widthM: number | null;
  lengthM: number | null;
  areaM2: number | null;
  status: BedStatus;
  currentContents: BedCurrentContentsDto;
};

export type BedDetailDto = BedListItemDto & {
  notes: string | null;
  persistentPlants: BedCurrentPersistentPlant[];
  yearlyPlantings: BedCurrentYearlyPlanting[];
  recentActivities: [];
  openProblems: [];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type BedMutationDto = {
  id: UUID;
};

export interface BedsRepository {
  listByPlace(accountId: UUID, placeId: UUID, filters: ListBedsFilters, db?: DbHandle): Promise<PaginatedBeds>;
  listActiveByPlace(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<Bed[]>;
  findById(accountId: UUID, bedId: UUID, year?: number, db?: DbHandle): Promise<BedWithCurrentContents | null>;
  findManyByIds(accountId: UUID, ids: UUID[], db?: DbHandle): Promise<Bed[]>;
  create(input: CreateBedInput, db?: DbHandle): Promise<Bed>;
  update(accountId: UUID, bedId: UUID, patch: UpdateBedInput, db?: DbHandle): Promise<Bed | null>;
  archive(accountId: UUID, bedId: UUID, db?: DbHandle): Promise<boolean>;
}
