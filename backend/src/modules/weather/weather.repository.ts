import type { Selectable } from "kysely";

import type { PlacesTable, WeatherEventsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  CreateWeatherEventInput,
  RainConfirmationResponse,
  WeatherEvent,
  WeatherEventType,
  WeatherPlace,
  WeatherRelatedEntityType,
  WeatherRepository
} from "./weather.types.js";

const WEATHER_PLACE_COLUMNS = [
  "id",
  "account_id",
  "weather_enabled",
  "weather_location_label",
  "latitude",
  "longitude",
  "timezone"
] as const;

const WEATHER_EVENT_COLUMNS = [
  "id",
  "account_id",
  "place_id",
  "related_entity_type",
  "related_entity_id",
  "event_type",
  "forecasted_rain",
  "observed_rain",
  "user_confirmation_status",
  "provider_payload",
  "created_at",
  "updated_at"
] as const;

type SelectedWeatherPlace = Pick<Selectable<PlacesTable>, (typeof WEATHER_PLACE_COLUMNS)[number]>;
type SelectedWeatherEvent = Pick<Selectable<WeatherEventsTable>, (typeof WEATHER_EVENT_COLUMNS)[number]>;

export class KyselyWeatherRepository implements WeatherRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async findPlaceById(accountId: UUID, placeId: UUID): Promise<WeatherPlace | null> {
    const row = await this.dbHandle.db
      .selectFrom("places")
      .select(WEATHER_PLACE_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "=", placeId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return row === undefined ? null : toWeatherPlace(row);
  }

  async createEvent(input: CreateWeatherEventInput): Promise<WeatherEvent> {
    const row = await this.dbHandle.db
      .insertInto("weather_events")
      .values({
        account_id: input.accountId,
        place_id: input.placeId,
        related_entity_type: input.relatedEntityType,
        related_entity_id: input.relatedEntityId,
        event_type: input.eventType,
        forecasted_rain: input.forecastedRain,
        observed_rain: input.observedRain ?? null,
        user_confirmation_status: input.userConfirmationStatus ?? null,
        provider_payload: input.providerPayload ?? null
      })
      .returning(WEATHER_EVENT_COLUMNS)
      .executeTakeFirstOrThrow();

    return toWeatherEvent(row);
  }

  async findById(accountId: UUID, weatherEventId: UUID): Promise<WeatherEvent | null> {
    const row = await this.dbHandle.db
      .selectFrom("weather_events")
      .select(WEATHER_EVENT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "=", weatherEventId)
      .executeTakeFirst();

    return row === undefined ? null : toWeatherEvent(row);
  }

  async findByRelatedEntity(
    accountId: UUID,
    relatedEntityType: WeatherRelatedEntityType,
    relatedEntityId: UUID
  ): Promise<WeatherEvent[]> {
    const rows = await this.dbHandle.db
      .selectFrom("weather_events")
      .select(WEATHER_EVENT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("related_entity_type", "=", relatedEntityType)
      .where("related_entity_id", "=", relatedEntityId)
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toWeatherEvent);
  }

  async updateRainConfirmation(
    accountId: UUID,
    weatherEventId: UUID,
    status: RainConfirmationResponse,
    observedRain: boolean | null
  ): Promise<WeatherEvent | null> {
    const row = await this.dbHandle.db
      .updateTable("weather_events")
      .set({
        user_confirmation_status: status,
        observed_rain: observedRain
      })
      .where("account_id", "=", accountId)
      .where("id", "=", weatherEventId)
      .returning(WEATHER_EVENT_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toWeatherEvent(row);
  }
}

function toWeatherPlace(row: SelectedWeatherPlace): WeatherPlace {
  return {
    id: row.id,
    accountId: row.account_id,
    weatherEnabled: row.weather_enabled,
    weatherLocationLabel: row.weather_location_label,
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    timezone: row.timezone
  };
}

function toWeatherEvent(row: SelectedWeatherEvent): WeatherEvent {
  return {
    id: row.id,
    accountId: row.account_id,
    placeId: row.place_id,
    relatedEntityType: row.related_entity_type as WeatherRelatedEntityType,
    relatedEntityId: row.related_entity_id,
    eventType: row.event_type as WeatherEventType,
    forecastedRain: row.forecasted_rain,
    observedRain: row.observed_rain,
    userConfirmationStatus: row.user_confirmation_status as WeatherEvent["userConfirmationStatus"],
    providerPayload: row.provider_payload,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toNullableNumber(value: string | null): number | null {
  return value === null ? null : Number(value);
}
