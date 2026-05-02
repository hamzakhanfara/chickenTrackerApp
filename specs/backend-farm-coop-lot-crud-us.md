# User Story — Backend CRUD: Farm / Coop / Lot

## Story
As a backend developer, I want to implement secured CRUD APIs for `Farm`, `Coop`, and `Lot`
so that authenticated users can manage their poultry structure (`User -> Farm -> Coop -> Lot`) and start operations.

---

## Preconditions
- Prisma schema and migration from [specs/backend-database-prisma-us.md](specs/backend-database-prisma-us.md) are already implemented and applied.
- Auth middleware is already available and provides authenticated `userId` on request context.

---

## Scope
Included:
- REST CRUD endpoints for `Farm`, `Coop`, `Lot`
- Ownership checks (user can only access own farms/coops/lots)
- Zod validation for request body/params/query
- Pagination for list endpoints
- Business rule guard: one active lot per coop

Excluded:
- DailyEntry/Vaccine/Treatment/LotClosure routes
- KPI/analytics endpoints
- Role-based admin panel behavior

---

## Functional Requirements

### 1) Farm Endpoints
- `POST /farms`
- `GET /farms`
- `GET /farms/:farmId`
- `PATCH /farms/:farmId`
- `DELETE /farms/:farmId`

Rules:
- Create farm linked to authenticated user only.
- List/get/update/delete only farms owned by authenticated user.
- Delete farm blocked if farm still has coops (or perform soft-delete if chosen; default = block with 409).

### 2) Coop Endpoints
- `POST /farms/:farmId/coops`
- `GET /farms/:farmId/coops`
- `GET /coops/:coopId`
- `PATCH /coops/:coopId`
- `DELETE /coops/:coopId`

Rules:
- Coop must be created under a farm owned by authenticated user.
- Access/update/delete only if coop belongs to user through farm ownership.
- Delete coop blocked if coop has any lot (default = block with 409).

### 3) Lot Endpoints
- `POST /coops/:coopId/lots`
- `GET /coops/:coopId/lots`
- `GET /lots/:lotId`
- `PATCH /lots/:lotId`
- `POST /lots/:lotId/close` (domain action)
- `DELETE /lots/:lotId` (allowed only when status = `cancelled` and no dependent records)

Rules:
- Only owner can manage lots.
- Enforce max one `active` lot per coop.
- `close` endpoint sets `status=closed`; `closed` lot cannot return to `active`.
- `startDate <= targetEndDate` if target date provided.
- `initialChickCount > 0`.

---

## Validation Requirements (Zod)

### Farm DTOs
- `name`: string, min 2
- `region`: string, min 2
- `city`: string, min 2
- `address`: optional string

### Coop DTOs
- `name`: string, min 1
- `capacity`: int, > 0
- `areaM2`: number, > 0
- `buildingType`: enum(`open`, `semi_closed`, `closed`)

### Lot DTOs
- `code`: string, min 3
- `breed`: enum(`ROSS_308`, `COBB_500`, `HUBBARD`, `OTHER`)
- `sourceSupplier`: optional string
- `startDate`: date string
- `targetEndDate`: optional date string
- `initialChickCount`: int, > 0
- `initialAvgWeightG`: optional int, >= 0
- `status`: default `active` on create

---

## Ownership and Security
- All endpoints require auth middleware.
- Never trust incoming `userId` from body.
- Ownership chain checks:
  - Farm owner = request user
  - Coop belongs to farm owner
  - Lot belongs to coop -> farm -> owner
- On unauthorized resource access, return `404` (not `403`) to avoid resource enumeration.

---

## API Contracts (Response Shape)
All responses follow:
```json
{ "success": true, "data": {} }
```
or
```json
{ "success": false, "error": "message" }
```

### Create Farm
`POST /farms`
```json
// Request
{ "name": "Farm Benslimane", "region": "Casablanca-Settat", "city": "Benslimane" }

// Response 201
{ "success": true, "data": { "id": "...", "name": "Farm Benslimane" } }
```

### Create Coop
`POST /farms/:farmId/coops`
```json
// Request
{ "name": "Coop A", "capacity": 12000, "areaM2": 850, "buildingType": "semi_closed" }
```

### Create Lot
`POST /coops/:coopId/lots`
```json
// Request
{
  "code": "LOT-2026-001",
  "breed": "ROSS_308",
  "startDate": "2026-05-01",
  "targetEndDate": "2026-06-12",
  "initialChickCount": 10000,
  "initialAvgWeightG": 42
}
```

### Close Lot
`POST /lots/:lotId/close`
```json
// Response 200
{ "success": true, "data": { "id": "...", "status": "closed" } }
```

---

## Error Handling
- `400` invalid input
- `401` unauthenticated
- `404` resource not found (or not owned)
- `409` conflict:
  - duplicate lot code
  - active lot already exists for coop
  - delete blocked due to dependencies
- `500` unexpected server error

---

## Implementation Structure

Expected files:
```
backend/src/
├── routes/
│   ├── farms.ts
│   ├── coops.ts
│   └── lots.ts
├── controllers/
│   ├── farms.controller.ts
│   ├── coops.controller.ts
│   └── lots.controller.ts
├── services/
│   ├── farms.service.ts
│   ├── coops.service.ts
│   └── lots.service.ts
├── validators/
│   ├── farm.validator.ts
│   ├── coop.validator.ts
│   └── lot.validator.ts
```

---

## Acceptance Criteria
- [ ] All Farm endpoints implemented and protected
- [ ] All Coop endpoints implemented and protected
- [ ] All Lot endpoints implemented and protected
- [ ] Ownership checks enforced on every resource access
- [ ] Zod validation implemented for create/update payloads
- [ ] Pagination works on list endpoints (`page`, `limit`)
- [ ] One-active-lot-per-coop rule enforced at API layer (and DB layer already exists)
- [ ] Consistent API response format used everywhere
- [ ] No DailyEntry/Vaccine/Treatment routes added
- [ ] Postman/HTTP test collection updated with happy + error paths

---

## Out of Scope
- DailyEntry CRUD
- VaccinePlan/VaccineEvent CRUD
- Treatment CRUD
- LotClosure detailed financial write model
- KPI aggregation endpoints
- Soft delete strategy across all entities

---

## Definition of Done
Authenticated user can fully manage their farms, coops, and lots with secure ownership,
validations, and enforced domain constraints, ready for next story: DailyEntry CRUD + KPI read endpoints.
