import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import { SANE_YEAR_MAX, SANE_YEAR_MIN } from "../../shared/validation/common-schemas.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type { BedsRepository } from "../beds/beds.types.js";
import type { PlantsRepository } from "../plants/plants.types.js";
import {
  PERSISTENT_BED_PLANT_STATUSES,
  type CreatePersistentBedPlantInput,
  type ListPersistentBedPlantsFilters,
  type PaginatedPersistentBedPlants,
  type PersistentBedPlant,
  type PersistentBedPlantsRepository,
  type PersistentBedPlantStatus,
  type PersistentBedPlantWithPlant,
  type UpdatePersistentBedPlantInput
} from "./persistent-bed-plants.types.js";

export type CreatePersistentBedPlantServiceInput = Omit<CreatePersistentBedPlantInput, "accountId" | "bedId">;

export class PersistentBedPlantsService {
  constructor(
    private readonly persistentBedPlantsRepository: PersistentBedPlantsRepository,
    private readonly bedsRepository: BedsRepository,
    private readonly plantsRepository: PlantsRepository
  ) {}

  async listPersistentBedPlants(
    actor: AuthenticatedActor,
    bedId: UUID,
    filters: ListPersistentBedPlantsFilters,
    db?: DbHandle
  ): Promise<PaginatedPersistentBedPlants> {
    assertValidPersistentBedPlantFilters(filters);
    await this.assertBedAccessible(actor, bedId, db);

    return this.persistentBedPlantsRepository.listByBed(actor.accountId, bedId, filters, db);
  }

  async getPersistentBedPlant(
    actor: AuthenticatedActor,
    id: UUID,
    db?: DbHandle
  ): Promise<PersistentBedPlantWithPlant> {
    const persistentBedPlant = await this.persistentBedPlantsRepository.findById(actor.accountId, id, db);

    if (persistentBedPlant === null) {
      throw persistentBedPlantNotFoundError();
    }

    return persistentBedPlant;
  }

  async createPersistentBedPlant(
    actor: AuthenticatedActor,
    bedId: UUID,
    input: CreatePersistentBedPlantServiceInput,
    db?: DbHandle
  ): Promise<PersistentBedPlant> {
    assertValidPersistentBedPlantCreateInput(input);
    await this.assertBedAccessible(actor, bedId, db);
    await this.assertPlantAccessible(actor, input.plantId, db);

    return this.persistentBedPlantsRepository.create(
      {
        ...input,
        accountId: actor.accountId,
        bedId
      },
      db
    );
  }

  async updatePersistentBedPlant(
    actor: AuthenticatedActor,
    id: UUID,
    patch: UpdatePersistentBedPlantInput,
    db?: DbHandle
  ): Promise<PersistentBedPlant> {
    const existing = await this.persistentBedPlantsRepository.findById(actor.accountId, id, db);

    if (existing === null) {
      throw persistentBedPlantNotFoundError();
    }

    assertValidPersistentBedPlantPatchInput(patch);

    if (patch.plantId !== undefined) {
      await this.assertPlantAccessible(actor, patch.plantId, db);
    }

    const updated = await this.persistentBedPlantsRepository.update(actor.accountId, id, patch, db);

    if (updated === null) {
      throw persistentBedPlantNotFoundError();
    }

    return updated;
  }

  async archivePersistentBedPlant(actor: AuthenticatedActor, id: UUID, db?: DbHandle): Promise<void> {
    const archived = await this.persistentBedPlantsRepository.archive(actor.accountId, id, db);

    if (!archived) {
      throw persistentBedPlantNotFoundError();
    }
  }

  async findManyByIds(actor: AuthenticatedActor, ids: UUID[], db?: DbHandle): Promise<PersistentBedPlant[]> {
    return this.persistentBedPlantsRepository.findManyByIds(actor.accountId, ids, db);
  }

  async listActiveByBed(actor: AuthenticatedActor, bedId: UUID, db?: DbHandle): Promise<PersistentBedPlant[]> {
    await this.assertBedAccessible(actor, bedId, db);

    return this.persistentBedPlantsRepository.listActiveByBed(actor.accountId, bedId, db);
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

function assertValidPersistentBedPlantFilters(filters: ListPersistentBedPlantsFilters): void {
  if (filters.status !== undefined && !isPersistentBedPlantStatus(filters.status)) {
    throw new AppError("VALIDATION_ERROR", "Invalid persistent bed plant status", {
      status: ["Must be one of: active, removed, archived"]
    });
  }
}

function assertValidPersistentBedPlantCreateInput(input: Partial<CreatePersistentBedPlantServiceInput>): void {
  if (typeof input.plantId !== "string" || input.plantId.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", "Persistent bed plant plantId is required", {
      plantId: ["Required"]
    });
  }

  assertValidPlantedYear(input.plantedYear);
  assertValidQuantity(input.quantity);
}

function assertValidPersistentBedPlantPatchInput(patch: UpdatePersistentBedPlantInput): void {
  if (Object.keys(patch).length === 0) {
    throw new AppError("VALIDATION_ERROR", "At least one field is required");
  }

  if (patch.plantId !== undefined && (typeof patch.plantId !== "string" || patch.plantId.trim().length === 0)) {
    throw new AppError("VALIDATION_ERROR", "Persistent bed plant plantId is required", {
      plantId: ["Required"]
    });
  }

  if (patch.status !== undefined && !isPersistentBedPlantStatus(patch.status)) {
    throw new AppError("VALIDATION_ERROR", "Invalid persistent bed plant status", {
      status: ["Must be one of: active, removed, archived"]
    });
  }

  assertValidPlantedYear(patch.plantedYear);
  assertValidQuantity(patch.quantity);
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

function isPersistentBedPlantStatus(value: unknown): value is PersistentBedPlantStatus {
  return typeof value === "string" && (PERSISTENT_BED_PLANT_STATUSES as readonly string[]).includes(value);
}

function persistentBedPlantNotFoundError(): AppError {
  return new AppError("NOT_FOUND", "Persistent bed plant not found");
}
