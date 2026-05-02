# User Story — Frontend Phase 1: API Endpoints Integration

## Story
As a frontend developer, I want to implement a clean service layer for Farm/Coop/Lot endpoints
so that the app can communicate with backend CRUD APIs before adding MobX flows.

---

## Scope
Included:
- Service files for Farm, Coop, Lot endpoints
- Shared request/response DTO types
- Error normalization and status mapping
- No UI screens and no store logic

Excluded:
- MobX stores
- Screen wiring
- Navigation updates
- Offline sync queue

---

## Files to Create/Update

Create:
- `mobile/src/services/types.ts`
- `mobile/src/services/farms.api.ts`
- `mobile/src/services/coops.api.ts`
- `mobile/src/services/lots.api.ts`

Reuse:
- `mobile/src/services/api.ts` (existing axios instance)

---

## Endpoint Contracts to Integrate

### Farms
- `POST /farms`
- `GET /farms`
- `GET /farms/:farmId`
- `PATCH /farms/:farmId`
- `DELETE /farms/:farmId`

### Coops
- `POST /farms/:farmId/coops`
- `GET /farms/:farmId/coops`
- `GET /coops/:coopId`
- `PATCH /coops/:coopId`
- `DELETE /coops/:coopId`

### Lots
- `POST /coops/:coopId/lots`
- `GET /coops/:coopId/lots`
- `GET /lots/:lotId`
- `PATCH /lots/:lotId`
- `POST /lots/:lotId/close`
- `DELETE /lots/:lotId`

---

## Type Requirements

In `types.ts`, define:
- `ApiSuccess<T> = { success: true; data: T }`
- `ApiFailure = { success: false; error: string }`
- `ApiResponse<T> = ApiSuccess<T> | ApiFailure`
- Domain DTOs:
  - `Farm`, `CreateFarmDto`, `UpdateFarmDto`
  - `Coop`, `CreateCoopDto`, `UpdateCoopDto`
  - `Lot`, `CreateLotDto`, `UpdateLotDto`
- Optional pagination wrapper if backend provides it.

---

## Error Handling Rules

- Normalize backend errors in one helper inside each service or shared helper:
  - `400` => validation message
  - `401` => unauthorized
  - `404` => not found
  - `409` => conflict
  - fallback => generic error
- Throw typed errors or return normalized error objects consistently.
- Do not show UI toasts/snackbars in service layer.

---

## Acceptance Criteria

- [ ] All Farm endpoints are available as typed async methods in `farms.api.ts`
- [ ] All Coop endpoints are available as typed async methods in `coops.api.ts`
- [ ] All Lot endpoints are available as typed async methods in `lots.api.ts`
- [ ] Shared DTO/types are centralized in `types.ts`
- [ ] Response parsing uses backend shape `{ success, data | error }`
- [ ] Error normalization works for `400/401/404/409/500`
- [ ] No MobX store code added
- [ ] No screen/navigation code added

---

## Out of Scope
- Store state management
- UI forms and validation messages
- Pull-to-refresh, loading skeletons
- i18n integration

---

## Definition of Done
Service layer is fully typed and ready for consumption by MobX stores in Phase 2, with all Farm/Coop/Lot endpoint methods working and consistent error mapping.
