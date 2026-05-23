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
import { YearlyBedPlantingsService } from "../../src/modules/plantings/yearly-bed-plantings.service.js";
import type {
  CreateYearlyBedPlantingInput,
  ListYearlyBedPlantingsFilters,
  PaginatedYearlyBedPlantings,
  UpdateYearlyBedPlantingInput,
  YearlyBedPlanting,
  YearlyBedPlantingsRepository,
  YearlyBedPlantingWithPlant
} from "../../src/modules/plantings/yearly-bed-plantings.types.js";
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
const yearlyBedPlantingId = "44444444-4444-4444-4444-444444444444";
const dbHandle = { db: undefined as never } satisfies DbHandle;

describe("YearlyBedPlantingsService", () => {
  it("derives account scope from the actor and validates parent bed and plant on create", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await service.createYearlyBedPlanting(
      actorA,
      bedId,
      {
        plantId,
        year: 2026,
        quantity: 12,
        status: "planted"
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
    expect(repositories.yearlyBedPlantings.createdInputs).toEqual([
      expect.objectContaining({
        accountId: TestAuthIds.accountA,
        bedId,
        plantId,
        year: 2026,
        quantity: 12,
        status: "planted"
      })
    ]);
    expect(repositories.yearlyBedPlantings.createDbHandles).toEqual([dbHandle]);
  });

  it("rejects bed references outside the actor account before creating", async () => {
    const repositories = createRepositories();
    repositories.beds.bed = null;
    const service = createService(repositories);

    await expect(
      service.createYearlyBedPlanting(actorA, bedId, {
        plantId,
        year: 2026,
        status: "planted"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Bed not found"
    });
    expect(repositories.plants.findCalls).toHaveLength(0);
    expect(repositories.yearlyBedPlantings.createdInputs).toHaveLength(0);
  });

  it("rejects plant references outside the actor account before creating", async () => {
    const repositories = createRepositories();
    repositories.plants.plant = null;
    const service = createService(repositories);

    await expect(
      service.createYearlyBedPlanting(actorA, bedId, {
        plantId,
        year: 2026,
        status: "planted"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Plant not found"
    });
    expect(repositories.yearlyBedPlantings.createdInputs).toHaveLength(0);
  });

  it("rejects missing or invalid year, invalid status, negative quantity, and empty patches before writes", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await expect(
      service.createYearlyBedPlanting(actorA, bedId, {
        plantId,
        status: "planted"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        year: ["Must be an integer from 1900 through 3000"]
      }
    });
    await expect(
      service.createYearlyBedPlanting(actorA, bedId, {
        plantId,
        year: 2026,
        quantity: -1,
        status: "planted"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        quantity: ["Must be a non-negative number"]
      }
    });
    await expect(
      service.updateYearlyBedPlanting(actorA, yearlyBedPlantingId, {
        status: "growing"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        status: ["Must be one of: planned, planted, removed, harvested, archived"]
      }
    });
    await expect(
      service.updateYearlyBedPlanting(actorA, yearlyBedPlantingId, {
        year: 3001
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        year: ["Must be an integer from 1900 through 3000"]
      }
    });
    await expect(service.updateYearlyBedPlanting(actorA, yearlyBedPlantingId, {})).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
    expect(repositories.yearlyBedPlantings.createdInputs).toHaveLength(0);
    expect(repositories.yearlyBedPlantings.updatedPatches).toHaveLength(0);
  });

  it("validates replacement plants during update", async () => {
    const repositories = createRepositories();
    repositories.plants.plant = null;
    const service = createService(repositories);

    await expect(
      service.updateYearlyBedPlanting(actorA, yearlyBedPlantingId, {
        plantId: "55555555-5555-5555-5555-555555555555"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Plant not found"
    });
    expect(repositories.yearlyBedPlantings.updatedPatches).toHaveLength(0);
  });

  it("maps missing, archived, or cross-account yearly planting misses to NOT_FOUND", async () => {
    const repositories = createRepositories();
    repositories.yearlyBedPlantings.yearlyBedPlantingWithPlant = null;
    repositories.yearlyBedPlantings.archiveResult = false;
    const service = createService(repositories);

    await expect(service.getYearlyBedPlanting(actorA, yearlyBedPlantingId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      service.updateYearlyBedPlanting(actorA, yearlyBedPlantingId, {
        notes: "Nope"
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.archiveYearlyBedPlanting(actorA, yearlyBedPlantingId)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("passes actor account scope to list, detail, and target-resolver lookup helpers", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await service.listYearlyBedPlantings(actorA, bedId, defaultFilters());
    await service.getYearlyBedPlanting(actorA, yearlyBedPlantingId, dbHandle);
    await service.findManyByIds(actorA, [yearlyBedPlantingId], dbHandle);
    await service.listByBedAndYear(actorA, bedId, 2026, dbHandle);
    await service.listCurrentByBedAndYear(actorA, bedId, 2026, dbHandle);

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
      },
      {
        accountId: TestAuthIds.accountA,
        bedId,
        db: dbHandle
      }
    ]);
    expect(repositories.yearlyBedPlantings.listCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        bedId,
        filters: defaultFilters(),
        db: undefined
      }
    ]);
    expect(repositories.yearlyBedPlantings.findCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        id: yearlyBedPlantingId,
        db: dbHandle
      }
    ]);
    expect(repositories.yearlyBedPlantings.findManyCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        ids: [yearlyBedPlantingId],
        db: dbHandle
      }
    ]);
    expect(repositories.yearlyBedPlantings.listByBedAndYearCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        bedId,
        year: 2026,
        db: dbHandle
      }
    ]);
    expect(repositories.yearlyBedPlantings.listCurrentCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        bedId,
        year: 2026,
        db: dbHandle
      }
    ]);
  });
});

