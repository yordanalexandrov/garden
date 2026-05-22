import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import { SANE_YEAR_MAX, SANE_YEAR_MIN } from "../../shared/validation/common-schemas.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type { BedsRepository } from "../beds/beds.types.js";
import type { PlantsRepository } from "../plants/plants.types.js";
import {
  YEARLY_BED_PLANTING_STATUSES,
  type CreateYearlyBedPlantingInput,
  type ListYearlyBedPlantingsFilters,
  type PaginatedYearlyBedPlantings,
  type UpdateYearlyBedPlantingInput,
  type YearlyBedPlanting,
  type YearlyBedPlantingsRepository,
  type YearlyBedPlantingStatus,
  type YearlyBedPlantingWithPlant
} from "./yearly-bed-plantings.types.js";

export type CreateYearlyBedPlantingServiceInput = Omit<CreateYearlyBedPlantingInput, "accountId" | "bedId">;

export class YearlyBedPlantingsService {
  constructor(
    private readonly yearlyBedPlantingsRepository: YearlyBedPlantingsRepository,
    private readonly bedsRepository: BedsRepository,
    private readonly plantsRepository: PlantsRepository
  ) {}

  async listYearlyBedPlantings(
    actor: AuthenticatedActor,
    bedId: UUID,
    filters: ListYearlyBedPlantingsFilters,
    db?: DbHandle
  ): Promise<PaginatedYearlyBedPlantings> {
    assertValidYearlyBedPlantingFilters(filters);
    await this.assertBedAccessible(actor, bedId, db);

    return this.yearlyBedPlantingsRepository.listByBed(actor.accountId, bedId, filters, db);
  }

  async getYearlyBedPlanting(actor: AuthenticatedActor, id: UUID, db?: DbHandle): Promise<YearlyBedPlantingWithPlant> {
    const yearlyBedPlanting = await this.yearlyBedPlantingsRepository.findById(actor.accountId, id, db);

    if (yearlyBedPlanting === null) {
      throw yearlyBedPlantingNotFoundError();
    }

    return yearlyBedPlanting;
  }

  async createYearlyBedPlanting(
    actor: AuthenticatedActor,
    bedId: UUID,
    input: CreateYearlyBedPlantingServiceInput,
    db?: DbHandle
  ): Promise<YearlyBedPlanting> {
    assertValidYearlyBedPlantingCreateInput(input);
    await this.assertBedAccessible(actor, bedId, db);
    await this.assertPlantAccessible(actor, input.plantId, db);

    return this.yearlyBedPlantingsRepository.create(
      {
        ...input,
        accountId: actor.accountId,
        bedId
      },
      db
    );
  }

  async updateYearlyBedPlanting(
    actor: AuthenticatedActor,
    id: UUID,
    patch: UpdateYearlyBedPlantingInput,
    db?: DbHandle
  ): Promise<YearlyBedPlanting> {
    const existing = await this.yearlyBedPlantingsRepository.findById(actor.accountId, id, db);

    if (existing === null) {
      throw yearlyBedPlantingNotFoundError();
    }

    assertValidYearlyBedPlantingPatchInput(patch);

    if (patch.plantId !== undefined) {
      await this.assertPlantAccessible(actor, patch.plantId, db);
    }

    const updated = await this.yearlyBedPlantingsRepository.update(actor.accountId, id, patch, db);

    if (updated === null) {
      throw yearlyBedPlantingNotFoundError();
    }

    return updated;
  }

  async archiveYearlyBedPlanting(actor: AuthenticatedActor, id: UUID, db?: DbHandle): Promise<void> {
    const archived = await this.yearlyBedPlantingsRepository.archive(actor.accountId, id, db);

    if (!archived) {
      throw yearlyBedPlantingNotFoundError();
    }
  }

  async findManyByIds(actor: AuthenticatedActor, ids: UUID[], db?: DbHandle): Promise<YearlyBedPlanting[]> {
    return this.yearlyBedPlantingsRepository.findManyByIds(actor.accountId, ids, db);
  }

