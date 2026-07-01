# Gardening Helper — Canonical API Contract v1

## 1. Purpose

This document defines the canonical REST API contract for Gardening Helper v1.

It is the implementation agreement between:

- Angular frontend
- Fastify backend
- repository/service layer
- validation layer
- future AI implementation agents

This document should be treated as the primary API reference for implementation.

---

# 2. API baseline

## 2.1 Base URL

```text
/api/v1
```

## 2.2 Transport

- HTTPS
- JSON request/response bodies unless endpoint explicitly uses multipart upload
- ISO 8601 timestamps
- UUID string identifiers

## 2.3 Authentication

All endpoints except health/auth bootstrap endpoints require authentication.

Expected request header:

```http
Authorization: Bearer <access_token>
```

The backend resolves the authenticated account/user and applies account scoping server-side.

Frontend must not send `accountId` for normal business operations unless explicitly required by admin tooling.

---

# 3. Standard response envelope

## 3.1 Success response

Single object:

```json
{
  "data": {}
}
```

List response:

```json
{
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

Mutation response:

```json
{
  "data": {
    "id": "uuid"
  }
}
```

## 3.2 Error response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "field": ["message"]
    }
  }
}
```

## 3.3 Standard error codes

| Code | HTTP status | Meaning |
|---|---:|---|
| VALIDATION_ERROR | 400 | Request shape or field validation failed |
| UNAUTHORIZED | 401 | Missing/invalid token |
| FORBIDDEN | 403 | Actor cannot access resource |
| NOT_FOUND | 404 | Resource does not exist or is not accessible |
| CONFLICT | 409 | Duplicate or conflicting state |
| BUSINESS_RULE_VIOLATION | 422 | Valid shape but invalid domain operation |
| INVENTORY_SHORTAGE | 422 | Insufficient stock and shortage override not allowed |
| EXTERNAL_SERVICE_ERROR | 502 | AI/weather/storage/push provider failed |
| INTERNAL_ERROR | 500 | Unexpected server failure |

---

# 4. Pagination, filtering, sorting

## 4.1 Pagination query parameters

For list endpoints:

```text
?page=1&pageSize=20
```

Defaults:
- page: `1`
- pageSize: `20`

Limits:
- max pageSize: `100`

## 4.2 Sorting

Use:

```text
?sort=field:asc
?sort=field:desc
```

If omitted, endpoint-specific default sorting applies.

## 4.3 Date filters

Use ISO date or datetime strings.

Examples:

```text
?from=2026-05-01&to=2026-05-31
?performedFrom=2026-05-01T00:00:00+03:00
```

## 4.4 Search

Use:

```text
?q=tomato
```

Search behavior is endpoint-specific but should be case-insensitive.

---

# 5. Shared enum values

## 5.1 Unit

```ts
type Unit = 'ml' | 'l' | 'g' | 'kg';
```

## 5.2 Lifecycle type

```ts
type LifecycleType = 'annual' | 'biennial' | 'perennial';
```

## 5.3 Growing style

```ts
type GrowingStyle =
  | 'tree'
  | 'shrub'
  | 'vine'
  | 'herb'
  | 'vegetable'
  | 'berry'
  | 'flower'
  | 'other';
```

## 5.4 Target type

```ts
type TargetType =
  | 'place'
  | 'perennial'
  | 'bed'
  | 'yearly_bed_planting'
  | 'persistent_bed_plant';
```

## 5.5 Target scope type

```ts
type TargetScopeType =
  | 'whole_place'
  | 'all_perennials_in_place'
  | 'selected_perennials'
  | 'all_beds_in_place'
  | 'selected_beds'
  | 'single_bed'
  | 'selected_yearly_plantings'
  | 'selected_persistent_bed_plants';
```

## 5.6 Activity type

```ts
type ActivityType =
  | 'watering'
  | 'treatment'
  | 'fertilizing'
  | 'pruning'
  | 'planting'
  | 'transplanting'
  | 'harvesting'
  | 'observation'
  | 'maintenance'
  | 'soil_work'
  | 'custom';
```

## 5.7 Product category

```ts
type ProductCategory =
  | 'insecticide'
  | 'fungicide'
  | 'pesticide'
  | 'fertilizer'
  | 'foliar_fertilizer'
  | 'biostimulant'
  | 'soil_amendment'
  | 'other_preparation';
```

## 5.8 Problem type

```ts
type ProblemType = 'problem' | 'observation';
```

## 5.9 Problem status

```ts
type ProblemStatus = 'open' | 'monitoring' | 'resolved';
```

## 5.10 Problem category

```ts
type ProblemCategory =
  | 'insect'
  | 'fungus'
  | 'bacteria'
  | 'nutrient_deficiency'
  | 'watering_issue'
  | 'weather_damage'
  | 'growth_issue'
  | 'unknown'
  | 'other';
```

## 5.11 Task type

```ts
type TaskType =
  | 'spraying'
  | 'fertilizing'
  | 'pruning'
  | 'planting'
  | 'harvest_reminder'
  | 'custom';
```

