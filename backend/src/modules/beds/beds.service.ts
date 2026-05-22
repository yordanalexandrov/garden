import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import { SANE_YEAR_MAX, SANE_YEAR_MIN } from "../../shared/validation/common-schemas.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type { PlacesRepository } from "../places/places.types.js";
import {
  BED_STATUSES,
  type Bed,
  type BedsRepository,
  type BedStatus,
  type BedWithCurrentContents,
  type CreateBedInput,
  type ListBedsFilters,
  type PaginatedBeds,
  type UpdateBedInput
} from "./beds.types.js";

export type CreateBedServiceInput = Omit<CreateBedInput, "accountId" | "placeId">;

export class BedsService {
  constructor(
    private readonly bedsRepository: BedsRepository,
    private readonly placesRepository: PlacesRepository
  ) {}

  async listBeds(
    actor: AuthenticatedActor,
    placeId: UUID,
    filters: ListBedsFilters,
    db?: DbHandle
  ): Promise<PaginatedBeds> {
    assertValidBedFilters(filters);
    await this.assertPlaceAccessible(actor, placeId, db);

    return this.bedsRepository.listByPlace(actor.accountId, placeId, normalizeBedFilters(filters), db);
  }

  async getBed(actor: AuthenticatedActor, bedId: UUID, year?: number, db?: DbHandle): Promise<BedWithCurrentContents> {
    assertValidYear(year);
    const bed = await this.bedsRepository.findById(actor.accountId, bedId, year, db);

    if (bed === null) {
      throw bedNotFoundError();
    }

    return bed;
  }

  async createBed(actor: AuthenticatedActor, placeId: UUID, input: CreateBedServiceInput, db?: DbHandle): Promise<Bed> {
    assertValidBedCreateInput(input);
    await this.assertPlaceAccessible(actor, placeId, db);

    return this.bedsRepository.create(
      {
        ...withDerivedCreateArea(input),
        accountId: actor.accountId,
        placeId
      },
      db
    );
  }

  async updateBed(actor: AuthenticatedActor, bedId: UUID, patch: UpdateBedInput, db?: DbHandle): Promise<Bed> {
    const existing = await this.bedsRepository.findBaseById(actor.accountId, bedId, db);

    if (existing === null) {
      throw bedNotFoundError();
    }

    assertValidBedPatchInput(patch);

    const updated = await this.bedsRepository.update(actor.accountId, bedId, withDerivedPatchArea(existing, patch), db);

    if (updated === null) {
      throw bedNotFoundError();
    }

    return updated;
  }

  async archiveBed(actor: AuthenticatedActor, bedId: UUID, db?: DbHandle): Promise<void> {
    const archived = await this.bedsRepository.archive(actor.accountId, bedId, db);

    if (!archived) {
      throw bedNotFoundError();
    }
  }

  async findManyByIds(actor: AuthenticatedActor, ids: UUID[], db?: DbHandle): Promise<Bed[]> {
    return this.bedsRepository.findManyByIds(actor.accountId, ids, db);
  }

  async listActiveByPlace(actor: AuthenticatedActor, placeId: UUID, db?: DbHandle): Promise<Bed[]> {
    await this.assertPlaceAccessible(actor, placeId, db);

    return this.bedsRepository.listActiveByPlace(actor.accountId, placeId, db);
  }

  private async assertPlaceAccessible(actor: AuthenticatedActor, placeId: UUID, db?: DbHandle): Promise<void> {
    const place = await this.placesRepository.findById(actor.accountId, placeId, db);

    if (place === null) {
      throw new AppError("NOT_FOUND", "Place not found");
    }
  }
}

function assertValidBedFilters(filters: ListBedsFilters): void {
  if (filters.status !== undefined && !isBedStatus(filters.status)) {
    throw new AppError("VALIDATION_ERROR", "Invalid bed status", {
      status: ["Must be one of: active, removed, archived"]
    });
  }

  assertValidYear(filters.year);
}

function assertValidBedCreateInput(input: Partial<CreateBedServiceInput>): void {
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", "Bed name is required", {
      name: ["Required"]
    });
  }

  assertValidNullablePositiveNumber(input.widthM, "widthM");
  assertValidNullablePositiveNumber(input.lengthM, "lengthM");
  assertValidNullablePositiveNumber(input.areaM2, "areaM2");
}

function assertValidBedPatchInput(patch: UpdateBedInput): void {
  if (Object.keys(patch).length === 0) {
    throw new AppError("VALIDATION_ERROR", "At least one field is required");
  }

  if (patch.name !== undefined && (typeof patch.name !== "string" || patch.name.trim().length === 0)) {
    throw new AppError("VALIDATION_ERROR", "Bed name is required", {
      name: ["Required"]
    });
  }

  if (patch.status !== undefined && !isBedStatus(patch.status)) {
    throw new AppError("VALIDATION_ERROR", "Invalid bed status", {
      status: ["Must be one of: active, removed, archived"]
    });
  }

  assertValidNullablePositiveNumber(patch.widthM, "widthM");
  assertValidNullablePositiveNumber(patch.lengthM, "lengthM");
  assertValidNullablePositiveNumber(patch.areaM2, "areaM2");
}

function assertValidNullablePositiveNumber(value: unknown, field: "widthM" | "lengthM" | "areaM2"): void {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new AppError("VALIDATION_ERROR", `Invalid ${field}`, {
      [field]: ["Must be a positive number"]
    });
  }
}

function assertValidYear(value: unknown): void {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < SANE_YEAR_MIN || value > SANE_YEAR_MAX) {
    throw new AppError("VALIDATION_ERROR", "Invalid year", {
      year: [`Must be an integer from ${SANE_YEAR_MIN} through ${SANE_YEAR_MAX}`]
    });
  }
}

function normalizeBedFilters(filters: ListBedsFilters): ListBedsFilters {
  return {
    ...filters,
    year: filters.year ?? currentUtcYear()
  };
}

function currentUtcYear(): number {
  return new Date().getUTCFullYear();
}

function withDerivedCreateArea(input: CreateBedServiceInput): CreateBedServiceInput {
  if (input.areaM2 !== undefined) {
    return input;
  }

  return {
    ...input,
    areaM2: deriveAreaM2(input.widthM ?? null, input.lengthM ?? null)
  };
}

function withDerivedPatchArea(existing: Bed, patch: UpdateBedInput): UpdateBedInput {
  if (patch.areaM2 !== undefined || (patch.widthM === undefined && patch.lengthM === undefined)) {
    return patch;
  }

  const widthM = patch.widthM === undefined ? existing.widthM : patch.widthM;
  const lengthM = patch.lengthM === undefined ? existing.lengthM : patch.lengthM;

  return {
    ...patch,
    areaM2: deriveAreaM2(widthM, lengthM)
  };
}

function deriveAreaM2(widthM: number | null, lengthM: number | null): number | null {
  if (widthM === null || lengthM === null) {
    return null;
  }

  return Number((widthM * lengthM).toFixed(6));
}

function isBedStatus(value: unknown): value is BedStatus {
  return typeof value === "string" && (BED_STATUSES as readonly string[]).includes(value);
}

function bedNotFoundError(): AppError {
  return new AppError("NOT_FOUND", "Bed not found");
}
