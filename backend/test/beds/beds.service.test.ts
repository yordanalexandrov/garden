import { describe, expect, it } from "vitest";

import type { DbHandle } from "../../src/db/transaction.js";
import { TestAuthIds, createTestActor } from "../../src/modules/auth/test-auth.adapter.js";
import { BedsService } from "../../src/modules/beds/beds.service.js";
import type {
  Bed,
  BedsRepository,
  BedWithCurrentContents,
  CreateBedInput,
  ListBedsFilters,
  PaginatedBeds,
  UpdateBedInput
} from "../../src/modules/beds/beds.types.js";
import type {
  CreatePlaceInput,
  ListPlacesFilters,
  PaginatedPlaces,
  Place,
  PlaceCountsDto,
  PlacesRepository,
  UpdatePlaceInput
} from "../../src/modules/places/places.types.js";

const actorA = createTestActor({
  userId: TestAuthIds.userA,
  accountId: TestAuthIds.accountA,
  email: "account-a@example.com"
});

const placeId = "11111111-1111-1111-1111-111111111111";
const bedId = "22222222-2222-2222-2222-222222222222";
const dbHandle = { db: undefined as never } satisfies DbHandle;

describe("BedsService", () => {
  it("derives account scope from the actor, validates parent place, and derives area on create", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await service.createBed(
      actorA,
      placeId,
      {
        name: "Bed A",
        widthM: 1.2,
        lengthM: 4
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
    expect(repositories.beds.createdInputs).toEqual([
      expect.objectContaining({
        accountId: TestAuthIds.accountA,
        placeId,
        name: "Bed A",
        widthM: 1.2,
        lengthM: 4,
        areaM2: 4.8
      })
    ]);
    expect(repositories.beds.createDbHandles).toEqual([dbHandle]);
  });

  it("rejects place references outside the actor account before creating", async () => {
    const repositories = createRepositories();
    repositories.places.place = null;
    const service = createService(repositories);

    await expect(
      service.createBed(actorA, placeId, {
        name: "Bed A"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Place not found"
    });
    expect(repositories.beds.createdInputs).toHaveLength(0);
  });

  it("rejects zero or negative dimensions before writing", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await expect(
      service.createBed(actorA, placeId, {
        name: "Bed A",
        widthM: 0
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        widthM: ["Must be a positive number"]
      }
    });
    await expect(
      service.updateBed(actorA, bedId, {
        lengthM: -1
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        lengthM: ["Must be a positive number"]
      }
    });
    expect(repositories.beds.createdInputs).toHaveLength(0);
    expect(repositories.beds.updatedPatches).toHaveLength(0);
  });

  it("rejects invalid status, invalid year, and empty patches", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await expect(
      service.updateBed(actorA, bedId, {
        status: "inactive"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        status: ["Must be one of: active, removed, archived"]
      }
    });
    await expect(service.getBed(actorA, bedId, 3001)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        year: ["Must be an integer from 1900 through 3000"]
      }
    });
    await expect(service.updateBed(actorA, bedId, {})).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
    expect(repositories.beds.updatedPatches).toHaveLength(0);
  });

  it("derives update area from existing dimensions unless area is explicitly supplied", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await service.updateBed(actorA, bedId, { widthM: 2 });
    await service.updateBed(actorA, bedId, { lengthM: null });
    await service.updateBed(actorA, bedId, { widthM: 3, areaM2: 99 });

    expect(repositories.beds.baseFindCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        bedId,
        db: undefined
      },
      {
        accountId: TestAuthIds.accountA,
        bedId,
        db: undefined
      },
      {
        accountId: TestAuthIds.accountA,
        bedId,
        db: undefined
      }
    ]);
    expect(repositories.beds.findCalls).toEqual([]);
    expect(repositories.beds.updatedPatches).toEqual([
      expect.objectContaining({
        widthM: 2,
        areaM2: 8
      }),
      expect.objectContaining({
        lengthM: null,
        areaM2: null
      }),
      expect.objectContaining({
        widthM: 3,
        areaM2: 99
      })
    ]);
  });

  it("maps missing, archived, or cross-account bed misses to NOT_FOUND", async () => {
    const repositories = createRepositories();
    repositories.beds.bedWithCurrentContents = null;
    repositories.beds.archiveResult = false;
    const service = createService(repositories);

    await expect(service.getBed(actorA, bedId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.updateBed(actorA, bedId, { name: "Nope" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.archiveBed(actorA, bedId)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("passes actor account scope and selected year to list, detail, and target-resolver lookup helpers", async () => {
    const repositories = createRepositories();
    const service = createService(repositories);

    await service.listBeds(actorA, placeId, { ...defaultFilters(), year: 2025 });
    await service.getBed(actorA, bedId, 2026, dbHandle);
    await service.findManyByIds(actorA, [bedId], dbHandle);
    await service.listActiveByPlace(actorA, placeId, dbHandle);

    expect(repositories.beds.listCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        placeId,
        filters: {
          ...defaultFilters(),
          year: 2025
        },
        db: undefined
      }
    ]);
    expect(repositories.beds.findCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        bedId,
        year: 2026,
        db: dbHandle
      }
    ]);
    expect(repositories.beds.findManyCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        ids: [bedId],
        db: dbHandle
      }
    ]);
    expect(repositories.beds.listActiveCalls).toEqual([
      {
        accountId: TestAuthIds.accountA,
        placeId,
        db: dbHandle
      }
    ]);
  });
});