## 5.12 Task status

```ts
type TaskStatus = 'suggested' | 'planned' | 'done' | 'skipped' | 'canceled';
```

## 5.13 Task source type

```ts
type TaskSourceType = 'activity' | 'manual' | 'weather' | 'ai';
```

## 5.14 Reminder type

```ts
type ReminderType = 'day_before' | 'same_day';
```

## 5.15 Reminder status

```ts
type ReminderStatus = 'scheduled' | 'sent' | 'failed' | 'canceled';
```

## 5.16 Rain confirmation response

```ts
type RainConfirmationResponse = 'confirmed_yes' | 'confirmed_no' | 'ignored';
```

---

# 6. Shared DTOs

## 6.1 TargetRef

```json
{
  "targetType": "bed",
  "targetId": "uuid"
}
```

## 6.2 TargetSelection

Used for create activity/task flows.

```json
{
  "perennialIds": ["uuid"],
  "bedIds": ["uuid"],
  "yearlyPlantingIds": ["uuid"],
  "persistentBedPlantIds": ["uuid"]
}
```

Only fields relevant to the selected `targetScopeType` should be supplied.

## 6.3 TargetSummary

Returned by detail/list endpoints.

```json
{
  "targetType": "bed",
  "targetId": "uuid",
  "label": "Bed A",
  "placeId": "uuid"
}
```

## 6.4 GeneratedSideEffectsSummary

```json
{
  "inventoryMovementsCount": 2,
  "quarantinePeriodsCount": 1,
  "suggestedTasksCount": 1,
  "warnings": []
}
```

---

# 7. Health

## 7.1 GET /health

Returns API health status.

Response:

```json
{
  "data": {
    "status": "ok",
    "timestamp": "2026-05-13T12:00:00.000Z"
  }
}
```

Auth:
- not required

---

# 8. Places API

## 8.1 GET /places

List active places.

Query:
- `q` optional
- `includeArchived` optional boolean

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Home Garden",
        "description": "Back garden",
        "weatherEnabled": true,
        "weatherLocationLabel": "Ruse, Bulgaria",
        "timezone": "Europe/Sofia",
        "createdAt": "2026-05-13T12:00:00.000Z",
        "archivedAt": null
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## 8.2 POST /places

Create place.

Request:

```json
{
  "name": "Home Garden",
  "description": "Back garden and orchard",
  "notes": "",
  "weatherEnabled": true,
  "weatherLocationLabel": "Ruse, Bulgaria",
  "latitude": 43.84,
  "longitude": 25.95,
  "timezone": "Europe/Sofia"
}
```

Validation:
- `name` required
- if `weatherEnabled = true`, require either `weatherLocationLabel` or both `latitude` and `longitude`

Response:

```json
{
  "data": {
    "id": "uuid",
    "name": "Home Garden"
  }
}
```

## 8.3 GET /places/:placeId

Get place detail.

Response:

```json
{
  "data": {
    "id": "uuid",
    "name": "Home Garden",
    "description": "Back garden and orchard",
    "notes": "",
    "weatherEnabled": true,
    "weatherLocationLabel": "Ruse, Bulgaria",
    "latitude": 43.84,
    "longitude": 25.95,
    "timezone": "Europe/Sofia",
    "counts": {
      "perennials": 12,
      "beds": 4,
      "openProblems": 2,
      "upcomingTasks": 3
    },
    "createdAt": "2026-05-13T12:00:00.000Z",
    "updatedAt": "2026-05-13T12:00:00.000Z",
    "archivedAt": null
  }
}
```

## 8.4 PATCH /places/:placeId

Update place.

Request:
- partial body matching create fields

Response:

```json
{
  "data": {
    "id": "uuid",
    "name": "Updated name"
  }
}
```

## 8.5 POST /places/:placeId/archive

Archive place.

Response:

```json
{
  "data": {
    "archived": true
  }
}
```

---

# 9. Plants API

## 9.1 GET /plants

Query:
- `q`
- `lifecycleType`
- `growingStyle`
- `includeArchived`
- pagination

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "commonName": "Tomato",
        "variety": "Roma",
        "plantCategory": "vegetable",
        "lifecycleType": "annual",
        "growingStyle": "vegetable",
        "notes": "",
        "archivedAt": null
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## 9.2 POST /plants

Request:

```json
{
  "commonName": "Tomato",
  "variety": "Roma",
  "plantCategory": "vegetable",
  "lifecycleType": "annual",
  "growingStyle": "vegetable",
  "notes": ""
}
```

Validation:
- `commonName` required
- lifecycle/growing style must be allowed values

Response:

```json
{
  "data": {
    "id": "uuid"
  }
}
```

## 9.3 GET /plants/:plantId

Get plant detail.

## 9.4 PATCH /plants/:plantId

Update plant.

## 9.5 POST /plants/:plantId/archive

Archive plant.

---

# 10. Perennials API

## 10.1 GET /places/:placeId/perennials

List perennials for place.

