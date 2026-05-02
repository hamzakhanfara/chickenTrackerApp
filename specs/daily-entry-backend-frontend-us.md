# User Story — Daily Entry (Backend + Frontend)

## Story
As a farmer, I want to add a daily entry for each active lot, so I can track mortality, feed, water, weight, and key performance indicators day by day.

---

## Objective
Implement Daily Entry in 2 coordinated parts:
1. **Backend part**: API/domain/service for Daily Entry CRUD (MVP focus: create + list by lot + get by date).
2. **Frontend part**: API integration in store + form screen to create entry, with same design style as existing forms.

---

## Part 1 — Backend (Services + API)

### Scope (Backend)
- Add Daily Entry module with:
  - validation
  - service layer
  - controller layer
  - routes layer
- Wire routes into backend app
- Ensure auth-protected access and ownership checks via farm/coop/lot relation

### Data Model Assumption
Use existing Prisma model for daily entries if already present.
If missing, add the model and migration in a minimal way consistent with current schema.

### Required Fields (MVP)
- `lotId` (UUID, required)
- `entryDate` (date-only or ISO day, required)
- `mortalityCount` (integer >= 0, required)
- `feedKg` (decimal >= 0, required)
- `waterLiters` (decimal >= 0, optional)
- `avgWeightGrams` (decimal > 0, optional)
- `notes` (string, optional, max 500)

### Business Rules
1. One entry per lot per date (unique constraint at DB + service guard)
2. Cannot create entry for closed lot
3. Entry date cannot be before lot start date
4. Optional: entry date cannot be in far future (e.g., > today + 1 day)
5. User can only act on lots belonging to their own farm hierarchy

### Backend Endpoints (MVP)
- `POST /api/lots/:lotId/daily-entries`
  - create a daily entry for lot
- `GET /api/lots/:lotId/daily-entries`
  - list entries by lot (default desc by entryDate, with pagination optional)
- `GET /api/lots/:lotId/daily-entries/:entryDate`
  - get a single entry by date

Optional (nice-to-have, if quick):
- `PATCH /api/daily-entries/:id`
- `DELETE /api/daily-entries/:id`

### Error Mapping
Normalize as current backend style:
- 400 validation/business rule errors
- 401 unauthorized
- 403 forbidden/ownership mismatch
- 404 lot or entry not found
- 409 duplicate entry for same lot/date
- 500 internal error

### Backend Deliverables
- Route file for daily entries
- Controller file
- Service file
- Validator/schema file
- Prisma schema/migration update if needed
- Route registration in app bootstrap
- Basic tests or manual test checklist (API examples)

---

## Part 2 — Frontend (Store + Form)

### Scope (Frontend)
- Add Daily Entry API client methods
- Add DailyEntry store/actions in MobX
- Add `CreateDailyEntryScreen` using `react-hook-form`
- Integrate navigation from lot card/button (existing "Add Entry")

### Frontend API Layer
In existing API service structure, add methods:
- `createDailyEntry(lotId, payload)`
- `getDailyEntriesByLot(lotId, params?)`
- `getDailyEntryByDate(lotId, entryDate)`

Use existing axios client and shared error normalization.

### Store Layer (MobX)
Create/update `DailyEntryStore` with:
- observable state:
  - `entriesByLot`
  - `isLoading`
  - `isSubmitting`
  - `error`
- actions:
  - `createEntry(lotId, payload)`
  - `fetchEntriesByLot(lotId)`
  - `fetchEntryByDate(lotId, entryDate)`
  - `resetError()`

Root integration:
- register store in `RootStore`
- expose computed/helpers as needed

### Form Screen
Screen: `CreateDailyEntryScreen`

Use `react-hook-form` with validation:
- `entryDate`: required
- `mortalityCount`: required, integer >= 0
- `feedKg`: required, number >= 0
- `waterLiters`: optional, number >= 0
- `avgWeightGrams`: optional, number > 0
- `notes`: optional, max 500

Submit flow:
1. Validate form
2. Build DTO
3. Call `dailyEntryStore.createEntry(lotId, payload)`
4. Disable submit + show loading while pending
5. On success:
   - show success feedback
   - refresh lot entries list (if applicable)
   - navigate back to lot details/home context

Error flow:
- show inline field errors + global API error banner/toast
- support 400/401/404/409/500/network user-friendly messages

---

## UI/Design Requirements (Same Style as Other Forms)
Must follow established app style + `DESIGN.md` tokens:
- card-based white form container
- rounded inputs/buttons (8px)
- deep green primary CTA
- orange secondary accents if needed
- spacing rhythm (16px horizontal margin, 12px between grouped blocks)
- min touch target 48px
- Work Sans typography
- bilingual-ready labels (FR/AR)
- keyboard-safe + scrollable form

Do not introduce a new visual language.

---

## Suggested Files
### Backend
- `backend/src/routes/dailyEntries.routes.ts`
- `backend/src/controllers/dailyEntries.controller.ts`
- `backend/src/services/dailyEntries.service.ts`
- `backend/src/validators/dailyEntry.validator.ts`
- `backend/src/index.ts` (route registration)
- `backend/prisma/schema.prisma` (+ migration if needed)

### Frontend
- `frontend/src/services/api/dailyEntries.api.ts`
- `frontend/src/stores/DailyEntryStore.ts`
- `frontend/src/stores/RootStore.ts`
- `frontend/src/screens/CreateDailyEntryScreen.tsx`
- `frontend/src/navigation/*` (route registration + params typing)
- `frontend/src/screens/HomeScreen.tsx` or lot-related screen (hook Add Entry CTA)

---

## Acceptance Criteria
- [ ] Backend Daily Entry endpoints implemented and protected by auth
- [ ] Duplicate lot/date entries prevented with 409 behavior
- [ ] Closed lot cannot receive new entry
- [ ] Frontend API methods added using existing axios client
- [ ] `DailyEntryStore` implemented and connected in `RootStore`
- [ ] `CreateDailyEntryScreen` built with `react-hook-form`
- [ ] Form styling consistent with existing Farm/Coop/Lot forms
- [ ] "Add Entry" navigation opens daily entry form with proper lot context
- [ ] Success refreshes data and returns user to relevant previous screen
- [ ] Error states are handled and user-friendly

---

## Definition of Done
A user can open Daily Entry form from a lot context, submit one valid daily entry per day, and see reliable API/store handling with the same visual and UX quality as existing forms.

---

## Agent Mode Prompt
Read `specs/daily-entry-backend-frontend-us.md` and implement it exactly.

Requirements:
1. Build backend Daily Entry module first (routes/controllers/services/validators + prisma update if needed).
2. Then build frontend integration (daily entries API + MobX store + form screen).
3. Use `react-hook-form` for form validation.
4. Reuse existing axios/error handling/store patterns.
5. Keep the UI style aligned with current forms and `DESIGN.md` tokens.
6. Wire Add Entry navigation from lot/home context.
7. Do not perform unrelated refactors.
8. Return a checklist mapped to each acceptance criterion and list changed files.