import { describe, expect, it } from "vitest";

import type { DbHandle } from "../../src/db/transaction.js";
import { TestAuthIds, createTestActor } from "../../src/modules/auth/test-auth.adapter.js";
import { PerennialsService } from "../../src/modules/perennials/perennials.service.js";
import type {
  CreatePerennialInput,
  ListPerennialsFilters,
  PaginatedPerennials,
  Perennial,
  PerennialsRepository,
  PerennialWithPlant,
  UpdatePerennialInput
} from "../../src/modules/perennials/perennials.types.js";
import type {
  CreatePlaceInput,
  ListPlacesFilters,
  PaginatedPlaces,
  Place,
  PlaceCountsDto,
  PlacesRepository,
  UpdatePlaceInput
} from "../../src/modules/places/places.types.js";
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
const plantId = "22222222-2222-2222-2222-222222222222";
const perennialId = "33333333-3333-3333-3333-333333333333";
const dbHandle = { db: undefined as never } satisfies DbHandle;

describe("PerennialsService", () => {
  it("derives account scope from the actor and validates parent place and plant on create", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await service.createPerennial(
      actorA,
      placeId,
      {
        plantId,
        label: "Pear near fence",
        plantedYear: 2022
      },
      dbHandle
    );

    expect(repositories.places.findCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        placeId,
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
    expect(repositories.perennials.createdInputs).toEqual([
      expect.objectContaining({
        accountId: TestAuthIds.accountA,
        placeId,
        plantId
      })
    ]);
    expect(repositories.perennials.createDbHandles).toEqual([dbHandle]);
  });

  it("rejects place references outside the actor account before creating", async () => {
    const repositories = createRepositories();
    repositories.places.place = null;
    const service = createService(repositories);

    await expect(
      service.createPerennial(actorA, placeId, {
        plantId,
        label: "Pear"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Place not found"
    });
    expect(repositories.perennials.createdInputs).toHaveLength(0);
  });

  it("rejects plant references outside the actor account before creating", async () => {
    const repositories = createRepositories();
    repositories.plants.plant = null;
    const service = createService(repositories);

    await expect(
      service.createPerennial(actorA, placeId, {
        plantId,
        label: "Pear"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Plant not found"
    });
    expect(repositories.perennials.createdInputs).toHaveLength(0);
  });

  it("rejects invalid status, invalid plantedYear, and empty patches before update writes", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await expect(
      service.updatePerennial(actorA, perennialId, {
        status: "inactive"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        status: ["Must be one of: active, removed, dead, archived"]
      }
    });
    await expect(
      service.updatePerennial(actorA, perennialId, {
        plantedYear: 3001
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        plantedYear: ["Must be an integer from 1900 through 3000"]
      }
    });
    await expect(service.updatePerennial(actorA, perennialId, {})).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
    expect(repositories.perennials.updatedPatches).toHaveLength(0);
  });

  it("validates replacement plants during update", async () => {
    const repositories = createRepositories();
    repositories.plants.plant = null;
    const service = createService(repositories);

    await expect(
      service.updatePerennial(actorA, perennialId, {
        plantId: "44444444-4444-4444-4444-444444444444"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Plant not found"
    });
    expect(repositories.perennials.updatedPatches).toHaveLength(0);
  });

  it("maps missing, archived, or cross-account perennial misses to NOT_FOUND", async () => {
    const repositories = createRepositories();
    repositories.perennials.perennialWithPlant = null;
    repositories.perennials.archiveResult = false;
    const service = createService(repositories);

    await expect(service.getPerennial(actorA, perennialId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.updatePerennial(actorA, perennialId, { label: "Nope" })).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    await expect(service.archivePerennial(actorA, perennialId)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("passes actor account scope to list and target-resolver lookup helpers", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await service.listPerennials(actorA, placeId, defaultFilters());
    await service.findManyByIds(actorA, [perennialId]);
    await service.listActiveByPlace(actorA, placeId);

    expect(repositories.perennials.listCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        placeId,
        filters: defaultFilters(),
        db: undefined
      }
    ]);
    expect(repositories.perennials.findManyCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        ids: [perennialId],
        db: undefined
      }
    ]);
    expect(repositories.perennials.listActiveCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        placeId,
        db: undefined
      }
    ]);
  });
});

function createService(repositories: ReturnType<typeof createRepositories>): PerennialsService {
  return new PerennialsService(repositories.perennials, repositories.places, repositories.plants);
}

function createRepositories(): {
  perennials: StubPerennialsRepository;
  places: StubPlacesRepository;
  plants: StubPlantsRepository;
} {
  return {
    perennials: new StubPerennialsRepository(),
    places: new StubPlacesRepository(),
    plants: new StubPlantsRepository()
  };
}