Query:
- `q`
- `status`
- pagination

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "placeId": "uuid",
        "plantId": "uuid",
        "plantName": "Pear",
        "label": "Pear near fence",
        "plantedYear": 2022,
        "status": "active",
        "notes": ""
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## 10.2 POST /places/:placeId/perennials

Request:

```json
{
  "plantId": "uuid",
  "label": "Pear near fence",
  "plantedYear": 2022,
  "notes": ""
}
```

Validation:
- place exists in account
- plant exists in account
- plantedYear optional but sane if provided

Response:

```json
{
  "data": {
    "id": "uuid"
  }
}
```

## 10.3 GET /perennials/:perennialId

Get detail.

## 10.4 PATCH /perennials/:perennialId

Update.

## 10.5 POST /perennials/:perennialId/archive

Archive.

---

# 11. Beds API

## 11.1 GET /places/:placeId/beds

List beds for place.

Query:
- `year` optional, default current year
- `q`
- pagination

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "placeId": "uuid",
        "name": "Bed A",
        "description": "",
        "widthM": 1.2,
        "lengthM": 4,
        "areaM2": 4.8,
        "status": "active",
        "currentContents": {
          "persistentPlants": [
            {
              "id": "uuid",
              "plantName": "Strawberry",
              "quantity": 10
            }
          ],
          "yearlyPlantings": [
            {
              "id": "uuid",
              "plantName": "Tomato",
              "year": 2026,
              "quantity": 12,
              "status": "planted"
            }
          ]
        }
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## 11.2 POST /places/:placeId/beds

Request:

```json
{
  "name": "Bed A",
  "description": "",
  "notes": "",
  "widthM": 1.2,
  "lengthM": 4
}
```

Validation:
- name required
- dimensions positive if supplied

## 11.3 GET /beds/:bedId

Get bed detail.

Query:
- `year` optional

Response:

```json
{
  "data": {
    "id": "uuid",
    "placeId": "uuid",
    "name": "Bed A",
    "description": "",
    "notes": "",
    "widthM": 1.2,
    "lengthM": 4,
    "areaM2": 4.8,
    "status": "active",
    "persistentPlants": [],
    "yearlyPlantings": [],
    "recentActivities": [],
    "openProblems": []
  }
}
```

## 11.4 PATCH /beds/:bedId

Update bed.

## 11.5 POST /beds/:bedId/archive

Archive bed.

---

# 12. Persistent Bed Plants API

## 12.1 GET /beds/:bedId/persistent-plants

List persistent plants in bed.

## 12.2 POST /beds/:bedId/persistent-plants

Request:

```json
{
  "plantId": "uuid",
  "plantedYear": 2025,
  "quantity": 10,
  "notes": ""
}
```

Response:

```json
{
  "data": {
    "id": "uuid"
  }
}
```

## 12.3 PATCH /persistent-bed-plants/:id

Update.

## 12.4 POST /persistent-bed-plants/:id/archive

Archive/remove.

---

# 13. Yearly Bed Plantings API

## 13.1 GET /beds/:bedId/plantings

Query:
- `year` required or defaults current year
- `status` optional

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "bedId": "uuid",
        "plantId": "uuid",
        "plantName": "Tomato",
        "year": 2026,
        "quantity": 12,
        "notes": "",
        "status": "planted"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## 13.2 POST /beds/:bedId/plantings

Request:

```json
{
  "plantId": "uuid",
  "year": 2026,
  "quantity": 12,
  "notes": "",
  "status": "planted"
}
```

Validation:
- year required
- plant belongs to account
- bed belongs to account
- duplicate same plant/bed/year is allowed

## 13.3 PATCH /plantings/:plantingId

Update.

## 13.4 POST /plantings/:plantingId/archive

Archive.

---

# 14. Products API

## 14.1 GET /products

Query:
- `q`
- `category`
- `includeArchived`
- pagination

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Example Fungicide",
        "category": "fungicide",
        "activeSubstance": "Copper",
        "manufacturer": "Example Co",
        "formulation": "WG",
        "defaultUnit": "g",
        "stockSummary": {
          "quantityRemaining": 250,
          "unit": "g"
        },
        "rulesCount": 2,
        "archivedAt": null
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## 14.2 POST /products

Request:

```json
{
  "name": "Example Fungicide",
  "category": "fungicide",
  "activeSubstance": "Copper",
  "manufacturer": "Example Co",
  "formulation": "WG",
  "defaultUnit": "g",
  "notes": ""
}
```

Validation:
- name required
- category allowed
- defaultUnit allowed

## 14.3 GET /products/:productId

Product detail.

Response:

```json
{
  "data": {
    "id": "uuid",
    "name": "Example Fungicide",
    "category": "fungicide",
    "activeSubstance": "Copper",
    "manufacturer": "Example Co",
    "formulation": "WG",
    "defaultUnit": "g",
    "notes": "",
    "usageRules": [],
    "inventorySummary": {
      "quantityRemaining": 250,
      "unit": "g",
      "lotsCount": 1,
      "expiredLotsCount": 0
    },
    "recentMovements": []
  }
}
```

