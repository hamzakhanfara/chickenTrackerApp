# User Story — Lot Expenses (DB + Backend + Frontend in Daily Entry Page)

## Story
As a farm manager, I want to record lot-level expenses (with optional fields and per-chick or total entry mode), so I can calculate real production cost and profitability for each lot.

---

## Objective
Add a full Expenses feature linked to a lot, including:
1. **Database model** (Prisma) for lot expenses
2. **Backend services + API** for create/update/read
3. **Frontend store** integration
4. **Frontend UI** inside Daily Entry page as a second form section (accordion)

The current Daily Entry form must remain unchanged.

---

## Business Rules
1. Expenses are related to a **lot**.
2. All expense fields are **optional**.
3. Data entry mode must be selectable:
   - `PER_CHICK` (unit cost per chick)
   - `TOTAL` (global total amount)
4. Additional expenses must support custom named lines:
   - `label` (required for line)
   - `amount` (required for line)
5. Amounts cannot be negative.
6. User can save with partial fields (only what they know now).
7. Existing values can be edited later.

---

## Expense Categories (MVP)
Optional numeric fields:
- chickPrice
- vaccinationExpense
- coopExpense
- farmerExpense
- gasExpense
- waterExpense
- feedExpense

Additional dynamic items (0..n):
- additionalExpenses[]
  - name/label
  - amount

Currency:
- keep existing app currency conventions (MAD default if already used)

---

## Part 1 — Prisma / Database

### Required Schema Additions
Add minimal schema consistent with current conventions.

#### Enum
- `ExpenseEntryMode`
  - `PER_CHICK`
  - `TOTAL`

#### Model (recommended)
`LotExpense`
- `id` (uuid)
- `lotId` (unique, 1:1 with lot)
- `entryMode` (enum, default `TOTAL`)
- optional decimals for all fixed categories:
  - `chickPrice`
  - `vaccinationExpense`
  - `coopExpense`
  - `farmerExpense`
  - `gasExpense`
  - `waterExpense`
  - `feedExpense`
- timestamps: `createdAt`, `updatedAt`

`LotAdditionalExpense`
- `id` (uuid)
- `lotExpenseId` (FK)
- `label` (string)
- `amount` (decimal)
- timestamps

### Constraints
- 1 lot => 1 lotExpense record (`lotId` unique)
- cascade delete additional items with parent expense record
- non-negative checks at service/validator layer

### Migration
- create migration for new enum/model(s)
- regenerate Prisma client

---

## Part 2 — Backend (Service/API)

### Endpoints (MVP)
- `GET /api/lots/:lotId/expenses`
  - return lot expenses (and additional lines)
- `PUT /api/lots/:lotId/expenses`
  - upsert full expense payload for lot
  - allows partial fields and replacement of additional lines

Optional if useful:
- `PATCH /api/lots/:lotId/expenses` (partial update)

### Payload (PUT)
- `entryMode`: `PER_CHICK | TOTAL`
- optional fixed category amounts
- `additionalExpenses`: optional array of `{ label, amount }`

### Validation
- `entryMode` required
- all numeric amounts `>= 0`
- additional expense `label` non-empty (trimmed), max length reasonable (e.g., 80)
- additional `amount >= 0`

### Authorization
- lot must belong to authenticated user scope (farm ownership chain)

### Error Mapping
- 400 validation/business
- 401 unauthorized
- 403 forbidden
- 404 lot not found
- 500 internal

### Backend Deliverables
- route file
- controller file
- service file
- validator file
- route registration in app bootstrap
- prisma schema + migration

---

## Part 3 — Frontend (API + Store)

### API Layer
Create/update expense API service using existing axios client:
- `getLotExpenses(lotId)`
- `upsertLotExpenses(lotId, payload)`

### Store Layer
Add `LotExpenseStore` (or integrate in existing lot store if architecture prefers), with:
- state:
  - `expenseByLotId`
  - `isLoading`
  - `isSubmitting`
  - `error`
- actions:
  - `fetchLotExpenses(lotId)`
  - `saveLotExpenses(lotId, payload)`
  - `resetError()`

Register in `RootStore`.

---

## Part 4 — Frontend UI (Daily Entry Page)

## UX Requirement
Keep existing Daily Entry form exactly as-is.
Add a second action/section for expenses.

### Interaction Model
- On Daily Entry page, add button:
  - `Expenses / Dépenses / المصاريف`
- On click, expand accordion panel (or collapsible card)
- Inside accordion, show expense form

### Expense Form Fields
- Entry Mode selector (segmented/chips/radio):
  - Per Chick
  - Total
- Optional amount fields for each category
- Additional expenses repeater:
  - add line button
  - each line = Name + Amount
  - remove line button

### Submission
- Save button inside expense accordion/card
- On save:
  - validate
  - call store `saveLotExpenses`
  - show success feedback
- Form should preload existing values using `fetchLotExpenses(lotId)`

### UX Details
- all inputs optional except mode
- numeric keyboard for amount fields
- prevent negative values
- maintain same style as existing forms:
  - spacing, cards, typography, colors, rounded inputs/buttons

---

## Suggested Files
### Backend
- `backend/prisma/schema.prisma`
- `backend/src/routes/lotExpenses.routes.ts`
- `backend/src/controllers/lotExpenses.controller.ts`
- `backend/src/services/lotExpenses.service.ts`
- `backend/src/validators/lotExpense.validator.ts`
- `backend/src/index.ts` (route registration)

### Frontend
- `frontend/src/services/api/lotExpenses.api.ts`
- `frontend/src/stores/LotExpenseStore.ts` (or extension of existing lot store)
- `frontend/src/stores/RootStore.ts`
- `frontend/src/screens/CreateDailyEntryScreen.tsx` (add expenses accordion)
- optional reusable inputs/components for dynamic expense lines

---

## Acceptance Criteria
- [ ] Prisma schema includes lot expenses with per-chick/total mode
- [ ] Migration runs and Prisma client is generated
- [ ] Backend exposes GET and PUT lot expenses endpoints
- [ ] All expense fields are optional and accept partial saves
- [ ] Additional expenses support dynamic named lines with amount
- [ ] Frontend API + store integrated with existing architecture
- [ ] Daily Entry page keeps current form unchanged
- [ ] Daily Entry page includes Expense button + accordion form
- [ ] Expense form supports mode selection and optional category fields
- [ ] Existing expenses preload and can be edited
- [ ] Validation/error handling works (no negative numbers, clean API errors)
- [ ] UI matches current app form style

---

## Definition of Done
A user can open Daily Entry page, expand Expenses section, choose `Per Chick` or `Total`, enter any subset of expense categories plus custom additional lines, save successfully, and reopen later to edit the same lot expenses.

---

## Prompt to Use in Agent Mode
Read `specs/lot-expenses-backend-frontend-us.md` and implement it exactly.

Implementation order:
1. Prisma schema + migration for lot expenses.
2. Backend lot expense module (routes/controllers/services/validators).
3. Frontend API service + store integration.
4. Daily Entry page update: keep existing form unchanged, add Expenses button + accordion form.
5. Preload/edit/save flow with proper validation and error handling.

Constraints:
- Reuse existing architecture patterns.
- Keep TypeScript strict and no unrelated refactors.
- Return changed files and a checklist mapped to each acceptance criterion.