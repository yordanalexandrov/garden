# Phase 21 — Backend Weather and Rain Confirmation

## 1. Purpose

This phase implements weather forecast access and rain confirmation persistence through `WeatherPort`. Weather remains advisory and user-confirmed; it must not automatically fail treatments or create planned tasks.

## 2. Position in the sequence

Phase 5 must provide places and weather metadata. Phases 12, 18, and 19 provide activities, tasks, and calendar context. Frontend Phase 22 depends on normalized weather APIs.

This phase must not be merged with core activity/task phases because weather is assistive and should come after critical workflows. It must not be merged with push or AI because those provider boundaries are separate.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines weather optional per place, forecast advisory, user-confirmed rain, no auto treatment failure, and provider payload not truth.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Weather API section 21 and rain confirmation response mapping.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `WeatherPort`, `WeatherRepository`, and rain confirmation service flow.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines forecast disabled/enabled, provider failure, rain confirmation, and no side-effect tests.
- `docs/001_initial_schema_gardening_helper.sql` - defines `weather_events`.
- `docs/004_guards_and_triggers_gardening_helper.sql` - validates weather event account/place/entity consistency.
- `docs/env.example` - defines `WEATHER_PROVIDER=open-meteo` and `OPEN_METEO_BASE_URL`.

## 4. Scope

### Backend scope

- Define/implement `WeatherPort`.
- Implement Open-Meteo adapter behind the port.
- Implement deterministic test weather adapter.
- Implement `GET /places/:placeId/weather/forecast`.
- Implement `POST /weather/events/:weatherEventId/confirm-rain`.
- Add service logic for weather-disabled places.
- Persist rain confirmation correctly:
  - `confirmed_yes` -> `observedRain = true`
  - `confirmed_no` -> `observedRain = false`
  - `ignored` -> `observedRain = null`
- Add optional/on-demand rain-check event creation if scoped by task and explicitly documented.

### Integration scope

- Open-Meteo through `WeatherPort`.
- Test/dev mock through same port.

### Testing scope

- Add adapter-boundary, API, confirmation, account scoping, and no-autonomous-side-effect tests.

## 5. Out of scope

- Weather auto-failing treatment.
- Auto-created planned tasks from weather.
- Frontend weather UX.
- Scheduled weather checker worker if not explicitly included.
- Push notifications.
- AI weather advice.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 5, Phase 12, Phase 18, Phase 19.
- Existing modules expected: places repository/service, tasks/activities if weather events relate to them, calendar read support if weather events are already included.
- Expected backend paths after implementation: `src/modules/weather/`, `src/integrations/weather/`.
- Database requirements: `weather_events` and weather consistency guards migrated.
- Environment variables: `WEATHER_PROVIDER`, `OPEN_METEO_BASE_URL`.
- Test infrastructure requirements: deterministic weather adapter, weather-enabled and weather-disabled place fixtures, event fixtures.

## 7. Domain rules and invariants affected

- Weather is enabled per place.
- Weather forecast is advisory.
- User confirms observed rain.
- Rain confirmation does not automatically invalidate treatment.
- Weather events are persisted context.
- Provider payload is not core domain truth.
- Weather prompts must ask for confirmation later.
- External integrations go through ports/adapters.

## 8. API contract impact

Endpoints involved:

- `GET /api/v1/places/:placeId/weather/forecast`
- `POST /api/v1/weather/events/:weatherEventId/confirm-rain`

Request/response shapes to preserve:

- Forecast response returns `placeId`, `enabled`, `locationLabel` when enabled, and `forecast`.
- Disabled place response returns `enabled: false` and `forecast: []`.
- Confirmation request uses `{ "response": "confirmed_yes" | "confirmed_no" | "ignored" }`.
- Confirmation response returns `id`, `userConfirmationStatus`, and `observedRain`.
- Errors use canonical envelope.

Error codes:

- Provider failure maps to `EXTERNAL_SERVICE_ERROR`.
- Disabled place forecast is not an error; it returns enabled false.
- Inaccessible place/event returns `NOT_FOUND` or `FORBIDDEN`.

## 9. Database impact

Tables involved:

- `places`
- `weather_events`
- related `tasks` or `activities` when events are linked

Triggers/guards involved:

