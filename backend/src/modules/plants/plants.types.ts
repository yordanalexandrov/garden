import type { Selectable } from "kysely";

import type { PlantsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";

export const PLANT_LIFECYCLE_TYPES = ["annual", "biennial", "perennial"] as const;
export const PLANT_GROWING_STYLES = ["tree", "shrub", "vine", "herb", "vegetable", "berry", "flower", "other"] as const;

export type LifecycleType = (typeof PLANT_LIFECYCLE_TYPES)[number];
export type GrowingStyle = (typeof PLANT_GROWING_STYLES)[number];
export type PlantRow = Selectable<PlantsTable>;

export type Plant = {
  id: UUID;
  accountId: UUID;
  commonName: string;
  variety: string | null;
  plantCategory: string | null;
  lifecycleType: LifecycleType;
  growingStyle: GrowingStyle;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type CreatePlantInput = {
  accountId: UUID;
  commonName: string;
  variety?: string | null;
  plantCategory?: string | null;
  lifecycleType: LifecycleType;
  growingStyle: GrowingStyle;
  notes?: string | null;
};

export type UpdatePlantInput = Partial<Omit<CreatePlantInput, "accountId">>;

export type ListPlantsFilters = {
  q?: string;
  lifecycleType?: LifecycleType;
  growingStyle?: GrowingStyle;
  includeArchived: boolean;
  page: number;
  pageSize: number;
};

export type PaginatedPlants = {
  items: Plant[];
  page: number;
  pageSize: number;
  total: number;
};

export type PlantListItemDto = {
  id: UUID;
  commonName: string;
  variety: string | null;
  plantCategory: string | null;
  lifecycleType: LifecycleType;
  growingStyle: GrowingStyle;
  notes: string | null;
  archivedAt: string | null;
};

export type PlantDetailDto = PlantListItemDto & {
  createdAt: string;
  updatedAt: string;
};

export type PlantMutationDto = {
  id: UUID;
};

export interface PlantsRepository {
  list(accountId: UUID, filters: ListPlantsFilters, db?: DbHandle): Promise<PaginatedPlants>;
  findById(accountId: UUID, plantId: UUID, db?: DbHandle): Promise<Plant | null>;
  create(input: CreatePlantInput, db?: DbHandle): Promise<Plant>;
  update(accountId: UUID, plantId: UUID, patch: UpdatePlantInput, db?: DbHandle): Promise<Plant | null>;
  archive(accountId: UUID, plantId: UUID, db?: DbHandle): Promise<boolean>;
}
