# User Story — Frontend: Coops & Lots Screens from `/maquette`

## Story
As a farmer, I want Coop and Lot screens that look like the validated mockups in `/maquette`,
so I can manage poulaillers and lots with a familiar, clear, and consistent interface.

---

## Context
Design references already selected by product:
- `maquette/coops_list_empty/*`
- `maquette/coops_list/*`
- `maquette/create_coop/*`
- `maquette/create_lot/*`

The implementation must visually match these images as closely as possible (layout, spacing, hierarchy, button placement, card structure, empty states), while respecting existing app architecture and reusable components.

---

## Objective
Implement the following frontend screens and flows:
1. `CoopsListScreen` (empty state + populated state)
2. `CreateCoopScreen`
3. `CreateLotScreen`

And connect them to existing services/stores/navigation.

---

## Mandatory Design Rule
Before coding each screen, the implementer must:
1. Open and review **all images** in each folder under `/maquette` listed above.
2. Extract common UI patterns (header, card, spacing, button style, form fields, empty-state block).
3. Build screens to be as visually similar as possible.

If an element is unclear in a mockup, keep consistency with existing Home/Farm design system and avoid inventing new styles.

---

## Functional Logic to Implement

### A) Coops List
- Input context: selected farm (`farmId`) from store/navigation params.
- On mount:
  - call `coopStore.fetchCoopsByFarm(farmId)` (or equivalent existing method)
- If no coops:
  - render `coops_list_empty` layout
  - show CTA button to create coop
  - CTA navigates to `CreateCoopScreen` with `farmId`
- If coops exist:
  - render list style matching `coops_list`
  - each card shows at minimum:
    - coop name/code
    - capacity
    - active lot indicator/count if available
  - card tap navigates to lots context (existing flow)

### B) Create Coop
- Form based on `create_coop` mockup.
- Use `react-hook-form`.
- Fields:
  - `name` (required)
  - `capacity` (required, numeric > 0)
  - `notes` (optional)
- Submit:
  - call existing coop service: `createCoop(farmId, payload)` (exact signature from current API layer)
  - loading state on submit button
  - prevent double submit
- Success:
  - refresh coops list (`coopStore.fetchCoopsByFarm(farmId)`)
  - navigate back to `CoopsListScreen`
- Errors:
  - map and show API errors (400/401/404/409/500 + network)

### C) Create Lot
- Form based on `create_lot` mockup.
- Use `react-hook-form`.
- Input context: `coopId` (and `farmId` if needed by current routing).
- Fields (MVP):
  - `code` (required)
  - `breed` (required)
  - `startDate` (required)
  - `initialCount` (required, integer > 0)
  - `notes` (optional)
- Submit:
  - call existing lot service: `createLot(coopId, payload)` (exact signature from current API layer)
  - loading state + disabled submit during request
- Success:
  - refresh relevant list/store (lots for coop)
  - navigate back to lots/coop context
- Errors:
  - normalize and show user-friendly API error messages

---

## Services & Store Usage (Must Reuse Existing Layer)
Do not create new backend routes.
Do not duplicate HTTP logic inside screens.

Use existing frontend layers already implemented:
- API services:
  - `frontend/src/services/api/coops.api.ts`
  - `frontend/src/services/api/lots.api.ts`
- Stores:
  - `frontend/src/stores/CoopStore.ts`
  - `frontend/src/stores/LotStore.ts`
  - `frontend/src/stores/RootStore.ts`

Screen responsibilities:
- UI rendering + form binding
- call store actions
- react to loading/success/error state

---

## UI/UX Requirements
- Match `/maquette` images closely.
- Keep bilingual-ready labels (FR/AR where available in app).
- Respect touch targets (>= 48px).
- Keep consistent with design tokens from `DESIGN.md`:
  - deep green primary actions
  - orange secondary/action accents
  - white card surfaces, soft shadows, rounded corners

---

## Navigation Requirements
- `CoopsListScreen` route exists and is reachable from Farms/Home flow.
- From empty/populated coops list → `CreateCoopScreen`.
- From coop context → `CreateLotScreen`.
- After successful create operations, navigation returns user to logical previous list with refreshed data.

---

## Technical Constraints
- TypeScript strict mode
- no `any`
- `react-hook-form` for create forms
- reuse existing shared components where possible
- avoid unrelated refactors

---

## Acceptance Criteria
- [ ] Implementer reviewed all images in `/maquette/coops_list_empty`, `/maquette/coops_list`, `/maquette/create_coop`, `/maquette/create_lot`
- [ ] `CoopsListScreen` visually matches empty + populated mockups
- [ ] Empty coops state CTA opens `CreateCoopScreen`
- [ ] `CreateCoopScreen` uses `react-hook-form` with required validations
- [ ] `CreateCoopScreen` uses existing coop service/store and refreshes list on success
- [ ] `CreateLotScreen` uses `react-hook-form` with required validations
- [ ] `CreateLotScreen` uses existing lot service/store and refreshes list on success
- [ ] API errors are displayed clearly
- [ ] Navigation between these screens works end-to-end
- [ ] No backend changes introduced

---

## Definition of Done
The user can navigate from coop empty/list states to creation forms, submit coop/lot creation successfully through existing services, and return to refreshed lists — with screens visually aligned to all selected `/maquette` designs.

---

## Prompt to Use in Agent Mode
Read `specs/frontend-coops-lots-screens-from-maquette-us.md` and implement it exactly.

Important instructions:
1. First, inspect every image in:
   - `/maquette/coops_list_empty`
   - `/maquette/coops_list`
   - `/maquette/create_coop`
   - `/maquette/create_lot`
2. Build the screens to closely match these designs.
3. Implement only the required frontend screens/flow for:
   - `CoopsListScreen` (empty + populated)
   - `CreateCoopScreen`
   - `CreateLotScreen`
4. Use `react-hook-form` for create forms.
5. Reuse existing API services and stores (`coops.api`, `lots.api`, `CoopStore`, `LotStore`).
6. Do not add new backend endpoints or unrelated refactors.
7. Ensure success refresh + navigation back to the proper list context.
8. Return a summary of changed files and what was implemented for each acceptance criterion.