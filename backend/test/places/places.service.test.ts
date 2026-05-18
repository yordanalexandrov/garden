import { describe, expect, it } from "vitest";

import { TestAuthIds, createTestActor } from "../../src/modules/auth/test-auth.adapter.js";
import { PlacesService } from "../../src/modules/places/places.service.js";
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

describe("PlacesService", () => {
  it("derives account scope from the actor when creating places", async () => {
    const repository = new StubPlacesRepository();
    const service = new PlacesService(repository);

    await service.createPlace(actorA, {
      name: "Home Garden",
      weatherEnabled: false
    });

    expect(repository.createdInputs).toEqual([
      expect.objectContaining({
        accountId: TestAuthIds.accountA,
        name: "Home Garden"
      })
    ]);
  });

  it("allows enabled weather with a label or complete coordinates", async () => {
    const repository = new StubPlacesRepository();
    const service = new PlacesService(repository);

    await expect(
      service.createPlace(actorA, {
        name: "Labeled Garden",
        weatherEnabled: true,
        weatherLocationLabel: "Ruse, Bulgaria"
      })
    ).resolves.toMatchObject({ name: "Labeled Garden" });

    await expect(
      service.createPlace(actorA, {
        name: "Coordinate Garden",
        weatherEnabled: true,
        latitude: 43.84,
        longitude: 25.95
      })
    ).resolves.toMatchObject({ name: "Coordinate Garden" });
  });

  it("rejects enabled weather without explicit location metadata", async () => {
    const repository = new StubPlacesRepository();
    const service = new PlacesService(repository);

    await expect(
      service.createPlace(actorA, {
        name: "Home Garden",
        weatherEnabled: true,
        latitude: 43.84
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        weatherLocationLabel: ["Required when weatherEnabled is true without complete coordinates"]
      }
    });
    expect(repository.createdInputs).toHaveLength(0);
  });

  it("validates weather metadata against the merged existing update state", async () => {
    const repository = new StubPlacesRepository();
    const place = createPlace({
      weatherEnabled: true,
      weatherLocationLabel: "Ruse, Bulgaria",
      latitude: null,
      longitude: null
    });
    repository.place = place;
    const service = new PlacesService(repository);

    await expect(service.updatePlace(actorA, place.id, { weatherLocationLabel: null })).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("maps missing, archived, or cross-account repository misses to NOT_FOUND", async () => {
    const repository = new StubPlacesRepository();
    repository.place = null;
    repository.archiveResult = false;
    const service = new PlacesService(repository);

    await expect(service.getPlace(actorA, "99999999-9999-9999-9999-999999999999")).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    await expect(service.updatePlace(actorA, "99999999-9999-9999-9999-999999999999", { name: "Nope" })).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    await expect(service.archivePlace(actorA, "99999999-9999-9999-9999-999999999999")).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("returns place detail with account-scoped counts", async () => {
    const repository = new StubPlacesRepository();
    const place = createPlace();
    repository.place = place;
    repository.counts = {
      perennials: 2,
      beds: 3,
      openProblems: 1,
      upcomingTasks: 4
    };
    const service = new PlacesService(repository);

    await expect(service.getPlace(actorA, place.id)).resolves.toMatchObject({
      id: place.id,
      counts: repository.counts
    });
  });

  it("maps duplicate active place names to canonical CONFLICT errors", async () => {
    const repository = new StubPlacesRepository();
    const place = createPlace();
    repository.place = place;
    repository.createError = duplicateActiveNameError();
    repository.updateError = duplicateActiveNameError();
    const service = new PlacesService(repository);

    await expect(
      service.createPlace(actorA, {
        name: "Home Garden",
        weatherEnabled: false
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      details: {
        name: ["Duplicate active place name"]
      }
    });

    await expect(service.updatePlace(actorA, place.id, { name: "Home Garden" })).rejects.toMatchObject({
      code: "CONFLICT"
    });
  });
});

class StubPlacesRepository implements PlacesRepository {
  place: Place | null = createPlace();
  counts: PlaceCountsDto = {
    perennials: 0,
    beds: 0,
    openProblems: 0,
    upcomingTasks: 0
  };
  createdInputs: CreatePlaceInput[] = [];
  updatedPatches: UpdatePlaceInput[] = [];
  archiveResult = true;
  createError: Error | undefined;
  updateError: Error | undefined;

  list(_accountId: string, filters: ListPlacesFilters): Promise<PaginatedPlaces> {
    return Promise.resolve({
      items: this.place === null ? [] : [this.place],
      page: filters.page,
      pageSize: filters.pageSize,
      total: this.place === null ? 0 : 1
    });
  }

  findById(): Promise<Place | null> {
    return Promise.resolve(this.place);
  }

  countDetails(): Promise<PlaceCountsDto> {
    return Promise.resolve(this.counts);
  }

  create(input: CreatePlaceInput): Promise<Place> {
    this.createdInputs.push(input);

    if (this.createError !== undefined) {
      return Promise.reject(this.createError);
    }

    return Promise.resolve(createPlace(input));
  }

  update(_accountId: string, _placeId: string, patch: UpdatePlaceInput): Promise<Place | null> {
    this.updatedPatches.push(patch);

    if (this.updateError !== undefined) {
      return Promise.reject(this.updateError);
    }

    if (this.place === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.place,
      ...patch
    });
  }

  archive(): Promise<boolean> {
    return Promise.resolve(this.archiveResult);
  }
}

function createPlace(overrides: Partial<Place> = {}): Place {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    accountId: TestAuthIds.accountA,
    name: "Home Garden",
    description: null,
    notes: null,
    weatherEnabled: false,
    weatherLocationLabel: null,
    latitude: null,
    longitude: null,
    timezone: null,
    createdAt: new Date("2026-05-18T10:00:00.000Z"),
    updatedAt: new Date("2026-05-18T10:00:00.000Z"),
    archivedAt: null,
    ...overrides
  };
}

function duplicateActiveNameError(): Error {
  return Object.assign(new Error("duplicate active place name"), {
    code: "23505",
    constraint: "uq_places_account_name_active"
  });
}
