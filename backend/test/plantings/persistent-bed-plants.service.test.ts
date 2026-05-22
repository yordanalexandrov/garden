import { describe, expect, it } from "vitest";

import type { DbHandle } from "../../src/db/transaction.js";
import { TestAuthIds, createTestActor } from "../../src/modules/auth/test-auth.adapter.js";
import type {
  Bed,
  BedsRepository,
  BedWithCurrentContents,
  CreateBedInput,
  ListBedsFilters,
  PaginatedBeds,
  UpdateBedInput
} from "../../src/modules/beds/beds.types.js";
import { PersistentBedPlantsService } from "../../src/modules/plantings/persistent-bed-plants.service.js";
import type {
  CreatePersistentBedPlantInput,
  ListPersistentBedPlantsFilters,
  PaginatedPersistentBedPlants,
  PersistentBedPlant,
  PersistentBedPlantsRepository,
  PersistentBedPlantWithPlant,
  UpdatePersistentBedPlantInput
} from "../../src/modules/plantings/persistent-bed-plants.types.js";
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

const placeId = "11111111-1111-1111-1111-111111111111";
const bedId = "22222222-2222-2222-2222-222222222222";
const plantId = "33333333-3333-3333-3333-333333333333";
const persistentBedPlantId = "44444444-4444-4444-4444-444444444444";
const dbHandle = { db: undefined as never } satisfies DbHandle;

describe("PersistentBedPlantsService", () => {
  it("derives account scope from the actor and validates parent bed and plant on create", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await service.createPersistentBedPlant(
      actorA,
      bedId,
      {
        plantId,
        plantedYear: 2021,
        quantity: 10
      },
      dbHandle
    );

    expect(repositories.beds.baseFindCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        bedId,
        db: dbHandle
      }
    ]);
    expect(repositories.plants.findCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        plantId,
        db: dbHandle
      }
    ]);
    expect(repositories.persistentBedPlants.createdInputs).toEqual([
      expect.objectContaining({
        accountId: TestAuthIds.accountA,
        bedId,
        plantId,
        plantedYear: 2021,
        quantity: 10
      })
    ]);
    expect(repositories.persistentBedPlants.createDbHandles).toEqual([dbHandle]);
  });

  it("rejects bed references outside the actor account before creating", async () => {
    const repositories = createRepositories();
    repositories.beds.bed = null;
    const service = createService(repositories);

    await expect(
      service.createPersistentBedPlant(actorA, bedId, {
        plantId
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Bed not found"
    });
    expect(repositories.plants.findCalls).toHaveLength(0);
    expect(repositories.persistentBedPlants.createdInputs).toHaveLength(0);
  });

  it("rejects plant references outside the actor account before creating", async () => {
    const repositories = createRepositories();
    repositories.plants.plant = null;
    const service = createService(repositories);

    await expect(
      service.createPersistentBedPlant(actorA, bedId, {
        plantId
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Plant not found"
    });
    expect(repositories.persistentBedPlants.createdInputs).toHaveLength(0);
  });

  it("rejects invalid status, invalid plantedYear, negative quantity, and empty patches before update writes", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await expect(
      service.createPersistentBedPlant(actorA, bedId, {
        plantId,
        quantity: -1
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        quantity: ["Must be a non-negative number"]
      }
    });
    await expect(
      service.updatePersistentBedPlant(actorA, persistentBedPlantId, {
        status: "inactive"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        status: ["Must be one of: active, removed, archived"]
      }
    });
    await expect(
      service.updatePersistentBedPlant(actorA, persistentBedPlantId, {
        plantedYear: 3001
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        plantedYear: ["Must be an integer from 1900 through 3000"]
      }
    });
    await expect(service.updatePersistentBedPlant(actorA, persistentBedPlantId, {})).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
    expect(repositories.persistentBedPlants.createdInputs).toHaveLength(0);
    expect(repositories.persistentBedPlants.updatedPatches).toHaveLength(0);
  });

  it("validates replacement plants during update", async () => {
    const repositories = createRepositories();
    repositories.plants.plant = null;
    const service = createService(repositories);

    await expect(
      service.updatePersistentBedPlant(actorA, persistentBedPlantId, {
        plantId: "55555555-5555-5555-5555-555555555555"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Plant not found"
    });
    expect(repositories.persistentBedPlants.updatedPatches).toHaveLength(0);
  });

  it("maps missing, archived, or cross-account persistent bed plant misses to NOT_FOUND", async () => {
    const repositories = createRepositories();
    repositories.persistentBedPlants.persistentBedPlantWithPlant = null;
    repositories.persistentBedPlants.archiveResult = false;
    const service = createService(repositories);

    await expect(service.getPersistentBedPlant(actorA, persistentBedPlantId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      service.updatePersistentBedPlant(actorA, persistentBedPlantId, {
        notes: "Nope"
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.archivePersistentBedPlant(actorA, persistentBedPlantId)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("passes actor account scope to list, detail, and target-resolver lookup helpers", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await service.listPersistentBedPlants(actorA, bedId, defaultFilters());
    await service.getPersistentBedPlant(actorA, persistentBedPlantId, dbHandle);
    await service.findManyByIds(actorA, [persistentBedPlantId], dbHandle);
    await service.listActiveByBed(actorA, bedId, dbHandle);

    expect(repositories.beds.baseFindCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        bedId,
        db: undefined
      },
      {
        accountId: TestAuthIds.accountA,
        bedId,
        db: dbHandle
      }
    ]);
    expect(repositories.persistentBedPlants.listCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        bedId,
        filters: defaultFilters(),
        db: undefined
      }
    ]);
    expect(repositories.persistentBedPlants.findCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        id: persistentBedPlantId,
        db: dbHandle
      }
    ]);
    expect(repositories.persistentBedPlants.findManyCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        ids: [persistentBedPlantId],
        db: dbHandle
      }
    ]);
    expect(repositories.persistentBedPlants.listActiveCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        bedId,
        db: dbHandle
      }
    ]);
  });
});

