import type { Selectable } from "kysely";

import type { PersistentBedPlantsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";

export const PERSISTENT_BED_PLANT_STATUSES = ["active", "removed", "archived"] as const;

export type PersistentBedPlantStatus = (typeof PERSISTENT_BED_PLANT_STATUSES)[number];
export type PersistentBedPlantRow = Selectable<PersistentBedPlantsTable>;
export type PersistentBedPlantWithPlantRow = PersistentBedPlantRow & {
  common_name: string;
  variety: string | null;
};

export type PersistentBedPlant = {
  id: UUID;
  accountId: UUID;
  bedId: UUID;
  plantId: UUID;
  plantedYear: number | null;
  quantity: number | null;
  notes: string | null;
  status: PersistentBedPlantStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type PersistentBedPlantWithPlant = PersistentBedPlant & {
  plantName: string;
};

export type CreatePersistentBedPlantInput = {
  accountId: UUID;
  bedId: UUID;
  plantId: UUID;
  plantedYear?: number | null;
  quantity?: number | null;
  notes?: string | null;
};

export type UpdatePersistentBedPlantInput = {
  plantId?: UUID;
  plantedYear?: number | null;
  quantity?: number | null;
  notes?: string | null;
  status?: PersistentBedPlantStatus;
};

export type ListPersistentBedPlantsFilters = {
  status?: PersistentBedPlantStatus;
  page: number;
  pageSize: number;
};

export type PaginatedPersistentBedPlants = {
  items: PersistentBedPlantWithPlant[];
  page: number;
  pageSize: number;
  total: number;
};

export type PersistentBedPlantListItemDto = {
  id: UUID;
  bedId: UUID;
  plantId: UUID;
  plantName: string;
  plantedYear: number | null;
  quantity: number | null;
  notes: string | null;
  status: PersistentBedPlantStatus;
};

export type PersistentBedPlantDetailDto = PersistentBedPlantListItemDto & {
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type PersistentBedPlantMutationDto = {
  id: UUID;
};

export interface PersistentBedPlantsRepository {
  listByBed(
    accountId: UUID,
    bedId: UUID,
    filters: ListPersistentBedPlantsFilters,
    db?: DbHandle
  ): Promise<PaginatedPersistentBedPlants>;
  listActiveByBed(accountId: UUID, bedId: UUID, db?: DbHandle): Promise<PersistentBedPlant[]>;
  findById(accountId: UUID, id: UUID, db?: DbHandle): Promise<PersistentBedPlantWithPlant | null>;
  findManyByIds(accountId: UUID, ids: UUID[], db?: DbHandle): Promise<PersistentBedPlant[]>;
  create(input: CreatePersistentBedPlantInput, db?: DbHandle): Promise<PersistentBedPlant>;
  update(
    accountId: UUID,
    id: UUID,
    patch: UpdatePersistentBedPlantInput,
    db?: DbHandle
  ): Promise<PersistentBedPlant | null>;
  archive(accountId: UUID, id: UUID, db?: DbHandle): Promise<boolean>;
}
