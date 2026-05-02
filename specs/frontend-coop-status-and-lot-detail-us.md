# User Story — Frontend: Coop Active Status + Lot Detail Screen from `/Maquette/lot_detail`

## Story
As a farmer, I want a coop card to show `Active` when it contains an active lot, and when I open that coop I want to see a detailed active lot page (progress and KPIs), so I can quickly understand production status and make decisions.

---

## Context
Current issues to fix:
1. In Lots/Coops flow, after creating a lot inside a coop, the coop status chip still shows `Inactive`.
2. When a coop has an active lot, tapping the coop card should open a Lot Detail page.

Design reference for Lot Detail:
- `/Maquette/lot_detail/*`

Implementation must match the mockups in that folder as closely as possible.

---

## Objective
Implement 2 improvements:
1. **Fix coop status chip logic** (Inactive → Active when at least one active lot exists in the coop).
2. **Add Lot Detail screen** and navigation from coop card, with visual match to `/Maquette/lot_detail`.

---

## Mandatory Design Rule
Before coding Lot Detail screen, implementer must:
1. Open and review **all images** under `/Maquette/lot_detail`.
2. Reproduce layout, sections, spacing, and hierarchy as closely as possible.
3. Keep consistency with existing app style and tokens.

---

## Part A — Coop Status Chip Fix

### Functional Logic
- Coop card status is derived from lots data.
- A coop is **Active** if it has `>= 1` lot with status `ACTIVE`.
- A coop is **Inactive** if it has `0` active lots.

### Required Behavior
- Immediately after successful lot creation, coop list reflects updated status chip.
- If store already has lots/coops loaded, update state without requiring app restart.
- If needed, trigger refresh of:
  - coops list for selected farm
  - lots list for affected coop

### UI
- Chip label:
  - Active: `Actif / نشط`
  - Inactive: `Inactif / غير نشط`
- Active chip style follows success/green token.
- Inactive chip style follows neutral/gray token.

---

## Part B — Lot Detail Screen

### Navigation Rule
- On coop card tap:
  - If coop has an active lot: navigate to `LotDetailScreen` with active `lotId` (and context `coopId`, `farmId` if needed).
  - If no active lot: keep current behavior (or open empty lot state per existing flow).

### Screen Purpose
Display operational details for the active lot in that coop.

### Data to Show (MVP)
- Lot identity:
  - lot code
  - breed/souche
  - start date (mise en place)
  - current age `J+X`
- Progress block:
  - cycle progress indicator (days elapsed vs target cycle duration)
- KPI summary cards (using available backend data):
  - birds alive
  - total mortality
  - average IC
  - latest average weight
- Optional summary text/notes
- CTA button to add daily entry

If some KPI values are not yet available, render placeholders safely (no crash).

### Design Match Requirement
- Match `/Maquette/lot_detail` visuals (header, card grouping, KPI blocks, spacing, CTA placement).
- Respect `DESIGN.md` tokens:
  - deep green primary
  - orange accent
  - white cards, rounded corners, soft shadow
  - Work Sans
  - 16px side margins, 12px vertical card rhythm

---

## Services/Store Integration (Reuse Existing)
Do not add new backend endpoints unless absolutely required by existing API gaps.
Prefer reusing current services/stores:
- API services:
  - `frontend/src/services/api/coops.api.ts`
  - `frontend/src/services/api/lots.api.ts`
  - daily entries service if needed for latest metrics
- Stores:
  - `CoopStore`
  - `LotStore`
  - `DailyEntryStore` (if already implemented)

Expected store behaviors:
- helper/computed to determine `coopHasActiveLot`
- helper/computed to resolve active lot for coop
- refresh path after lot creation updates coop chip status

---

## Suggested Files
- `frontend/src/screens/CoopsListScreen.tsx` (chip logic + tap behavior)
- `frontend/src/screens/LotDetailScreen.tsx` (new or update)
- `frontend/src/stores/CoopStore.ts` (active status computation)
- `frontend/src/stores/LotStore.ts` (active lot lookup/refresh)
- `frontend/src/navigation/*` (route registration and params typing)
- Related UI components for chips/cards if shared

---

## Error/Loading States
- Lot detail loading skeleton based on existing style
- Friendly empty/error states if lot data unavailable
- Retry action for failed fetch

---

## Technical Constraints
- TypeScript strict mode
- no `any`
- no unrelated refactor
- maintain current architecture (service → store → screen)

---

## Acceptance Criteria
- [ ] After creating a lot in a coop, the coop status chip updates to `Active`
- [ ] Coop with no active lot displays `Inactive`
- [ ] Coop card tap opens `LotDetailScreen` when active lot exists
- [ ] `LotDetailScreen` consumes real store/service data and is stable with missing optional metrics
- [ ] Lot detail visuals closely match all images in `/Maquette/lot_detail`
- [ ] "Add Daily Entry" CTA is visible on lot detail screen
- [ ] Navigation params and route typing are correctly wired
- [ ] Loading, empty, and error states are handled cleanly

---

## Definition of Done
The coop list reflects true active/inactive status based on lot activity, and farmers can open a polished lot detail page (matching `/Maquette/lot_detail`) directly from active coop cards.

---

## Prompt to Use in Agent Mode
Read `specs/frontend-coop-status-and-lot-detail-us.md` and implement it exactly.

Important instructions:
1. First inspect every image in `/Maquette/lot_detail`.
2. Fix coop card status chip logic so it is based on real active lot state.
3. Ensure chip updates right after lot creation (refresh/store sync).
4. Add navigation from coop card to `LotDetailScreen` when active lot exists.
5. Build `LotDetailScreen` to closely match the maquette design.
6. Reuse existing services/stores; avoid backend changes unless strictly necessary.
7. Keep TypeScript strict and avoid unrelated refactors.
8. Return changed files and map each acceptance criterion to implementation proof.