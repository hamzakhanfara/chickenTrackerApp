# User Story — Lot Closing + Coop Lot History (Active + Closed)

## Story
As a farmer, I want to close a lot with an explicit confirmation, and then access a full lot history per coop (active + closed lots), so I can complete the production cycle and review performance immediately.

---

## Objective
Implement lifecycle completion and history browsing with these outcomes:
1. User can **finish/close a lot now** (for testing and real usage).
2. Closing requires a **confirmation step**.
3. Each coop exposes a **Lots List** containing both active and closed lots.
4. Selecting any lot opens a **Lot Detail** page with stats.
5. **Daily Entry is blocked** for closed lots.

---

## Scope
Included:
- Backend endpoint/service logic to close a lot
- Frontend action to close lot from Lot Detail
- Confirmation modal before closing
- Coop-level lot list screen with active + closed items
- Lot detail behavior for active vs closed lots
- Daily Entry restrictions for closed lots (UI + service guard behavior)

Excluded:
- Reopening a closed lot
- Editing historical daily entries (unless already supported)
- Advanced analytics/charts beyond existing KPI cards

---

## Functional Flow

### A) Close Lot (Immediate)
1. User opens active `LotDetailScreen`.
2. User taps `Close Lot / Clôturer le lot / إنهاء الدورة`.
3. Confirmation dialog appears:
   - Title: Confirm close lot
   - Message: irreversible warning + no more daily entries
   - Actions: `Cancel` and `Confirm Close`
4. On confirm:
   - call backend close-lot endpoint
   - mark lot status as `CLOSED`
   - set `closedAt` timestamp/date
5. UI updates immediately:
   - lot appears as closed
   - Daily Entry CTA disabled/hidden
   - coop status chip recalculated

### B) Coop Lots History
1. From `CoopsListScreen`, tap a coop card.
2. Navigate to `CoopLotsListScreen` (or existing lots list by coop).
3. Screen shows all lots for this coop:
   - active lot(s)
   - closed lot history
4. User can filter tabs/chips (recommended): `All`, `Active`, `Closed`.
5. Tap a lot item to open `LotDetailScreen`.

### C) Lot Detail by Status
- **Active lot detail**:
  - show progress + KPI
  - show `Add Daily Entry`
  - show `Close Lot` action
- **Closed lot detail**:
  - show historical summary/KPI snapshot
  - hide or disable `Add Daily Entry`
  - show read-only closed badge/date

---

## Backend Requirements

### Endpoint(s)
Use existing architecture patterns.

Minimum required:
- `PATCH /api/lots/:lotId/close`
  - marks lot as closed
  - idempotent-safe behavior recommended

Existing list endpoint should support history view:
- `GET /api/coops/:coopId/lots` (must return active + closed, with status)

### Business Rules
1. Only lot owner scope (via farm/coops ownership) can close lot.
2. Cannot close an already closed lot (return clear 400/409 or safe no-op).
3. After closed, daily entry creation must be rejected (`400` or `409`).
4. Preserve historical entries and KPI computation data.

### Error Mapping
- 400 invalid action/state
- 401 unauthorized
- 403 forbidden
- 404 lot not found
- 409 conflict (already closed)
- 500 internal

---

## Frontend Requirements

### Stores/Services
Reuse existing layers:
- `lots.api.ts`: add `closeLot(lotId)`
- `LotStore`: add `closeLot(lotId)` action + state refresh
- `DailyEntryStore`/screen logic: prevent create when lot is closed

### Screens
1. `LotDetailScreen`
   - close button visible only for active lots
   - confirmation modal required
   - closed state rendering
2. `CoopLotsListScreen` (or existing lots list route)
   - list all coop lots with status chip and key stats
   - support active/closed differentiation
3. `CoopsListScreen`
   - tap behavior routes to coop lots history list

### UI Rules
- keep same design language as existing forms/screens
- status chips:
  - Active: green
  - Closed: gray
- closed lot cards should remain clear/readable but visually less prominent than active

---

## Data Display (Coop Lots List)
Each lot item should include at least:
- lot code
- breed/souche
- start date
- closed date (if closed)
- status chip (`Active`/`Closed`)
- quick KPI summary if available (mortality, IC, birds alive/final)

---

## Acceptance Criteria
- [ ] User can close an active lot immediately from Lot Detail
- [ ] Closing a lot requires explicit confirmation modal
- [ ] After closing, lot status becomes `CLOSED` and persists after refresh
- [ ] Daily Entry creation is blocked for closed lots (UI + API behavior)
- [ ] Selecting a coop opens a lots list containing active and closed lots
- [ ] User can open details for both active and closed lots
- [ ] Closed lot detail is read-only for daily entry actions
- [ ] Coop/lots status chips and list states are consistent after close action
- [ ] No unrelated refactors; existing architecture reused

---

## Definition of Done
Farmers can complete a lot lifecycle in-app (with confirmation), immediately validate the closed state, and browse full per-coop lot history with proper active/closed behavior.

---

## Prompt to Use in Agent Mode
Read `specs/frontend-backend-lot-close-and-coop-history-us.md` and implement exactly.

Implementation order:
1. Backend close-lot endpoint/service rules.
2. Frontend service/store integration for `closeLot`.
3. Lot Detail close action with confirmation modal.
4. Coop lots list history view (active + closed) and navigation wiring.
5. Closed lot restrictions for Daily Entry.

Constraints:
- Reuse current API/store/navigation patterns.
- Keep UI consistent with current app design and `/Maquette` references when applicable.
- Return changed files and a checklist mapped to each acceptance criterion.