function createService(repositories: ReturnType<typeof createRepositories>): PersistentBedPlantsService {
  return new PersistentBedPlantsService(
    repositories.persistentBedPlants,
    repositories.beds,
    repositories.plants
  );
}

function createRepositories(): {
  persistentBedPlants: StubPersistentBedPlantsRepository;
  beds: StubBedsRepository;
  plants: StubPlantsRepository;
} {
  return {
    persistentBedPlants: new StubPersistentBedPlantsRepository(),
    beds: new StubBedsRepository(),
    plants: new StubPlantsRepository()
  };
}

class StubPersistentBedPlantsRepository implements PersistentBedPlantsRepository {
  persistentBedPlant = createPersistentBedPlant();
  persistentBedPlantWithPlant: PersistentBedPlantWithPlant | null = createPersistentBedPlantWithPlant();
  createdInputs: CreatePersistentBedPlantInput[] = [];
  createDbHandles: Array<DbHandle | undefined> = [];
  updatedPatches: UpdatePersistentBedPlantInput[] = [];
  archiveResult = true;
  listCalls: Array<{
    accountId: string;
    bedId: string;
    filters: ListPersistentBedPlantsFilters;
    db: DbHandle | undefined;
  }> = [];
  findCalls: Array<{ accountId: string; id: string; db: DbHandle | undefined }> = [];
  findManyCalls: Array<{ accountId: string; ids: string[]; db: DbHandle | undefined }> = [];
  listActiveCalls: Array<{ accountId: string; bedId: string; db: DbHandle | undefined }> = [];

  listByBed(
    accountId: string,
    requestedBedId: string,
    filters: ListPersistentBedPlantsFilters,
    db?: DbHandle
  ): Promise<PaginatedPersistentBedPlants> {
    this.listCalls.push({ accountId, bedId: requestedBedId, filters, db });

    return Promise.resolve({
      items: this.persistentBedPlantWithPlant === null ? [] : [this.persistentBedPlantWithPlant],
      page: filters.page,
      pageSize: filters.pageSize,
      total: this.persistentBedPlantWithPlant === null ? 0 : 1
    });
  }

  listActiveByBed(accountId: string, requestedBedId: string, db?: DbHandle): Promise<PersistentBedPlant[]> {
    this.listActiveCalls.push({ accountId, bedId: requestedBedId, db });

    return Promise.resolve([this.persistentBedPlant]);
  }

  findById(accountId: string, id: string, db?: DbHandle): Promise<PersistentBedPlantWithPlant | null> {
    this.findCalls.push({ accountId, id, db });

    return Promise.resolve(this.persistentBedPlantWithPlant);
  }

  findManyByIds(accountId: string, ids: string[], db?: DbHandle): Promise<PersistentBedPlant[]> {
    this.findManyCalls.push({ accountId, ids, db });

    return Promise.resolve([this.persistentBedPlant]);
  }

  create(input: CreatePersistentBedPlantInput, db?: DbHandle): Promise<PersistentBedPlant> {
    this.createdInputs.push(input);
    this.createDbHandles.push(db);

    return Promise.resolve(createPersistentBedPlant(input));
  }

  update(
    _accountId: string,
    _id: string,
    patch: UpdatePersistentBedPlantInput
  ): Promise<PersistentBedPlant | null> {
    this.updatedPatches.push(patch);

    if (this.persistentBedPlantWithPlant === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.persistentBedPlant,
      ...patch
    });
  }

  archive(): Promise<boolean> {
    return Promise.resolve(this.archiveResult);
  }
}