function createService(repositories: ReturnType<typeof createRepositories>): YearlyBedPlantingsService {
  return new YearlyBedPlantingsService(repositories.yearlyBedPlantings, repositories.beds, repositories.plants);
}

function createRepositories(): {
  yearlyBedPlantings: StubYearlyBedPlantingsRepository;
  beds: StubBedsRepository;
  plants: StubPlantsRepository;
} {
  return {
    yearlyBedPlantings: new StubYearlyBedPlantingsRepository(),
    beds: new StubBedsRepository(),
    plants: new StubPlantsRepository()
  };
}

class StubYearlyBedPlantingsRepository implements YearlyBedPlantingsRepository {
  yearlyBedPlanting = createYearlyBedPlanting();
  yearlyBedPlantingWithPlant: YearlyBedPlantingWithPlant | null = createYearlyBedPlantingWithPlant();
  createdInputs: CreateYearlyBedPlantingInput[] = [];
  createDbHandles: Array<DbHandle | undefined> = [];
  updatedPatches: UpdateYearlyBedPlantingInput[] = [];
  archiveResult = true;
  listCalls: Array<{
    accountId: string;
    bedId: string;
    filters: ListYearlyBedPlantingsFilters;
    db: DbHandle | undefined;
  }> = [];
  findCalls: Array<{ accountId: string; id: string; db: DbHandle | undefined }> = [];
  findManyCalls: Array<{ accountId: string; ids: string[]; db: DbHandle | undefined }> = [];
  listByBedAndYearCalls: Array<{ accountId: string; bedId: string; year: number; db: DbHandle | undefined }> = [];
  listCurrentCalls: Array<{ accountId: string; bedId: string; year: number; db: DbHandle | undefined }> = [];

  listByBed(
    accountId: string,
    requestedBedId: string,
    filters: ListYearlyBedPlantingsFilters,
    db?: DbHandle
  ): Promise<PaginatedYearlyBedPlantings> {
    this.listCalls.push({ accountId, bedId: requestedBedId, filters, db });

    return Promise.resolve({
      items: this.yearlyBedPlantingWithPlant === null ? [] : [this.yearlyBedPlantingWithPlant],
      page: filters.page,
      pageSize: filters.pageSize,
      total: this.yearlyBedPlantingWithPlant === null ? 0 : 1
    });
  }

  listByBedAndYear(
    accountId: string,
    requestedBedId: string,
    year: number,
    db?: DbHandle
  ): Promise<YearlyBedPlanting[]> {
    this.listByBedAndYearCalls.push({ accountId, bedId: requestedBedId, year, db });

    return Promise.resolve([this.yearlyBedPlanting]);
  }

  listCurrentByBedAndYear(
    accountId: string,
    requestedBedId: string,
    year: number,
    db?: DbHandle
  ): Promise<YearlyBedPlanting[]> {
    this.listCurrentCalls.push({ accountId, bedId: requestedBedId, year, db });

    return Promise.resolve([this.yearlyBedPlanting]);
  }

  findById(accountId: string, id: string, db?: DbHandle): Promise<YearlyBedPlantingWithPlant | null> {
    this.findCalls.push({ accountId, id, db });

    return Promise.resolve(this.yearlyBedPlantingWithPlant);
  }

  findManyByIds(accountId: string, ids: string[], db?: DbHandle): Promise<YearlyBedPlanting[]> {
    this.findManyCalls.push({ accountId, ids, db });

    return Promise.resolve([this.yearlyBedPlanting]);
  }

  create(input: CreateYearlyBedPlantingInput, db?: DbHandle): Promise<YearlyBedPlanting> {
    this.createdInputs.push(input);
    this.createDbHandles.push(db);

    return Promise.resolve(createYearlyBedPlanting(input));
  }

  update(
    _accountId: string,
    _id: string,
    patch: UpdateYearlyBedPlantingInput
  ): Promise<YearlyBedPlanting | null> {
    this.updatedPatches.push(patch);

    if (this.yearlyBedPlantingWithPlant === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.yearlyBedPlanting,
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

function defaultFilters(): ListYearlyBedPlantingsFilters {
  return {
    year: 2026,
    page: 1,
    pageSize: 20
  };
}

function createYearlyBedPlanting(overrides: Partial<YearlyBedPlanting> = {}): YearlyBedPlanting {
  return {
    id: yearlyBedPlantingId,
    accountId: TestAuthIds.accountA,
    bedId,
    plantId,
    year: 2026,
    quantity: 12,
    notes: null,
    status: "planted",
    createdAt: new Date("2026-05-21T08:00:00.000Z"),
    updatedAt: new Date("2026-05-21T08:00:00.000Z"),
    archivedAt: null,
    ...overrides
  };
}

function createYearlyBedPlantingWithPlant(
  overrides: Partial<YearlyBedPlantingWithPlant> = {}
): YearlyBedPlantingWithPlant {
  return {
    ...createYearlyBedPlanting(overrides),
    plantName: "Tomato (Roma)",
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
    commonName: "Tomato",
    variety: "Roma",
    plantCategory: "vegetable",
    lifecycleType: "annual",
    growingStyle: "vegetable",
    notes: null,
    createdAt: new Date("2026-05-21T08:00:00.000Z"),
    updatedAt: new Date("2026-05-21T08:00:00.000Z"),
    archivedAt: null,
    ...overrides
  };
}