## 14.4 PATCH /products/:productId

Update.

## 14.5 POST /products/:productId/archive

Archive.

---

# 15. Product Usage Rules API

## 15.1 GET /products/:productId/rules

List usage rules for product.

## 15.2 POST /products/:productId/rules

Request:

```json
{
  "plantId": "uuid",
  "doseValue": 20,
  "doseUnit": "g",
  "dilutionText": "20 g / 10 l water",
  "applicationMethod": "foliar spray",
  "reapplicationIntervalDays": 10,
  "quarantinePeriodDays": 14,
  "notes": ""
}
```

Validation:
- product belongs to account
- plant belongs to account
- doseValue > 0
- interval values null or >= 0
- active duplicate product+plant rule conflicts in v1

## 15.3 GET /product-rules/:ruleId

Get rule.

## 15.4 PATCH /product-rules/:ruleId

Update rule.

## 15.5 POST /product-rules/:ruleId/archive

Archive rule.

---

# 16. Inventory API

## 16.1 GET /inventory

Inventory overview.

Query:
- `q`
- `category`
- `lowStockOnly`
- `expiringBefore`
- pagination

Response:

```json
{
  "data": {
    "items": [
      {
        "productId": "uuid",
        "productName": "Example Fungicide",
        "category": "fungicide",
        "quantityRemaining": 250,
        "unit": "g",
        "lotsCount": 1,
        "nearestExpiryDate": "2027-05-13"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## 16.2 GET /products/:productId/inventory-lots

List lots.

## 16.3 POST /products/:productId/inventory-lots

Create lot and purchase movement transactionally.

Request:

```json
{
  "quantityInitial": 250,
  "unit": "g",
  "purchaseDate": "2026-05-13",
  "expiryDate": "2027-05-13",
  "batchNumber": "B-123",
  "notes": ""
}
```

Validation:
- quantityInitial > 0
- unit allowed
- product exists

Response:

```json
{
  "data": {
    "lot": {
      "id": "uuid"
    },
    "movement": {
      "id": "uuid"
    }
  }
}
```

Transactional:
- yes

## 16.4 GET /products/:productId/inventory-movements

List movement history.

Query:
- `from`
- `to`
- `movementType`
- pagination

## 16.5 POST /inventory/adjustments

Manual adjustment.

Request:

```json
{
  "productId": "uuid",
  "inventoryLotId": "uuid",
  "quantity": 20,
  "unit": "g",
  "movementType": "manual_adjustment",
  "direction": "increase",
  "notes": "Measured remaining stock"
}
```

Validation:
- quantity > 0
- direction: `increase` or `decrease`
- if inventoryLotId provided, lot must belong to product
- adjustment must create movement history

Transactional:
- yes

---

# 17. Activities API

## 17.1 GET /activities

List activities.

Query:
- `placeId`
- `type`
- `from`
- `to`
- `targetType`
- `targetId`
- pagination

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "placeId": "uuid",
        "placeName": "Home Garden",
        "type": "treatment",
        "performedAt": "2026-05-13T08:00:00+03:00",
        "targetSummary": "2 beds",
        "productSummary": "Example Fungicide",
        "sideEffects": {
          "inventoryMovementsCount": 1,
          "quarantinePeriodsCount": 1,
          "suggestedTasksCount": 1,
          "warnings": []
        }
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## 17.2 POST /activities

Create activity.

Request:

```json
{
  "placeId": "uuid",
  "type": "treatment",
  "performedAt": "2026-05-13T08:00:00+03:00",
  "targetScopeType": "selected_beds",
  "targetSelection": {
    "bedIds": ["uuid-1", "uuid-2"]
  },
  "notes": "Preventive spray",
  "productUsages": [
    {
      "productId": "uuid",
      "productUsageRuleId": "uuid",
      "quantityUsed": 30,
      "unit": "ml",
      "notes": ""
    }
  ],
  "allowInventoryShortage": false
}
```

Response:

```json
{
  "data": {
    "activity": {
      "id": "uuid"
    },
    "inventoryEffects": [
      {
        "movementId": "uuid",
        "productId": "uuid",
        "quantity": 30,
        "unit": "ml"
      }
    ],
    "quarantinePeriods": [
      {
        "id": "uuid",
        "startsOn": "2026-05-13",
        "endsOn": "2026-05-27"
      }
    ],
    "suggestedTasks": [
      {
        "id": "uuid",
        "type": "spraying",
        "dueDate": "2026-05-23",
        "status": "suggested"
      }
    ],
    "warnings": []
  }
}
```

Validation:
- place required for all whole/all/selected place-scoped flows
- targetSelection must match targetScopeType
- resolved target set must not be empty
- productUsages optional depending on activity type
- productUsageRuleId must belong to product if supplied
- quantityUsed > 0
- unit allowed

Transactional:
- yes

Side effects:
- inserts activity
- inserts resolved activity targets
- inserts product usage rows
- creates stock movements and updates lots
- creates quarantine periods
- creates suggested follow-up tasks

## 17.3 GET /activities/:activityId

Get activity detail.

Response:

```json
{
  "data": {
    "id": "uuid",
    "placeId": "uuid",
    "type": "treatment",
    "performedAt": "2026-05-13T08:00:00+03:00",
    "targetScopeType": "selected_beds",
    "targets": [],
    "productUsages": [],
    "inventoryMovements": [],
    "quarantinePeriods": [],
    "suggestedTasks": [],
    "notes": ""
  }
}
```

## 17.4 POST /activities/:activityId/correct

Hybrid correction workflow endpoint.

For v1, fresh records without business side effects may use normal validated update flows where available.
Activities that created inventory, quarantine, suggested task or related side effects must use an explicit correction workflow.

The correction workflow must not silently mutate historical side effects.
It should create auditable reverse/adjust operations inside a backend-owned transaction.

---

# 18. Problems API

## 18.1 GET /problems

Query:
- `placeId`
- `type`
- `status`
- `category`
- `from`
- `to`
- pagination

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "problem",
        "placeId": "uuid",
        "targetType": "bed",
        "targetId": "uuid",
        "targetLabel": "Bed A",
        "title": "Leaf spots",
        "category": "fungus",
        "severity": "medium",
        "status": "open",
        "observedAt": "2026-05-13T10:00:00+03:00",
        "resolvedAt": null,
        "photosCount": 2
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## 18.2 POST /problems

Create problem or observation metadata.

Request:

```json
{
  "type": "problem",
  "placeId": "uuid",
  "targetType": "bed",
  "targetId": "uuid",
  "title": "Leaf spots on tomatoes",
  "description": "Dark spots on lower leaves",
  "category": "fungus",
  "severity": "medium",
  "status": "open",
  "observedAt": "2026-05-13T10:00:00+03:00",
  "linkedActivityId": null
}
```

Validation:
- title required
- description required
- place required
- target belongs to place/account
- photos allowed only for type problem in v1

Response:

```json
{
  "data": {
    "id": "uuid"
  }
}
```

## 18.3 POST /problems/:problemId/photos

Upload photo.

Content type:
- multipart/form-data

Fields:
- `file`

Validation:
- problem must exist
- problem type must be `problem`
- image MIME types only
- size limit configured by backend

Response:

```json
{
  "data": {
    "id": "uuid",
    "storageKey": "problems/uuid/photo.jpg"
  }
}
```

## 18.4 GET /problems/:problemId

Get detail.

Response:

```json
{
  "data": {
    "id": "uuid",
    "type": "problem",
    "placeId": "uuid",
    "targetType": "bed",
    "targetId": "uuid",
    "title": "Leaf spots",
    "description": "...",
    "category": "fungus",
    "severity": "medium",
    "status": "open",
    "observedAt": "2026-05-13T10:00:00+03:00",
    "resolvedAt": null,
    "photos": [
      {
        "id": "uuid",
        "url": "signed-or-api-url",
        "mimeType": "image/jpeg"
      }
    ],
    "observations": [
      {
        "id": "uuid",
        "problemId": "uuid",
        "summary": "Spots are spreading to upper leaves",
        "recommendation": "Increase spacing for airflow",
        "source": "user",
        "createdAt": "2026-05-14T09:00:00+03:00",
        "updatedAt": "2026-05-14T09:00:00+03:00"
      }
    ],
    "linkedActivity": null
  }
}
```

## 18.5 PATCH /problems/:problemId

Update problem/observation fields.

## 18.6 Problem observations

Observations are comment-like follow-up notes attached to a problem or observation record, created either manually by the user or automatically when accepting an AI `problem_summary` suggestion (see 22.4). They are not historical business truth in the same sense as activities or inventory movements, so they use a dedicated archive action rather than the archive-first pattern used for other domain records — an archived observation is excluded from `GET /problems/:problemId` but the row is retained for audit purposes.

### 18.6.1 POST /problems/:problemId/observations

Add a manual observation. `source` is always `"user"` for this endpoint.

Request:

```json
{
  "summary": "string (required, min length 1)",
  "recommendation": "string (optional)"
}
```

Response (201):

```json
{
  "data": {
    "id": "uuid",
    "problemId": "uuid",
    "summary": "Spots are spreading to upper leaves",
    "recommendation": "Increase spacing for airflow",
    "source": "user",
    "createdAt": "2026-05-14T09:00:00+03:00",
    "updatedAt": "2026-05-14T09:00:00+03:00"
  }
}
```

404 if the problem does not exist or is not owned by the account.

### 18.6.2 PATCH /problems/:problemId/observations/:obsId

Edit an existing observation. At least one field required.

Request:

```json
{
  "summary": "string (optional, min length 1)",
  "recommendation": "string | null (optional)"
}
```

Response (200): same shape as 18.6.1. 404 if the problem or observation does not exist, is not owned by the account, or the observation is already archived.

### 18.6.3 POST /problems/:problemId/observations/:obsId/archive

Archives the observation (excludes it from future `GET /problems/:problemId` responses). Idempotent guard: returns 404 if already archived.

Response (200):

```json
{
  "data": { "archived": true }
}
```

## 18.7 POST /problems/:problemId/resolve

Sets `status = "resolved"` and `resolvedAt = now()`.

Response (200): same mutation shape as 18.2, `{ "data": { "id": "uuid" } }`. Fetch `GET /problems/:problemId` for the updated `status`/`resolvedAt`. 404 if not found/owned. 409 if already resolved.

## 18.8 POST /problems/:problemId/reopen

Sets `status = "open"` and `resolvedAt = null`.

Response (200): same mutation shape as 18.7. 404 if not found/owned. 409 if not currently resolved.

---

# 19. Tasks API

## 19.1 GET /tasks

Query:
- `placeId`
- `status`
- `type`
- `dueFrom`
- `dueTo`
- pagination

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "placeId": "uuid",
        "type": "spraying",
        "dueDate": "2026-05-23",
        "status": "suggested",
        "targetScopeType": "selected_beds",
        "targetSummary": "2 beds",
        "sourceType": "activity",
        "notes": ""
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## 19.2 POST /tasks

Create manual task.

Request:

```json
{
  "placeId": "uuid",
  "type": "fertilizing",
  "dueDate": "2026-05-20",
  "notes": "",
  "status": "planned",
  "targetScopeType": "selected_beds",
  "targetSelection": {
    "bedIds": ["uuid"]
  }
}
```

Validation:
- targetScopeType required
- targetSelection must match targetScopeType
- resolved target set must be non-empty
- dueDate required
- backend sets sourceType = manual for this endpoint
- if status is planned, backend sets confirmedAt and creates reminders
- if status is suggested, reminders must not be created

Transactional:
- yes

## 19.3 GET /tasks/:taskId

Get detail.

Response:

```json
{
  "data": {
    "id": "uuid",
    "placeId": "uuid",
    "type": "spraying",
    "dueDate": "2026-05-23",
    "status": "suggested",
    "sourceType": "activity",
    "sourceReferenceId": "uuid",
    "targetScopeType": "selected_beds",
    "targets": [],
    "reminders": [],
    "weatherEvents": [],
    "notes": ""
  }
}
```

## 19.4 PATCH /tasks/:taskId

Update editable fields.

Allowed:
- dueDate
- notes
- type if not done/canceled
- targetScopeType and targetSelection if not done/canceled

## 19.5 POST /tasks/:taskId/confirm

Confirm suggested task.

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "planned",
    "confirmedAt": "2026-05-13T12:00:00+03:00",
    "reminders": [
      {
        "id": "uuid",
        "reminderType": "day_before",
        "scheduledFor": "2026-05-22T09:00:00+03:00"
      },
      {
        "id": "uuid",
        "reminderType": "same_day",
        "scheduledFor": "2026-05-23T09:00:00+03:00"
      }
    ]
  }
}
```

