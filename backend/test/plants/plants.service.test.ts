import { describe, expect, it } from "vitest";

import { TestAuthIds, createTestActor } from "../../src/modules/auth/test-auth.adapter.js";
import { PlantsService } from "../../src/modules/plants/plants.service.js";
import type {
  CreatePlantInput,
  ListPlantsFilters,
  PaginatedPlants,
  Plant,
  PlantsRepository,
  UpdatePlantInput
} from "../../src/modules/plants/plants.types.js";

const actorA = createTestActor({
  userId: TestAuthIds.userA,
  accountId: TestAuthIds.accountA,
  email: "account-a@example.com"
});

describe("PlantsService", () => {
  it("derives account scope from the actor when creating plants", async () => {
    const repository = new StubPlantsRepository();
    const service = new PlantsService(repository);

    await service.createPlant(actorA, {
      commonName: "Tomato",
      lifecycleType: "annual",
      growingStyle: "vegetable"
    });

    expect(repository.createdInputs).toEqual([
      expect.objectContaining({
        accountId: TestAuthIds.accountA,
        commonName: "Tomato"
      })
    ]);
  });

  it("rejects missing commonName before repository writes", async () => {
    const repository = new StubPlantsRepository();
    const service = new PlantsService(repository);

    await expect(
      service.createPlant(actorA, {
        commonName: " ",
        lifecycleType: "annual",
        growingStyle: "vegetable"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        commonName: ["Required"]
      }
    });
    await expect(
      service.createPlant(actorA, {
        lifecycleType: "annual",
        growingStyle: "vegetable"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
    expect(repository.createdInputs).toHaveLength(0);
  });

  it("rejects invalid lifecycleType and growingStyle values", async () => {
    const repository = new StubPlantsRepository();
    const service = new PlantsService(repository);
    const plant = createPlant();
    repository.plant = plant;

    await expect(
      service.createPlant(actorA, {
        commonName: "Tomato",
        lifecycleType: "seasonal",
        growingStyle: "vegetable"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        lifecycleType: ["Must be one of: annual, biennial, perennial"]
      }
    });
    await expect(
      service.updatePlant(actorA, plant.id, {
        growingStyle: "crop"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        growingStyle: ["Must be one of: tree, shrub, vine, herb, vegetable, berry, flower, other"]
      }
    });
    await expect(
      service.listPlants(actorA, {
        ...defaultFilters(),
        lifecycleType: "seasonal"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("does not enforce plant name uniqueness in the service", async () => {
    const repository = new StubPlantsRepository();
    const service = new PlantsService(repository);

    await service.createPlant(actorA, {
      commonName: "Tomato",
      lifecycleType: "annual",
      growingStyle: "vegetable"
    });
    await service.createPlant(actorA, {
      commonName: "Tomato",
      variety: "Roma",
      lifecycleType: "annual",
      growingStyle: "vegetable"
    });

    expect(repository.createdInputs.map((input) => input.commonName)).toEqual(["Tomato", "Tomato"]);
  });

  it("maps missing, archived, or cross-account repository misses to NOT_FOUND", async () => {
    const repository = new StubPlantsRepository();
    repository.plant = null;
    repository.archiveResult = false;
    const service = new PlantsService(repository);

    await expect(service.getPlant(actorA, "99999999-9999-9999-9999-999999999999")).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    await expect(
      service.updatePlant(actorA, "99999999-9999-9999-9999-999999999999", { commonName: "Nope" })
    ).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    await expect(service.archivePlant(actorA, "99999999-9999-9999-9999-999999999999")).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("updates plants through the repository after validation", async () => {
    const repository = new StubPlantsRepository();
    const plant = createPlant();
    repository.plant = plant;
    const service = new PlantsService(repository);

    await expect(service.updatePlant(actorA, plant.id, { variety: "Roma" })).resolves.toMatchObject({
      id: plant.id,
      variety: "Roma"
    });
    expect(repository.updatedPatches).toEqual([{ variety: "Roma" }]);
  });
});

class StubPlantsRepository implements PlantsRepository {
  plant: Plant | null = createPlant();
  createdInputs: CreatePlantInput[] = [];
  updatedPatches: UpdatePlantInput[] = [];
  archiveResult = true;

  list(_accountId: string, filters: ListPlantsFilters): Promise<PaginatedPlants> {
    return Promise.resolve({
      items: this.plant === null ? [] : [this.plant],
      page: filters.page,
      pageSize: filters.pageSize,
      total: this.plant === null ? 0 : 1
    });
  }

  findById(): Promise<Plant | null> {
    return Promise.resolve(this.plant);
  }

  create(input: CreatePlantInput): Promise<Plant> {
    this.createdInputs.push(input);

    return Promise.resolve(createPlant(input));
  }

  update(_accountId: string, _plantId: string, patch: UpdatePlantInput): Promise<Plant | null> {
    this.updatedPatches.push(patch);

    if (this.plant === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.plant,
      ...patch
    });
  }

  archive(): Promise<boolean> {
    return Promise.resolve(this.archiveResult);
  }
}

function defaultFilters(): ListPlantsFilters {
  return {
    includeArchived: false,
    page: 1,
    pageSize: 20
  };
}

function createPlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    accountId: TestAuthIds.accountA,
    commonName: "Tomato",
    variety: null,
    plantCategory: "vegetable",
    lifecycleType: "annual",
    growingStyle: "vegetable",
    notes: null,
    createdAt: new Date("2026-05-18T10:00:00.000Z"),
    updatedAt: new Date("2026-05-18T10:00:00.000Z"),
    archivedAt: null,
    ...overrides
  };
}
