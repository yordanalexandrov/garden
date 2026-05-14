# Phase 22 — Frontend Weather UX

## 1. Purpose

This phase implements weather forecast display and rain confirmation UI. It uses backend-normalized data and must not imply automatic treatment failure or autonomous weather decisions.

## 2. Position in the sequence

Phase 4 must provide frontend foundation. Phase 21 must provide backend weather APIs. Calendar UI from Phase 20 may render weather markers if backend calendar includes them.

This phase must not be merged with Phase 21 because provider/backend semantics should be reviewed before UI. It must not include push or AI behavior.

## 3. Source documents

- `docs/gardening-helper-frontend-technical-spec-v1.md` - defines weather tab/page, rain prompt wording, and weather marker behavior.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines advisory weather, user-confirmed rain, no treatment auto-failure, and frontend prompt requirements.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines forecast and rain confirmation endpoints consumed by this phase.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines disabled forecast, prompt actions, wording, and API error tests.

## 4. Scope

### Frontend scope

- Implement place weather tab/page.
- Display forecast for weather-enabled places.
- Display weather-disabled state.
- Implement rain confirmation prompt in task/activity context where backend returns pending event.
- Implement yes/no/ignore actions calling backend confirmation endpoint.
- Render calendar weather markers if backend calendar includes weather events.
- Display backend/provider errors gracefully.

### Testing scope

- Add component/API tests for forecast display, disabled state, rain confirmation, wording, and errors.

## 5. Out of scope

- Frontend weather provider calls.
- Treatment auto-failure wording.
- Push notifications.
- AI weather advice.
- Scheduled weather checks.
- Editing place weather settings unless already supported by place edit forms.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 4, Phase 21.
- Existing frontend modules expected: place detail routing, calendar rendering if markers are added, API client/error mapper.
- Expected frontend paths after implementation: `src/app/features/weather/` or place-detail weather feature path.
- Backend requirements: forecast and rain confirmation endpoints available.
- Environment variables: no Open-Meteo frontend variables; only API base and auth session config.
- Test infrastructure requirements: mocked forecast/confirmation API responses.

## 7. Domain rules and invariants affected

- Weather prompts ask for confirmation.
- Weather is advisory.
- Rain confirmation does not auto-fail treatment.
- Weather appears only where enabled.
- Frontend must not calculate business truth.
- Weather prompts must ask for observed rain confirmation.

## 8. API contract impact

This phase consumes, but does not introduce, API endpoints.

Endpoints consumed:

- `GET /api/v1/places/:placeId/weather/forecast`
- `POST /api/v1/weather/events/:weatherEventId/confirm-rain`
- Optional calendar endpoint if weather markers are rendered.

Request/response expectations:

- Disabled forecast response has `enabled: false` and `forecast: []`.
- Confirmation request uses `response` value `confirmed_yes`, `confirmed_no`, or `ignored`.
- Confirmation response returns `userConfirmationStatus` and `observedRain`.
- Errors use canonical envelope.

## 9. Database impact

No schema changes are expected in this phase.

Frontend must not access weather tables or provider APIs directly.

## 10. Backend design notes

No backend work is expected except bug fixes in already implemented APIs.

## 11. Frontend design notes

- Weather UI should appear only for weather-enabled places, with a clear disabled state otherwise.
- Rain prompt wording must ask whether observed rain happened; it must not say treatment failed.
- Yes/no/ignore actions should call backend confirmation and update UI from response.
- Forecast data should be displayed as context, not instructions.
- Calendar weather markers should be lightweight and visually distinct.
- Provider/API errors should not block non-weather app use.
- Forbidden shortcuts: direct Open-Meteo calls, frontend rain consequence decisions, auto status changes in UI, treatment failure wording.

## 12. Integration design notes

No direct external integration work is expected in this phase.

Frontend integrates only with the backend weather API.

## 13. Testing requirements

### Unit/component tests

- Weather-disabled place shows disabled state.
- Forecast renders for enabled place.
- Rain prompt actions call correct endpoint values.
- Prompt wording does not say treatment failed.
- Confirmation response updates UI.
- API errors display without crashing.
- Calendar weather marker renders if included in scope.

### Frontend/API-service tests

- Weather API service uses canonical endpoints.
- No direct Open-Meteo URL is called.
- No `accountId` is sent.

### Static/security checks

- No Open-Meteo calls from frontend.
- No weather provider secrets in frontend config.

## 14. Verification checklist

- [ ] Place weather tab/page works.
- [ ] Enabled forecast state renders.
- [ ] Disabled weather state renders.
- [ ] Rain prompt yes/no/ignore actions work.
- [ ] Prompt wording is advisory and confirmation-based.
- [ ] Calendar weather marker support works if included.
- [ ] API errors display clearly.
- [ ] Frontend tests/typecheck/lint/build pass where configured.
- [ ] Static search confirms no direct Open-Meteo calls.

## 15. Review checklist

- [ ] Weather is presented as advisory.
- [ ] Rain prompt asks for observed confirmation.
- [ ] UI does not imply treatment failure.
- [ ] No frontend weather provider calls.
- [ ] API service is typed and centralized.
- [ ] Weather-disabled place behavior is clear.
- [ ] No push or AI behavior slipped in.

## 16. Suggested branch name

```text
feature/frontend-weather
```

## 17. Expected PR summary

```md
## Summary
Implemented frontend Weather UX.

## Scope
- Added place weather display.
- Added rain confirmation prompt/actions.
- Added calendar weather markers where supported.

## Domain rules preserved
- Weather is advisory.
- Rain is user-confirmed.
- UI does not auto-fail treatments.

## Tests
- <commands run and results>

## Deferred work
- Push notifications, scheduled weather jobs, and AI advice remain deferred.

## Review focus
- Advisory wording.
- Backend API boundary.
- Disabled/enabled states.
```

## 18. Risks and pitfalls

- Wording that tells users a treatment failed.
- Calling Open-Meteo directly from Angular.
- Treating forecasted rain as observed rain.
- Creating planned task UI side effects from confirmation.
- Hiding weather-disabled state.
- Blocking task/calendar use when weather API fails.

## 19. Exit criteria

- Weather forecast and rain confirmation UI work through backend APIs.
- Wording preserves advisory semantics.
- Frontend has no direct provider access.