Transactional:
- yes

## 19.6 POST /tasks/:taskId/dismiss

Set suggested task to canceled.

## 19.7 POST /tasks/:taskId/complete

Mark planned task done.

Optional:
- may return option/link to create activity from task later

## 19.8 POST /tasks/:taskId/skip

Mark task skipped.

---

# 20. Calendar API

## 20.1 GET /calendar

Unified calendar feed.

Query:
- `from` required
- `to` required
- `placeId` optional

Response:

```json
{
  "data": {
    "activities": [
      {
        "id": "uuid",
        "type": "activity",
        "activityType": "treatment",
        "dateTime": "2026-05-13T08:00:00+03:00",
        "title": "Treatment",
        "placeId": "uuid",
        "targetSummary": "2 beds"
      }
    ],
    "tasks": [
      {
        "id": "uuid",
        "type": "task",
        "taskType": "spraying",
        "dueDate": "2026-05-23",
        "status": "suggested",
        "title": "Spraying"
      }
    ],
    "quarantinePeriods": [
      {
        "id": "uuid",
        "type": "quarantine",
        "startsOn": "2026-05-13",
        "endsOn": "2026-05-27",
        "title": "Quarantine: Example Fungicide",
        "activityId": "uuid",
        "productId": "uuid"
      }
    ],
    "weatherEvents": [
      {
        "id": "uuid",
        "type": "weather",
        "date": "2026-05-23",
        "eventType": "rain_check",
        "userConfirmationStatus": "pending"
      }
    ]
  }
}
```

