# Problem archive + create-duplicate fix — design

Status: Approved
Date: 2026-07-01

## Context

Users have no way to remove an erroneously created duplicate problem/observation
record without hard-deleting it, which violates the domain rule "Archive
historical business records instead of hard-deleting them." Every other
archivable entity in the codebase (places, plants, perennials, beds,
persistent-bed-plants, plantings, products, product-rules) already has a
`POST /:id/archive` endpoint and an `archived_at` column; `problems` does not.

Separately, the problem-create form has a UX bug that produces duplicate
records: after a successful `create()`, the form stays fully populated and
re-submittable (the "Save" button is only disabled while `saving()` is true,
and there is no redirect after success), so a user who misses the success
message and clicks "Save" again creates a second identical record.

Note: as of this design, `problems` already has `resolved_at` (resolve/reopen,
migration `008_problem_observations_and_resolve.sql`) and a separate child
table `problem_observations` with its own `archived_at` (per-note archive).
Neither of these covers archiving the top-level `problems` record itself,
which is what this design adds.

## Decisions (confirmed with user)

- Archive button appears **only** on the problem detail page, not in the list
  row actions.
- Archived problems/observations are **hidden from the list by default**,
  visible via an `includeArchived` filter toggle — consistent with
  places/plants/beds.
- A problem/observation can be archived **regardless of its `status`**
  (open/monitoring/resolved) — there is no prerequisite workflow state.
- Archiving is one-way; no unarchive/restore action (matches every other
  archivable entity in the codebase — none of them support restore).
- The create-duplicate bug is fixed by navigating to the problem detail page
  immediately after a successful create (instead of leaving the form on
  screen), removing the resubmission window entirely.

## Data model

New migration `009_problems_archive.sql`:

```sql
ALTER TABLE problems ADD COLUMN archived_at timestamptz;
```

Nullable, no new CHECK constraint. `archived_at` is orthogonal to `status` and
`resolved_at` — archiving does not change status semantics, exactly like
`archived_at` on `places`/`plants`/`beds` today.

## Backend API changes

Additions to `docs/gardening-helper-canonical-api-contract-v1.md` section 18
(Problems API):

- **New `18.9 POST /problems/:problemId/archive`** — archives the problem
  regardless of status. Response: `{ "data": { "archived": true } }`. Returns
  404 if the problem doesn't exist or is already archived (matches the
  idempotency behavior of every other `/:id/archive` endpoint in the
  contract).
- **`18.1 GET /problems`** — add `includeArchived` (boolean, default `false`)
  to the query parameter list, and `archivedAt` to each list item in the
  response example. When `includeArchived` is not `true`, rows with
  non-null `archived_at` are excluded.
- **`18.4 GET /problems/:problemId`** — add `archivedAt` to the response
  example. This endpoint does **not** filter by `archived_at`: an archived
  problem must remain fully readable via direct detail fetch, per domain rule
  13.1 ("Problems and observations are historical records... should remain
  readable").

## Backend implementation

- `problems.repository.ts`:
  - Add `archived_at` to `PROBLEM_COLUMNS` and to `toProblem()`.
  - New `archive(accountId, problemId, db?): Promise<boolean>` —
    `UPDATE problems SET archived_at = now() WHERE account_id = $1 AND id = $2
    AND archived_at IS NULL`, returns whether a row was updated. Mirrors
    `PlacesRepository.archive` / `PlantsRepository.archive`.
  - `list()` filters `archived_at IS NULL` unless `filters.includeArchived`
    is `true`.
  - `getDetail()` is unchanged (no archived_at filter — see API notes above).
- `problems.types.ts`: `Problem.archivedAt: Date | null`;
  `ListProblemsFilters.includeArchived?: boolean`;
  `ProblemsRepository.archive(...)` added to the interface.
- `problems.service.ts`: new `archiveProblem(actor, problemId): Promise<void>`
  — calls `repository.archive`, throws `AppError("NOT_FOUND", ...)` if it
  returns `false`. No transaction wrapper needed (single-row update), matching
  `PlantsService.archivePlant`.
- `problems.routes.ts`: new `POST /:problemId/archive` route, same shape as
  `plants.routes.ts`'s archive route.
- `problems.validation.ts`: extend `problemListQuerySchema` with the shared
  `includeArchivedQuerySchema` (already used by places/plants).
- `problems.dto.ts`: add `archivedAt` to `toProblemListItemDto`,
  `toProblemDetailDto`, `toProblemMutationDto`.

## Frontend implementation

- `problems.models.ts`: `archivedAt: string | null` on `ProblemListItem` and
  `ProblemDetail`; `includeArchived?: boolean` on `ListProblemsFilters`.
- `problems-api.service.ts`: new `archive(problemId): Observable<{ archived:
  boolean }>` calling `POST /problems/:id/archive`.
- `problem-detail-page.ts`/`.html`: new `archiving` signal and `archive()`
  method, using the existing `ArchiveConfirmationService.confirmArchive(item.
  title)`. On confirm: call `problemsApi.archive(id)`, then
  `SnackbarService.showMessage('Problem archived.')` and
  `router.navigate(['/problems'])` — identical flow to
  `plant-detail-page.archivePlant()`. "Archive" button placed near the
  resolve/reopen controls.
- `problems-list-page.ts`/`.html`: new `includeArchived` `FormControl<boolean>`
  in the filters `FormGroup`, rendered as a `MatCheckbox` ("Include
  archived"), passed through to `problemsApi.list()`. When a row's
  `archivedAt` is non-null, show an "(archived)" indicator next to it —
  matching `plants-list-page.html`'s existing pattern.
- `problem-create-page.ts`: inject `Router`; in `submit()`'s success path
  (after `create()` and, if applicable, the photo upload complete), call
  `router.navigate(['/problems', result.id])` instead of leaving `created`
  set and the form visible. The existing `created`/success-card template
  branch and its "Open detail"/"Back to problems" links become dead code and
  should be removed along with the `created` signal.

## Error handling

- Archiving a non-existent or already-archived problem → 404, surfaced via
  the existing `ApiErrorSummary`/`mapApiError` path (no new error-handling
  code needed).
- Account scoping is enforced the same way as every other repository method
  here: `WHERE account_id = $1`.

## Testing

- Backend:
  - Unit: `ProblemsService.archiveProblem` — success, already-archived/missing
    → `NOT_FOUND`, works regardless of `status`.
  - Integration: `GET /problems` respects `includeArchived` (default excludes,
    `true` includes); `GET /problems/:id` still returns an archived problem's
    full detail; account scoping (cannot archive another account's problem).
- Frontend:
  - `problem-detail-page`: archive button → confirm dialog → API call →
    snackbar + navigation, wired through the existing spec patterns used for
    `plant-detail-page`.
  - `problem-create-page`: successful create navigates to
    `/problems/:id` and no longer renders a resubmittable form.
