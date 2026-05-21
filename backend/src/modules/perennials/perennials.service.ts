import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import { SANE_YEAR_MAX, SANE_YEAR_MIN } from "../../shared/validation/common-schemas.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type { PlacesRepository } from "../places/places.types.js";
import type { PlantsRepository } from "../plants/plants.types.js";
import {
  PERENNIAL_STATUSES,
  type CreatePerennialInput,
  type ListPerennialsFilters,
  type PaginatedPerennials,
  type Perennial,
  type PerennialsRepository,
  type PerennialStatus,
  type PerennialWithPlant,
  type UpdatePerennialInput
} from "./perennials.types.js";

export type CreatePerennialServiceInput = Omit<CreatePerennialInput, "accountId" | "placeId">;

export class PerennialsService {
  constructor(
    private readonly perennialsRepository: PerennialsRepository,
    private readonly placesRepository: PlacesRepository,
    private readonly plantsRepository: PlantsRepository
  ) {}

  async listPerennials(
    actor: AuthenticatedActor,
    placeId: UUID,
    filters: ListPerennialsFilters,
    db?: DbHandle
  ): Promise<PaginatedPerennials> {
    assertValidPerennialFilters(filters);
    await this.assertPlaceAccessible(actor, placeId, db);

    return this.perennialsRepository.listByPlace(actor.accountId, placeId, filters, db);
  }

  async getPerennial(actor: AuthenticatedActor, perennialId: UUID, db?: DbHandle): Promise<PerennialWithPlant> {
    const perennial = await this.perennialsRepository.findById(actor.accountId, perennialId, db);

    if (perennial === null) {
      throw perennialNotFoundError();
    }

    return perennial;
  }

  async createPerennial(
    actor: AuthenticatedActor,
    placeId: UUID,
    input: CreatePerennialServiceInput,
    db?: DbHandle
  ): Promise<Perennial> {
    assertValidPerennialCreateInput(input);
    await this.assertPlaceAccessible(actor, placeId, db);
    await this.assertPlantAccessible(actor, input.plantId, db);

    return this.perennialsRepository.create(
      {
        ...input,
        accountId: actor.accountId,
        placeId
      },
      db
    );
  }

  async updatePerennial(
    actor: AuthenticatedActor,
    perennialId: UUID,
    patch: UpdatePerennialInput,
    db?: DbHandle
  ): Promise<Perennial> {
    const existing = await this.perennialsRepository.findById(actor.accountId, perennialId, db);

    if (existing === null) {
      throw perennialNotFoundError();
    }

    assertValidPerennialPatchInput(patch);

    if (patch.plantId !== undefined) {
      await this.assertPlantAccessible(actor, patch.plantId, db);
    }

    const updated = await this.perennialsRepository.update(actor.accountId, perennialId, patch, db);

    if (updated === null) {
      throw perennialNotFoundError();
    }

    return updated;
  }

  async archivePerennial(actor: AuthenticatedActor, perennialId: UUID, db?: DbHandle): Promise<void> {
    const archived = await this.perennialsRepository.archive(actor.accountId, perennialId, db);

    if (!archived) {
      throw perennialNotFoundError();
    }
  }

  async findManyByIds(actor: AuthenticatedActor, ids: UUID[], db?: DbHandle): Promise<Perennial[]> {
    return this.perennialsRepository.findManyByIds(actor.accountId, ids, db);
  }

  async listActiveByPlace(actor: AuthenticatedActor, placeId: UUID, db?: DbHandle): Promise<Perennial[]> {
    await this.assertPlaceAccessible(actor, placeId, db);

    return this.perennialsRepository.listActiveByPlace(actor.accountId, placeId, db);
  }

  private async assertPlaceAccessible(actor: AuthenticatedActor, placeId: UUID, db?: DbHandle): Promise<void> {
    const place = await this.placesRepository.findById(actor.accountId, placeId, db);

    if (place === null) {
      throw new AppError("NOT_FOUND", "Place not found");
    }
  }

  private async assertPlantAccessible(actor: AuthenticatedActor, plantId: UUID, db?: DbHandle): Promise<void> {
    const plant = await this.plantsRepository.findById(actor.accountId, plantId, db);

    if (plant === null) {
      throw new AppError("NOT_FOUND", "Plant not found");
    }
  }
}

function assertValidPerennialFilters(filters: ListPerennialsFilters): void {
  if (filters.status !== undefined && !isPerennialStatus(filters.status)) {
    throw new AppError("VALIDATION_ERROR", "Invalid perennial status", {
      status: ["Must be one of: active, removed, dead, archived"]
    });
  }
}

function assertValidPerennialCreateInput(input: Partial<CreatePerennialServiceInput>): void {
  if (typeof input.plantId !== "string" || input.plantId.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", "Perennial plantId is required", {
      plantId: ["Required"]
    });
  }

  assertValidPlantedYear(input.plantedYear);
}

function assertValidPerennialPatchInput(patch: UpdatePerennialInput): void {
  if (Object.keys(patch).length === 0) {
    throw new AppError("VALIDATION_ERROR", "At least one field is required");
  }

  if (patch.status !== undefined && !isPerennialStatus(patch.status)) {
    throw new AppError("VALIDATION_ERROR", "Invalid perennial status", {
      status: ["Must be one of: active, removed, dead, archived"]
    });
  }

  assertValidPlantedYear(patch.plantedYear);
}

function assertValidPlantedYear(value: unknown): void {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < SANE_YEAR_MIN || value > SANE_YEAR_MAX) {
    throw new AppError("VALIDATION_ERROR", "Invalid plantedYear", {
      plantedYear: [`Must be an integer from ${SANE_YEAR_MIN} through ${SANE_YEAR_MAX}`]
    });
  }
}

function isPerennialStatus(value: unknown): value is PerennialStatus {
  return typeof value === "string" && (PERENNIAL_STATUSES as readonly string[]).includes(value);
}

function perennialNotFoundError(): AppError {
  return new AppError("NOT_FOUND", "Perennial not found");
}