class StubPerennialsRepository implements PerennialsRepository {
  perennial = createPerennial();
  perennialWithPlant: PerennialWithPlant | null = createPerennialWithPlant();
  createdInputs: CreatePerennialInput[] = [];
  createDbHandles: Array<DbHandle | undefined> = [];
  updatedPatches: UpdatePerennialInput[] = [];
  archiveResult = true;
  listCalls: Array<{ accountId: string; placeId: string; filters: ListPerennialsFilters; db: DbHandle | undefined }> = [];
  findManyCalls: Array<{ accountId: string; ids: string[]; db: DbHandle | undefined }> = [];
  listActiveCalls: Array<{ accountId: string; placeId: string; db: DbHandle | undefined }> = [];

  listByPlace(
    accountId: string,
    requestedPlaceId: string,
    filters: ListPerennialsFilters,
    db?: DbHandle
  ): Promise<PaginatedPerennials> {
    this.listCalls.push({ accountId, placeId: requestedPlaceId, filters, db });

    return Promise.resolve({
      items: this.perennialWithPlant === null ? [] : [this.perennialWithPlant],
      page: filters.page,
      pageSize: filters.pageSize,
      total: this.perennialWithPlant === null ? 0 : 1
    });
  }

  findById(): Promise<PerennialWithPlant | null> {
    return Promise.resolve(this.perennialWithPlant);
  }

  findManyByIds(accountId: string, ids: string[], db?: DbHandle): Promise<Perennial[]> {
    this.findManyCalls.push({ accountId, ids, db });

    return Promise.resolve([this.perennial]);
  }

  listActiveByPlace(accountId: string, requestedPlaceId: string, db?: DbHandle): Promise<Perennial[]> {
    this.listActiveCalls.push({ accountId, placeId: requestedPlaceId, db });

    return Promise.resolve([this.perennial]);
  }

  create(input: CreatePerennialInput, db?: DbHandle): Promise<Perennial> {
    this.createdInputs.push(input);
    this.createDbHandles.push(db);

    return Promise.resolve(createPerennial(input));
  }

  update(_accountId: string, _perennialId: string, patch: UpdatePerennialInput): Promise<Perennial | null> {
    this.updatedPatches.push(patch);

    if (this.perennialWithPlant === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.perennial,
      ...patch
    });
  }

  archive(): Promise<boolean> {
    return Promise.resolve(this.archiveResult);
  }
}

class StubPlacesRepository implements PlacesRepository {
  place: Place | null = createPlace();
  findCalls: Array<{ accountId: string; placeId: string; db: DbHandle | undefined }> = [];

  list(_accountId: string, filters: ListPlacesFilters): Promise<PaginatedPlaces> {
    return Promise.resolve({
      items: this.place === null ? [] : [this.place],
      page: filters.page,
      pageSize: filters.pageSize,
      total: this.place === null ? 0 : 1
    });
  }

  findById(accountId: string, requestedPlaceId: string, db?: DbHandle): Promise<Place | null> {
    this.findCalls.push({ accountId, placeId: requestedPlaceId, db });

    return Promise.resolve(this.place);
  }

  countDetails(): Promise<PlaceCountsDto> {
    return Promise.resolve({
      perennials: 0,
      beds: 0,
      openProblems: 0,
      upcomingTasks: 0
    });
  }

  create(input: CreatePlaceInput): Promise<Place> {
    return Promise.resolve(createPlace(input));
  }

  update(_accountId: string, _placeId: string, patch: UpdatePlaceInput): Promise<Place | null> {
    if (this.place === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.place,
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

function defaultFilters(): ListPerennialsFilters {
  return {
    page: 1,
    pageSize: 20
  };
}

function createPerennial(overrides: Partial<Perennial> = {}): Perennial {
  return {
    id: perennialId,
    accountId: TestAuthIds.accountA,
    placeId,
    plantId,
    label: "Pear near fence",
    plantedYear: 2022,
    notes: null,
    status: "active",
    createdAt: new Date("2026-05-21T08:00:00.000Z"),
    updatedAt: new Date("2026-05-21T08:00:00.000Z"),
    archivedAt: null,
    ...overrides
  };
}

function createPerennialWithPlant(overrides: Partial<PerennialWithPlant> = {}): PerennialWithPlant {
  return {
    ...createPerennial(overrides),
    plantName: "Pear",
    ...overrides
  };
}

function createPlace(overrides: Partial<Place> = {}): Place {
  return {
    id: placeId,
    accountId: TestAuthIds.accountA,
    name: "Home Garden",
    description: null,
    notes: null,
    weatherEnabled: false,
    weatherLocationLabel: null,
    latitude: null,
    longitude: null,
    timezone: null,
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
    commonName: "Pear",
    variety: null,
    plantCategory: "fruit",
    lifecycleType: "perennial",
    growingStyle: "tree",
    notes: null,
    createdAt: new Date("2026-05-21T08:00:00.000Z"),
    updatedAt: new Date("2026-05-21T08:00:00.000Z"),
    archivedAt: null,
    ...overrides
  };
}
