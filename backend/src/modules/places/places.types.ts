import type { Selectable } from "kysely";

import type { PlacesTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";

export type PlaceRow = Selectable<PlacesTable>;

export type Place = {
  id: UUID;
  accountId: UUID;
  name: string;
  description: string | null;
  notes: string | null;
  weatherEnabled: boolean;
  weatherLocationLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type CreatePlaceInput = {
  accountId: UUID;
  name: string;
  description?: string | null;
  notes?: string | null;
  weatherEnabled: boolean;
  weatherLocationLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
};

export type UpdatePlaceInput = Partial<Omit<CreatePlaceInput, "accountId">>;

export type ListPlacesFilters = {
  q?: string;
  includeArchived: boolean;
  page: number;
  pageSize: number;
};

export type PaginatedPlaces = {
  items: Place[];
  page: number;
  pageSize: number;
  total: number;
};

export type PlaceCountsDto = {
  perennials: number;
  beds: number;
  openProblems: number;
  upcomingTasks: number;
};

export type PlaceDetail = Place & {
  counts: PlaceCountsDto;
};

export type PlaceListItemDto = {
  id: UUID;
  name: string;
  description: string | null;
  weatherEnabled: boolean;
  weatherLocationLabel: string | null;
  timezone: string | null;
  createdAt: string;
  archivedAt: string | null;
};

export type PlaceDetailDto = PlaceListItemDto & {
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  counts: PlaceCountsDto;
  updatedAt: string;
};

export type PlaceMutationDto = {
  id: UUID;
  name: string;
};

export interface PlacesRepository {
  list(accountId: UUID, filters: ListPlacesFilters, db?: DbHandle): Promise<PaginatedPlaces>;
  findById(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<Place | null>;
  countDetails(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<PlaceCountsDto>;
  create(input: CreatePlaceInput, db?: DbHandle): Promise<Place>;
  update(accountId: UUID, placeId: UUID, patch: UpdatePlaceInput, db?: DbHandle): Promise<Place | null>;
  archive(accountId: UUID, placeId: UUID, db?: DbHandle): Promise<boolean>;
}