  async listByBedAndYear(
    actor: AuthenticatedActor,
    bedId: UUID,
    year: number,
    db?: DbHandle
  ): Promise<YearlyBedPlanting[]> {
    assertValidYear(year, "year");
    await this.assertBedAccessible(actor, bedId, db);

    return this.yearlyBedPlantingsRepository.listByBedAndYear(actor.accountId, bedId, year, db);
  }

  async listCurrentByBedAndYear(
    actor: AuthenticatedActor,
    bedId: UUID,
    year: number,
    db?: DbHandle
  ): Promise<YearlyBedPlanting[]> {
    assertValidYear(year, "year");
    await this.assertBedAccessible(actor, bedId, db);

    return this.yearlyBedPlantingsRepository.listCurrentByBedAndYear(actor.accountId, bedId, year, db);
  }

  private async assertBedAccessible(actor: AuthenticatedActor, bedId: UUID, db?: DbHandle): Promise<void> {
    const bed = await this.bedsRepository.findBaseById(actor.accountId, bedId, db);

    if (bed === null) {
      throw new AppError("NOT_FOUND", "Bed not found");
    }
  }

  private async assertPlantAccessible(actor: AuthenticatedActor, plantId: UUID, db?: DbHandle): Promise<void> {
    const plant = await this.plantsRepository.findById(actor.accountId, plantId, db);

    if (plant === null) {
      throw new AppError("NOT_FOUND", "Plant not found");
    }
  }
}

function assertValidYearlyBedPlantingFilters(filters: ListYearlyBedPlantingsFilters): void {
  if (filters.year !== undefined) {
    assertValidYear(filters.year, "year");
  }

  if (filters.status !== undefined && !isYearlyBedPlantingStatus(filters.status)) {
    throw new AppError("VALIDATION_ERROR", "Invalid yearly bed planting status", {
      status: ["Must be one of: planned, planted, removed, harvested, archived"]
    });
  }
}

function assertValidYearlyBedPlantingCreateInput(input: Partial<CreateYearlyBedPlantingServiceInput>): void {
  if (typeof input.plantId !== "string" || input.plantId.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", "Yearly bed planting plantId is required", {
      plantId: ["Required"]
    });
  }

  assertValidYear(input.year, "year");

  if (!isYearlyBedPlantingStatus(input.status)) {
    throw new AppError("VALIDATION_ERROR", "Invalid yearly bed planting status", {
      status: ["Must be one of: planned, planted, removed, harvested, archived"]
    });
  }

  assertValidQuantity(input.quantity);
}

function assertValidYearlyBedPlantingPatchInput(patch: UpdateYearlyBedPlantingInput): void {
  if (Object.keys(patch).length === 0) {
    throw new AppError("VALIDATION_ERROR", "At least one field is required");
  }

  if (patch.plantId !== undefined && (typeof patch.plantId !== "string" || patch.plantId.trim().length === 0)) {
    throw new AppError("VALIDATION_ERROR", "Yearly bed planting plantId is required", {
      plantId: ["Required"]
    });
  }

  if (patch.year !== undefined) {
    assertValidYear(patch.year, "year");
  }

  if (patch.status !== undefined && !isYearlyBedPlantingStatus(patch.status)) {
    throw new AppError("VALIDATION_ERROR", "Invalid yearly bed planting status", {
      status: ["Must be one of: planned, planted, removed, harvested, archived"]
    });
  }

  assertValidQuantity(patch.quantity);
}

function assertValidYear(value: unknown, field: string): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < SANE_YEAR_MIN || value > SANE_YEAR_MAX) {
    throw new AppError("VALIDATION_ERROR", `Invalid ${field}`, {
      [field]: [`Must be an integer from ${SANE_YEAR_MIN} through ${SANE_YEAR_MAX}`]
    });
  }
}

function assertValidQuantity(value: unknown): void {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new AppError("VALIDATION_ERROR", "Invalid quantity", {
      quantity: ["Must be a non-negative number"]
    });
  }
}

function isYearlyBedPlantingStatus(value: unknown): value is YearlyBedPlantingStatus {
  return typeof value === "string" && (YEARLY_BED_PLANTING_STATUSES as readonly string[]).includes(value);
}

function yearlyBedPlantingNotFoundError(): AppError {
  return new AppError("NOT_FOUND", "Yearly bed planting not found");
}
