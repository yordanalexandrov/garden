import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type {
  CreatePlaceInput,
  ListPlacesFilters,
  PaginatedPlaces,
  Place,
  PlaceDetail,
  PlacesRepository,
  UpdatePlaceInput
} from "./places.types.js";

export type CreatePlaceServiceInput = Omit<CreatePlaceInput, "accountId">;

export class PlacesService {
  constructor(
    private readonly placesRepository: PlacesRepository,
    private readonly auditService?: AuditService
  ) {}

  async listPlaces(actor: AuthenticatedActor, filters: ListPlacesFilters, db?: DbHandle): Promise<PaginatedPlaces> {
    return this.placesRepository.list(actor.accountId, filters, db);
  }

  async getPlace(actor: AuthenticatedActor, placeId: UUID, db?: DbHandle): Promise<PlaceDetail> {
    const place = await this.placesRepository.findById(actor.accountId, placeId, db);

    if (place === null) {
      throw notFoundError();
    }

    const counts = await this.placesRepository.countDetails(actor.accountId, placeId, db);

    return {
      ...place,
      counts
    };
  }

  async createPlace(actor: AuthenticatedActor, input: CreatePlaceServiceInput, db?: DbHandle): Promise<Place> {
    assertValidWeatherMetadata(input);

    try {
      return await this.placesRepository.create(
        {
          ...input,
          accountId: actor.accountId
        },
        db
      );
    } catch (error) {
      mapPlaceWriteError(error);
    }
  }

  async updatePlace(
    actor: AuthenticatedActor,
    placeId: UUID,
    patch: UpdatePlaceInput,
    db?: DbHandle
  ): Promise<Place> {
    const existing = await this.placesRepository.findById(actor.accountId, placeId, db);

    if (existing === null) {
      throw notFoundError();
    }

    assertValidWeatherMetadata({
      weatherEnabled: patch.weatherEnabled ?? existing.weatherEnabled,
      weatherLocationLabel:
        patch.weatherLocationLabel === undefined ? existing.weatherLocationLabel : patch.weatherLocationLabel,
      latitude: patch.latitude === undefined ? existing.latitude : patch.latitude,
      longitude: patch.longitude === undefined ? existing.longitude : patch.longitude
    });

    try {
      const updated = await this.placesRepository.update(actor.accountId, placeId, patch, db);

      if (updated === null) {
        throw notFoundError();
      }

      await this.auditService?.logActorEvent(
        {
          actor,
          entityType: "place",
          entityId: updated.id,
          action: "place.updated",
          beforeJson: {
            name: existing.name,
            weatherEnabled: existing.weatherEnabled
          },
          afterJson: {
            name: updated.name,
            weatherEnabled: updated.weatherEnabled
          }
        },
        db
      );

      return updated;
    } catch (error) {
      mapPlaceWriteError(error);
    }
  }

  async archivePlace(actor: AuthenticatedActor, placeId: UUID, db?: DbHandle): Promise<void> {
    const existing = await this.placesRepository.findById(actor.accountId, placeId, db);

    if (existing === null) {
      throw notFoundError();
    }

    const archived = await this.placesRepository.archive(actor.accountId, placeId, db);

    if (!archived) {
      throw notFoundError();
    }

    await this.auditService?.logActorEvent(
      {
        actor,
        entityType: "place",
        entityId: placeId,
        action: "place.archived",
        beforeJson: {
          archivedAt: existing.archivedAt?.toISOString() ?? null
        },
        afterJson: {
          archived: true
        }
      },
      db
    );
  }
}

function assertValidWeatherMetadata(input: {
  weatherEnabled: boolean;
  weatherLocationLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): void {
  if (!input.weatherEnabled) {
    return;
  }

  const hasLocationLabel =
    typeof input.weatherLocationLabel === "string" && input.weatherLocationLabel.trim().length > 0;
  const hasCompleteCoordinates = input.latitude !== undefined && input.latitude !== null && input.longitude !== undefined && input.longitude !== null;

  if (!hasLocationLabel && !hasCompleteCoordinates) {
    throw new AppError("VALIDATION_ERROR", "Weather-enabled places require weatherLocationLabel or both latitude and longitude", {
      weatherLocationLabel: ["Required when weatherEnabled is true without complete coordinates"]
    });
  }
}

function mapPlaceWriteError(error: unknown): never {
  if (isDuplicateActivePlaceNameError(error)) {
    throw new AppError("CONFLICT", "An active place with this name already exists", {
      name: ["Duplicate active place name"]
    });
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error("Unexpected non-error thrown while writing place");
}

function isDuplicateActivePlaceNameError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "constraint" in error &&
    error.code === "23505" &&
    error.constraint === "uq_places_account_name_active"
  );
}

function notFoundError(): AppError {
  return new AppError("NOT_FOUND", "Place not found");
}
