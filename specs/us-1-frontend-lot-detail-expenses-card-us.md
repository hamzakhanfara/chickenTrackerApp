# User Story — Frontend: Expenses Card on Lot Detail Page

## Story
As a farm manager, I want to see a dedicated Expenses card on the Lot Detail page, so I can quickly understand the lot’s cost structure without opening the Daily Entry expenses form.

---

## Objective
Add a new **Expenses** section/card in `LotDetailScreen` that displays saved lot expenses (fixed categories + additional lines) and key totals, using existing backend/frontend expense data.

---

## Scope
Included:
- Expenses card UI in Lot Detail screen
- Data binding from existing lot expenses service/store
- Summary totals and breakdown display
- Proper empty/loading/error states
- Style consistency with current Lot Detail design

Excluded:
- Editing expenses directly from Lot Detail (view-only for this story)
- Creating new backend endpoints
- Major refactor of lot detail layout

---

## Dependencies
- Existing lot expenses backend endpoints (`GET /api/lots/:lotId/expenses`)
- Existing frontend API/store for lot expenses
- Existing `LotDetailScreen`

---

## Functional Requirements

### FR-1: Card Placement
- Add `Expenses` card in `LotDetailScreen` under KPI/progress section (or where maquette indicates).
- Card title:
  - `Dépenses / المصاريف`

### FR-2: Data Source
- On lot detail load, fetch expense data for `lotId` via store action (`fetchLotExpenses(lotId)` or equivalent).
- Use cached value if already present and refresh in background if current architecture supports.

### FR-3: Fields to Display
Show, when available:
- Entry mode chip:
  - `Par poussin` (`PER_CHICK`) or `Total`
- Fixed categories (only non-null values):
  - chickPrice
  - vaccinationExpense
  - coopExpense
  - farmerExpense
  - gasExpense
  - waterExpense
  - feedExpense
- Additional expenses list:
  - each line as `label — amount`

### FR-4: Totals
Display at least:
- `Total Expenses` (sum of all fixed categories + additional lines)
- If mode is `PER_CHICK` and lot initial count exists:
  - compute and display estimated global total = `perChickTotal × birdCount`

### FR-5: Empty State
If no expenses saved yet:
- show compact empty state inside card:
  - text: `Aucune dépense enregistrée`
  - optional CTA: `Ajouter des dépenses` → navigates to Daily Entry expenses accordion context

### FR-6: Closed Lot Behavior
- Expenses card remains visible for closed lots (read-only historical data)
- No create/edit action required in this story

### FR-7: Error & Loading
- Loading: skeleton/placeholder lines in card
- Error: inline message + retry action

---

## UI/Design Requirements
- Must match existing Lot Detail style and design tokens from `DESIGN.md`:
  - white card container
  - rounded corners (8px)
  - soft shadow
  - consistent spacing (16px margins, 12px vertical rhythm)
  - Work Sans typography
- Use clear numeric formatting for currency (MAD if app default)
- Keep high readability and bilingual-ready labels

---

## Technical Requirements
- TypeScript strict mode
- no `any`
- reuse existing service/store architecture
- no backend change unless absolutely necessary

---

## Suggested Files
- `frontend/src/screens/LotDetailScreen.tsx`
- `frontend/src/stores/LotExpenseStore.ts` (if small extension needed)
- `frontend/src/stores/RootStore.ts` (only if injection is missing)
- Optional shared currency/format helpers

---

## Acceptance Criteria
- [ ] Lot Detail contains a dedicated Expenses card
- [ ] Card fetches and displays lot expenses for current `lotId`
- [ ] Fixed category values render only when present
- [ ] Additional expense lines are displayed correctly
- [ ] `Total Expenses` is calculated and shown correctly
- [ ] Empty state appears when no expenses exist
- [ ] Loading and error states are handled
- [ ] Card is visible for both active and closed lots
- [ ] UI is consistent with current Lot Detail design

---

## Definition of Done
A user opening Lot Detail can immediately view a clean and accurate expense breakdown and totals for the lot in a dedicated read-only card.

---

## Prompt to Use in Agent Mode
Read `specs/frontend-lot-detail-expenses-card-us.md` and implement it exactly.

Requirements:
1. Add a dedicated Expenses card to `LotDetailScreen`.
2. Reuse existing lot expenses API/store; do not duplicate fetch logic in the screen.
3. Show entry mode, available categories, additional lines, and total.
4. Implement clean loading/empty/error states.
5. Keep style aligned with current Lot Detail and `DESIGN.md`.
6. Do not perform unrelated refactors.
7. Return changed files and acceptance-criteria mapping.