---

# 21. Weather API

## 21.1 GET /places/:placeId/weather/forecast

Get forecast for place.

Response:

```json
{
  "data": {
    "placeId": "uuid",
    "enabled": true,
    "locationLabel": "Ruse, Bulgaria",
    "forecast": [
      {
        "date": "2026-05-13",
        "temperatureMinC": 12,
        "temperatureMaxC": 24,
        "rainProbability": 0.4,
        "summary": "Possible rain"
      }
    ]
  }
}
```

If weather disabled:

```json
{
  "data": {
    "placeId": "uuid",
    "enabled": false,
    "forecast": []
  }
}
```

## 21.2 POST /weather/events/:weatherEventId/confirm-rain

Request:

```json
{
  "response": "confirmed_yes"
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "userConfirmationStatus": "confirmed_yes",
    "observedRain": true
  }
}
```

Rules:
- `confirmed_yes` -> observedRain true
- `confirmed_no` -> observedRain false
- `ignored` -> observedRain null

---

# 22. AI API

## 22.1 POST /ai/product-ingestion

Create AI product ingestion session.

Request JSON:

```json
{
  "productName": "Example Fungicide",
  "labelText": "Label text..."
}
```

Alternative:
- multipart/form-data with image + optional text fields

Response:

```json
{
  "data": {
    "aiSession": {
      "id": "uuid",
      "kind": "product_ingestion",
      "inputMode": "text",
      "status": "completed"
    },
    "suggestions": [
      {
        "id": "uuid",
        "suggestionType": "product",
        "payload": {
          "name": "Example Fungicide",
          "category": "fungicide",
          "activeSubstance": "Copper",
          "manufacturer": "Example Co",
          "formulation": "WG",
          "defaultUnit": "g",
          "notes": ""
        }
      },
      {
        "id": "uuid",
        "suggestionType": "product_rule",
        "payload": {
          "plantName": "Tomato",
          "doseValue": 20,
          "doseUnit": "g",
          "dilutionText": "20 g / 10 l water",
          "reapplicationIntervalDays": 10,
          "quarantinePeriodDays": 14
        }
      }
    ],
    "warnings": [
      "Review label data before saving."
    ]
  }
}
```

