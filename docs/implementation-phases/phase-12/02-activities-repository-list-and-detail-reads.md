# Implementation Task - Phase 12 Step 2: Activities Repository, List, and Detail Reads

## Goal

Implement account-scoped activity repository read methods plus `GET /activities` and `GET /activities/:activityId`.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

## Scope

- [ ] Implement `ActivitiesRepository` list/detail reads using account-scoped queries.
- [ ] Include activity header, target summaries, product usages, inventory effects where available, quarantine periods, suggested task references where available, and warnings/read metadata according to canonical response needs.
- [ ] Implement `ActivitiesService.listActivities` and `getActivity`.
- [ ] Implement filters/pagination supported by the canonical contract and local query patterns.
- [ ] Return `NOT_FOUND` for inaccessible activity detail.
- [ ] Add API/repository tests for list pagination, filters, detail shape, and account scoping.

## Out of Scope

- [ ] `POST /activities`.
- [ ] Activity correction.
- [ ] Frontend pages.
- [ ] Weather rain confirmation or calendar/dashboard aggregation.

## Required Documents

- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] Existing repository and route tests.

## Domain Rules

- Activities are historical records.
- Account scoping is mandatory for all reads.
- Target labels are read models only.

## Tests Required

- [ ] Account A cannot list or read account B activities.
- [ ] List response uses canonical pagination envelope.
- [ ] Detail response includes targets/product usages and canonical arrays.
- [ ] Inaccessible ID returns canonical `NOT_FOUND` or `FORBIDDEN` per local convention.

## Acceptance Criteria

- [ ] Activity reads are available and account-scoped.
- [ ] Response shapes are compatible with the future frontend.