class StubBedsRepository implements BedsRepository {
  bed: Bed | null = createBed();
  baseFindCalls: Array<{ accountId: string; bedId: string; db: DbHandle | undefined }> = [];

  listByPlace(_accountId: string, _placeId: string, filters: ListBedsFilters): Promise<PaginatedBeds> {
    return Promise.resolve({
      items: this.bed === null ? [] : [{ ...this.bed, currentContents: { persistentPlants: [], yearlyPlantings: [] } }],
      page: filters.page,
      pageSize: filters.pageSize,
      total: this.bed === null ? 0 : 1
    });
  }

  listActiveByPlace(): Promise<Bed[]> {
    return Promise.resolve(this.bed === null ? [] : [this.bed]);
  }

  findBaseById(accountId: string, requestedBedId: string, db?: DbHandle): Promise<Bed | null> {
    this.baseFindCalls.push({ accountId, bedId: requestedBedId, db });

    return Promise.resolve(this.bed);
  }

  findById(): Promise<BedWithCurrentContents | null> {
    if (this.bed === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.bed,
      currentContents: {
        persistentPlants: [],
        yearlyPlantings: []
      }
    });
  }

  findManyByIds(): Promise<Bed[]> {
    return Promise.resolve(this.bed === null ? [] : [this.bed]);
  }

  create(input: CreateBedInput): Promise<Bed> {
    return Promise.resolve(createBed(input));
  }

  update(_accountId: string, _bedId: string, patch: UpdateBedInput): Promise<Bed | null> {
    if (this.bed === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.bed,
      ...patch
    });
  }

  archive(): Promise<boolean> {
    return Promise.resolve(true);
  }
}

class StubPlantsRepository implements PlantsRepository {
  plant: Plant | null = createPlant();
  findCalls: Array<{ accountId: string; plantId: string; db: DbHandle | undefined }> = [];

  list(_accountId: string, filters: ListPlantsFilters): Promise<PaginatedPlants> {
    return Promise.resolve({
      items: this.plant === null ? [] : [this.plant],
      page: filters.page,
      pageSize: filters.pageSize,
      total: this.plant === null ? 0 : 1
    });
  }

  findById(accountId: string, requestedPlantId: string, db?: DbHandle): Promise<Plant | null> {
    this.findCalls.push({ accountId, plantId: requestedPlantId, db });

    return Promise.resolve(this.plant);
  }

  create(input: CreatePlantInput): Promise<Plant> {
    return Promise.resolve(createPlant(input));
  }

  update(_accountId: string, _plantId: string, patch: UpdatePlantInput): Promise<Plant | null> {
    if (this.plant === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.plant,
      ...patch
    });
  }

  archive(): Promise<boolean> {
    return Promise.resolve(true);
  }
}

function defaultFilters(): ListPersistentBedPlantsFilters {
  return {
    page: 1,
    pageSize: 20
  };
}

function createPersistentBedPlant(overrides: Partial<PersistentBedPlant> = {}): PersistentBedPlant {
  return {
    id: persistentBedPlantId,
    accountId: TestAuthIds.accountA,
    bedId,
    plantId,
    plantedYear: 2021,
    quantity: 10,
    notes: null,
    status: "active",
    createdAt: new Date("2026-05-21T08:00:00.000Z"),
    updatedAt: new Date("2026-05-21T08:00:00.000Z"),
    archivedAt: null,
    ...overrides
  };
}

function createPersistentBedPlantWithPlant(
  overrides: Partial<PersistentBedPlantWithPlant> = {}
): PersistentBedPlantWithPlant {
  return {
    ...createPersistentBedPlant(overrides),
    plantName: "Strawberry",
    ...overrides
  };
}

function createBed(overrides: Partial<Bed> = {}): Bed {
  return {
    id: bedId,
    accountId: TestAuthIds.accountA,
    placeId,
    name: "Bed A",
    description: null,
    notes: null,
    widthM: 1.2,
    lengthM: 4,
    areaM2: 4.8,
    status: "active",
    createdAt: new Date("2026-05-21T08:00:00.000Z"),
    updatedAt: new Date("2026-05-21T08:00:00.000Z"),
    archivedAt: null,
    ...overrides
  };
}

function createPlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: plantId,
    accountId: TestAuthIds.accountA,
    commonName: "Strawberry",
    variety: null,
    plantCategory: "fruit",
    lifecycleType: "perennial",
    growingStyle: "berry",
    notes: null,
    createdAt: new Date("2026-05-21T08:00:00.000Z"),
    updatedAt: new Date("2026-05-21T08:00:00.000Z"),
    archivedAt: null,
    ...overrides
  };
}