Rule:
- nothing is saved to products/product rules until suggestion is accepted

## 22.2 POST /ai/bed-planning

Request:

```json
{
  "bedId": "uuid",
  "year": 2026,
  "candidatePlantIds": ["uuid"],
  "notes": "I want tomatoes, basil and peppers"
}
```

Response:

```json
{
  "data": {
    "aiSession": {
      "id": "uuid",
      "kind": "bed_planning",
      "status": "completed"
    },
    "suggestions": [
      {
        "id": "uuid",
        "suggestionType": "bed_plan",
        "payload": {
          "spacingSuggestions": [],
          "coexistenceNotes": [],
          "warnings": [],
          "roughQuantityGuidance": []
        }
      }
    ]
  }
}
```

Rule:
- bed plan output is guidance, not auto-applied truth

## 22.3 POST /ai/problem-assist

Request:

```json
{
  "problemId": "uuid"
}
```

or

```json
{
  "text": "Leaves are yellow with spots..."
}
```

Response:

```json
{
  "data": {
    "aiSession": {
      "id": "uuid",
      "kind": "problem_assist",
      "status": "completed"
    },
    "suggestions": [
      {
        "id": "uuid",
        "suggestionType": "problem_summary",
        "payload": {
          "summary": "...",
          "possibleCategories": ["fungus", "nutrient_deficiency"],
          "followUpQuestions": []
        }
      }
    ]
  }
}
```

Rule:
- no autonomous diagnosis wording

## 22.4 POST /ai/suggestions/:suggestionId/accept

Accept suggestion and create/update business records.

Request (all fields optional):

```json
{
  "editedPayload": {},
  "problemId": "uuid",
  "acceptedCategory": "fungus"
}
```