function createService(repositories: ReturnType<typeof createRepositories>): BedsService {
  return new BedsService(repositories.beds, repositories.places);
}

function createRepositories(): {
  beds: StubBedsRepository;
  places: StubPlacesRepository;
} {
  return {
    beds: new StubBedsRepository(),
    places: new StubPlacesRepository()
  };
}

class StubBedsRepository implements BedsRepository {
  bed = createBed();
  bedWithCurrentContents: BedWithCurrentContents | null = createBedWithCurrentContents();
  createdInputs: CreateBedInput[] = [];
  createDbHandles: Array<DbHandle | undefined> = [];
  updatedPatches: UpdateBedInput[] = [];
  archiveResult = true;
  listCalls: Array<{ accountId: string; placeId: string; filters: ListBedsFilters; db: DbHandle | undefined }> = [];
  findCalls: Array<{ accountId: string; bedId: string; year: number | undefined; db: DbHandle | undefined }> = [];
  baseFindCalls: Array<{ accountId: string; bedId: string; db: DbHandle | undefined }> = [];
  findManyCalls: Array<{ accountId: string; ids: string[]; db: DbHandle | undefined }> = [];
  listActiveCalls: Array<{ accountId: string; placeId: string; db: DbHandle | undefined }> = [];

  listByPlace(accountId: string, requestedPlaceId: string, filters: ListBedsFilters, db?: DbHandle): Promise<PaginatedBeds> {
    this.listCalls.push({ accountId, placeId: requestedPlaceId, filters, db });

    return Promise.resolve({
      items: this.bedWithCurrentContents === null ? [] : [this.bedWithCurrentContents],
      page: filters.page,
      pageSize: filters.pageSize,
      total: this.bedWithCurrentContents === null ? 0 : 1
    });
  }

  listActiveByPlace(accountId: string, requestedPlaceId: string, db?: DbHandle): Promise<Bed[]> {
    this.listActiveCalls.push({ accountId, placeId: requestedPlaceId, db });

    return Promise.resolve([this.bed]);
  }

  findById(accountId: string, requestedBedId: string, year?: number, db?: DbHandle): Promise<BedWithCurrentContents | null> {
    this.findCalls.push({ accountId, bedId: requestedBedId, year, db });

    return Promise.resolve(this.bedWithCurrentContents);
  }

  findBaseById(accountId: string, requestedBedId: string, db?: DbHandle): Promise<Bed | null> {
    this.baseFindCalls.push({ accountId, bedId: requestedBedId, db });

    return Promise.resolve(this.bedWithCurrentContents === null ? null : this.bed);
  }

  findManyByIds(accountId: string, ids: string[], db?: DbHandle): Promise<Bed[]> {
    this.findManyCalls.push({ accountId, ids, db });

    return Promise.resolve([this.bed]);
  }

  create(input: CreateBedInput, db?: DbHandle): Promise<Bed> {
    this.createdInputs.push(input);
    this.createDbHandles.push(db);

    return Promise.resolve(createBed(input));
  }

  update(_accountId: string, _bedId: string, patch: UpdateBedInput): Promise<Bed | null> {
    this.updatedPatches.push(patch);

    if (this.bedWithCurrentContents === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.bed,
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

function defaultFilters(): ListBedsFilters {
  return {
    page: 1,
    pageSize: 20
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

function createBedWithCurrentContents(overrides: Partial<BedWithCurrentContents> = {}): BedWithCurrentContents {
  return {
    ...createBed(overrides),
    currentContents: {
      persistentPlants: [],
      yearlyPlantings: []
    },
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