- `trg_weather_events_validate_consistency`

No schema changes are expected in this phase.

## 10. Backend design notes

- `WeatherPort` should return normalized forecast/rain results.
- Provider payload may be stored for audit/debugging but business logic should use normalized fields.
- Weather-disabled places should not call Open-Meteo.
- Forecast endpoint should account-scope place access.
- Rain confirmation endpoint should account-scope weather events.
- Confirmation must update only weather event fields and optional audit log; it must not change activity/task status.
- `confirmed_yes`, `confirmed_no`, and `ignored` mapping must exactly match contract.
- Provider failures should be logged without leaking secrets and returned as `EXTERNAL_SERVICE_ERROR`.
- Forbidden shortcuts: frontend/provider direct calls, auto treatment failure, auto planned task creation, provider-specific code in services.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

Port/interface:

- `WeatherPort.getForecastForPlace`
- `WeatherPort.getRainRiskForDate`
- `WeatherPort.captureForecastSnapshot` where used.

Adapter expectations:

- Open-Meteo adapter performs provider calls and maps results to normalized DTOs.
- Deterministic test adapter returns stable forecasts and failures.

Secret handling:

- Weather provider config stays server-side.
- No Open-Meteo calls from frontend.

Failure handling:

- Provider timeouts/errors map to `EXTERNAL_SERVICE_ERROR`.
- Disabled weather place returns a normal disabled response.

## 13. Testing requirements

### Unit tests

- Rain confirmation mapping for yes/no/ignore.
- Forecast normalization from adapter response.
- Disabled place logic avoids provider call.

### Integration/API tests

- Forecast disabled place returns `enabled: false` and empty forecast.
- Forecast enabled place calls `WeatherPort`.
- Provider failure maps to `EXTERNAL_SERVICE_ERROR`.
- Confirm yes sets `observedRain = true`.
- Confirm no sets `observedRain = false`.
- Confirm ignored sets `observedRain = null`.
- Cross-account weather event confirmation rejected.
- Confirmed rain does not change activity/task status.
- Confirmed rain does not create planned task.

### Static/security checks

- Open-Meteo calls isolated to adapter.
- No weather provider calls in frontend.

## 14. Verification checklist

- [ ] `WeatherPort` exists.
- [ ] Open-Meteo adapter exists or production status is documented.
- [ ] Deterministic test weather adapter exists.
- [ ] Forecast endpoint handles enabled and disabled places.
- [ ] Rain confirmation endpoint maps yes/no/ignore correctly.
- [ ] Provider failure maps to canonical error.
- [ ] No weather behavior changes activity/task status.
- [ ] No planned task is auto-created from weather.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Weather remains advisory.
- [ ] Weather-disabled places do not call provider.
- [ ] Account scoping applies to places/events.
- [ ] Provider code is behind `WeatherPort`.
- [ ] Rain confirmation side effects are limited to weather event/audit.
- [ ] Response shapes match canonical contract.
- [ ] No frontend, push, or AI scope slipped in.

## 16. Suggested branch name

```text
feature/backend-weather-rain
```

## 17. Expected PR summary

```md
## Summary
Implemented backend Weather and Rain Confirmation.

## Scope
- Added WeatherPort and weather adapters.
- Added place forecast endpoint.
- Added rain confirmation endpoint and persistence.

## Domain rules preserved
- Weather is advisory.
- Observed rain is user-confirmed.
- Rain confirmation does not auto-fail treatment or create planned tasks.

## Tests
- <commands run and results>

## Deferred work
- Frontend weather UX, scheduled weather worker, push, and AI remain deferred.

## Review focus
- Advisory-only semantics.
- Port boundary.
- Confirmation mapping.
- Account scoping.
```

## 18. Risks and pitfalls

- Treating forecasted rain as observed rain.
- Marking treatments failed automatically.
- Creating planned tasks from weather events.
- Calling Open-Meteo from core service or frontend.
- Returning provider payload as canonical domain truth.
- Treating disabled weather as an error.

## 19. Exit criteria

- Forecast and rain confirmation APIs are implemented and tested.
- Weather provider access is behind `WeatherPort`.
- Rain confirmation has no unauthorized business side effects.
- Frontend Phase 22 can consume normalized backend weather responses.
