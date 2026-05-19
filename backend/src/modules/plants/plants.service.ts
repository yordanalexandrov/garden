import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import {
  PLANT_GROWING_STYLES,
  PLANT_LIFECYCLE_TYPES,
  type CreatePlantInput,
  type GrowingStyle,
  type LifecycleType,
  type ListPlantsFilters,
  type PaginatedPlants,
  type Plant,
  type PlantsRepository,
  type UpdatePlantInput
} from "./plants.types.js";

export type CreatePlantServiceInput = Omit<CreatePlantInput, "accountId">;

export class PlantsService {
  constructor(private readonly plantsRepository: PlantsRepository) {}

  async listPlants(actor: AuthenticatedActor, filters: ListPlantsFilters, db?: DbHandle): Promise<PaginatedPlants> {
    assertValidPlantEnums(filters);

    return this.plantsRepository.list(actor.accountId, filters, db);
  }

  async getPlant(actor: AuthenticatedActor, plantId: UUID, db?: DbHandle): Promise<Plant> {
    const plant = await this.plantsRepository.findById(actor.accountId, plantId, db);

    if (plant === null) {
      throw notFoundError();
    }

    return plant;
  }

  async createPlant(actor: AuthenticatedActor, input: CreatePlantServiceInput, db?: DbHandle): Promise<Plant> {
    assertValidPlantCreateInput(input);

    return this.plantsRepository.create(
      {
        ...input,
        accountId: actor.accountId
      },
      db
    );
  }

  async updatePlant(actor: AuthenticatedActor, plantId: UUID, patch: UpdatePlantInput, db?: DbHandle): Promise<Plant> {
    const existing = await this.plantsRepository.findById(actor.accountId, plantId, db);

    if (existing === null) {
      throw notFoundError();
    }

    assertValidPlantPatchInput(patch);

    const updated = await this.plantsRepository.update(actor.accountId, plantId, patch, db);

    if (updated === null) {
      throw notFoundError();
    }

    return updated;
  }

  async archivePlant(actor: AuthenticatedActor, plantId: UUID, db?: DbHandle): Promise<void> {
    const archived = await this.plantsRepository.archive(actor.accountId, plantId, db);

    if (!archived) {
      throw notFoundError();
    }
  }
}

function assertValidPlantCreateInput(input: Partial<CreatePlantServiceInput>): void {
  if (typeof input.commonName !== "string" || input.commonName.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", "Plant commonName is required", {
      commonName: ["Required"]
    });
  }

  assertValidPlantEnums(input);
}

function assertValidPlantPatchInput(input: Partial<CreatePlantServiceInput>): void {
  if (input.commonName !== undefined && (typeof input.commonName !== "string" || input.commonName.trim().length === 0)) {
    throw new AppError("VALIDATION_ERROR", "Plant commonName is required", {
      commonName: ["Required"]
    });
  }

  assertValidPlantEnums(input);
}

function assertValidPlantEnums(input: { lifecycleType?: unknown; growingStyle?: unknown }): void {
  if (input.lifecycleType !== undefined && !isLifecycleType(input.lifecycleType)) {
    throw new AppError("VALIDATION_ERROR", "Invalid lifecycleType", {
      lifecycleType: ["Must be one of: annual, biennial, perennial"]
    });
  }

  if (input.growingStyle !== undefined && !isGrowingStyle(input.growingStyle)) {
    throw new AppError("VALIDATION_ERROR", "Invalid growingStyle", {
      growingStyle: ["Must be one of: tree, shrub, vine, herb, vegetable, berry, flower, other"]
    });
  }
}

function isLifecycleType(value: unknown): value is LifecycleType {
  return typeof value === "string" && (PLANT_LIFECYCLE_TYPES as readonly string[]).includes(value);
}

function isGrowingStyle(value: unknown): value is GrowingStyle {
  return typeof value === "string" && (PLANT_GROWING_STYLES as readonly string[]).includes(value);
}

function notFoundError(): AppError {
  return new AppError("NOT_FOUND", "Plant not found");
}
