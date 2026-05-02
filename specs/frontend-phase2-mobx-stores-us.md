# User Story — Frontend Phase 2: MobX Stores and Endpoint Flows

## Story
As a frontend developer, I want to implement MobX stores that consume the API service layer
so that Farm/Coop/Lot flows are centralized and ready to connect to screens.

---

## Preconditions
- Phase 1 API services are completed:
  - `farms.api.ts`, `coops.api.ts`, `lots.api.ts`, `types.ts`
- Auth token is already injected by axios interceptor in `api.ts`.

---

## Scope
Included:
- MobX stores for Farm/Coop/Lot
- Async flows for list/get/create/update/delete/close
- Loading/error state handling
- RootStore wiring

Excluded:
- Screen UI implementation
- Navigation wiring
- Offline queue/sync strategy
- Advanced caching

---

## Files to Create/Update

Create:
- `mobile/src/stores/FarmStore.ts`
- `mobile/src/stores/CoopStore.ts`
- `mobile/src/stores/LotStore.ts`

Update:
- `mobile/src/stores/RootStore.ts`

---

## Store Requirements

### Common State Pattern (all stores)
- `items: T[]`
- `selectedItem: T | null`
- `isLoading: boolean`
- `error: string | null`
- Optional list meta: `page`, `limit`, `total`

### Common Actions (all stores)
- `setLoading(value: boolean)`
- `setError(message: string | null)`
- `clearError()`

### FarmStore Flows
- `fetchFarms(params?)`
- `fetchFarmById(farmId)`
- `createFarm(payload)`
- `updateFarm(farmId, payload)`
- `deleteFarm(farmId)`

### CoopStore Flows
- `fetchCoopsByFarm(farmId, params?)`
- `fetchCoopById(coopId)`
- `createCoop(farmId, payload)`
- `updateCoop(coopId, payload)`
- `deleteCoop(coopId)`

### LotStore Flows
- `fetchLotsByCoop(coopId, params?)`
- `fetchLotById(lotId)`
- `createLot(coopId, payload)`
- `updateLot(lotId, payload)`
- `closeLot(lotId)`
- `deleteLot(lotId)`

---

## Flow Behavior Rules

- Every async action must:
  1) set loading true
  2) clear previous error
  3) call corresponding service endpoint
  4) update state (`items` / `selectedItem`) on success
  5) set normalized error on failure
  6) set loading false in `finally`

- On `401`, expose an error state usable by auth flow (no direct navigation in store).
- On `409`, preserve backend conflict message for UI display.

---

## RootStore Integration

- Instantiate and expose:
  - `farmStore`
  - `coopStore`
  - `lotStore`
- Keep constructor simple and dependency-safe.
- If needed, inject API modules into stores for testability.

---

## Acceptance Criteria

- [ ] `FarmStore` implements full CRUD flows using `farms.api.ts`
- [ ] `CoopStore` implements full CRUD flows using `coops.api.ts`
- [ ] `LotStore` implements list/create/update/close/delete using `lots.api.ts`
- [ ] Loading and error states are correctly managed in all async actions
- [ ] Conflict (`409`) and unauthorized (`401`) errors are preserved for UI handling
- [ ] `RootStore` exports all three stores
- [ ] No UI screen code added in this phase
- [ ] No navigation code added in this phase

---

## Out of Scope
- Screen-level form validation
- Screen-level toasts/snackbars
- Navigation redirection logic
- DailyEntry/Vaccine/Treatment stores

---

## Definition of Done
MobX stores provide complete, testable Farm/Coop/Lot endpoint flows and are ready to be consumed by UI screens in the next phase.