For `suggestionType: "problem_summary"`, `problemId` targets which problem the observation is attached to (falls back to the AI session's `relatedEntityId` when omitted; if neither resolves, the suggestion is accepted without creating an observation). `acceptedCategory` optionally updates the target problem's category in the same transaction.

Response:

```json
{
  "data": {
    "acceptedSuggestionId": "uuid",
    "createdEntities": [
      {
        "entityType": "product",
        "entityId": "uuid"
      }
    ],
    "updatedEntities": []
  }
}
```

Transactional:
- yes

## 22.5 POST /ai/suggestions/:suggestionId/reject

Reject suggestion.

Response:

```json
{
  "data": {
    "rejected": true
  }
}
```

---

# 23. Push Notifications API

## 23.1 POST /push/subscriptions

Register or reactivate browser push subscription.

Request:

```json
{
  "endpoint": "https://push-service.example/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  },
  "userAgent": "Mozilla/5.0..."
}
```

Response:

```json
{
  "data": {
    "registered": true
  }
}
```

## 23.2 GET /push/subscriptions

List active subscriptions for current account.

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "endpoint": "https://push-service.example/...",
        "isActive": true,
        "createdAt": "2026-05-13T12:00:00.000Z"
      }
    ]
  }
}
```

## 23.3 POST /push/subscriptions/:subscriptionId/deactivate

Deactivate subscription.

---

# 24. Dashboard API

## 24.1 GET /dashboard

Aggregated dashboard data.

Query:
- `placeId` optional

Response:

```json
{
  "data": {
    "upcomingTasks": [],
    "suggestedTasks": [],
    "activeQuarantinePeriods": [],
    "recentActivities": [],
    "openProblems": [],
    "lowStockProducts": [],
    "places": []
  }
}
```

Purpose:
- avoid frontend making many independent requests on app load

---

# 25. Endpoint transaction summary

| Endpoint | Transactional | Reason |
|---|---:|---|
| POST /activities | yes | Creates activity + targets + product usage + inventory + quarantine + tasks |
| POST /tasks/:id/confirm | yes | Updates task + creates reminders |
| POST /products/:id/inventory-lots | yes | Creates lot + purchase movement |
| POST /inventory/adjustments | yes | Creates movement + updates lot |
| POST /ai/suggestions/:id/accept | yes | Marks suggestion + creates business records |
| POST /tasks | yes | Creates task + resolved targets; planned tasks also create reminders |
| POST /problems | yes | Creates problem metadata |
| POST /problems/:id/photos | yes for metadata | File upload may be outside DB transaction |

---

# 26. Frontend/backend compatibility rules

## 26.1 Frontend must not assume generated side effects
After transactional endpoints, frontend should use returned generated side effects or refetch detail.

## 26.2 Backend must return enough detail after critical mutations
Critical mutation responses should include enough information to show the user what happened.

Examples:
- create activity returns inventory/quarantine/task effects
- confirm task returns reminders
- accept AI suggestion returns created entity ids

## 26.3 Frontend must not calculate business truth
Frontend may display summaries but must not:
- decide inventory consumption allocation
- decide quarantine creation
- decide suggested task creation
- decide weather rain confirmation consequences

## 26.4 Backend must preserve user intent
Bulk target scopes must be accepted as user intent and resolved into concrete target rows on backend.

## 26.5 MCP/API compatibility rules
MCP tools may expose canonical API behavior, but they must not redefine it.

Safe initial API surfaces for MCP read tools:
- `GET /health`
- `GET /places`
- `GET /places/:placeId`
- `GET /plants`
- `GET /places/:placeId/beds`
- `GET /places/:placeId/perennials`
- `GET /products`
- `GET /inventory`
- `GET /tasks`
- `GET /calendar`

Controlled mutation surfaces for later MCP tools:
- `POST /tasks/:taskId/confirm`
- `POST /tasks/:taskId/dismiss`
- `POST /weather/events/:weatherEventId/confirm-rain`
- `POST /activities`

Mutation endpoints used by MCP must return enough structured data for agents and clients to show side effects:
- created/updated entity ids
- reminders created
- inventory effects
- quarantine periods
- suggested tasks
- warnings
- backend request/correlation id where available

MCP must not invent non-contract endpoints. If an MCP tool needs backend behavior missing from this contract, document the gap as an open decision or explicit API contract change before implementation.

---

# 27. Idempotency and duplicate submission rules

## 27.1 v1 baseline
For v1, normal UI should prevent duplicate submissions by disabling buttons during in-flight requests.

## 27.2 Recommended later improvement
Add optional `Idempotency-Key` header for critical mutation endpoints:
- POST /activities
- POST /tasks/:id/confirm
- POST /ai/suggestions/:id/accept
- POST /inventory/adjustments

Not mandatory for initial v1 unless implementation time allows.

---

# 28. Security rules

## 28.1 Account scoping
Every resource read/write must be scoped to authenticated account.
Backend derives authenticated actor/account context server-side from a validated Supabase Auth JWT.
Frontend must not provide trusted `accountId` for normal application operations.

## 28.2 Cross-resource validation
Backend must verify:
- target belongs to account
- target belongs to place where applicable
- product rule belongs to product
- inventory lot belongs to product
- AI suggestion belongs to account through session

## 28.3 File access
Problem photo URLs should be:
- signed URLs, or
- protected API URLs

Do not expose public bucket listing.
Problem photos are stored in self-hosted Supabase Storage through backend `StoragePort`; the database stores metadata only.

## 28.4 Supabase key boundary
Supabase service role key is backend-only.
It must never be exposed to frontend code, browser storage, public config, logs, or client-visible error messages.

---

# 29. API implementation priority

Recommended implementation order:

1. Health
2. Places
3. Plants
4. Perennials
5. Beds
6. Persistent bed plants
7. Yearly plantings
8. Products
9. Product usage rules
10. Inventory
11. Activities
12. Problems/photos
13. Tasks
14. Calendar
15. Dashboard
16. Push
17. Weather
18. AI

Critical path:
- Products + inventory + activities must be correct before AI/weather/push integrations.

---

# 30. Final API rules

The API must preserve these domain principles:

- backend owns business logic
- frontend never writes directly to database
- bulk targets are resolved backend-side
- inventory movement history is preserved
- AI output is not business truth until accepted
- weather informs but does not decide treatment validity
- suggested tasks require user confirmation before becoming planned tasks
- reminders exist only for planned tasks
- quarantine periods are generated from treatment/product rule context
- no hidden state should be treated as source of truth
- MCP tools expose only documented backend behavior and must not bypass the canonical API/service boundary

This document is the canonical API contract for Gardening Helper v1.
