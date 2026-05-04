# User Story — Alerts Engine (Backend + Frontend, Check-Then-Implement)

## Story
As a farm manager, I want actionable alerts (tasks due, missing daily entry, high mortality) so I can react early and protect lot performance.

---

## Important Implementation Rule
Before coding new logic, the implementer must:
1. Audit existing alerts functionality in backend and frontend.
2. Reuse what already exists.
3. Implement only missing pieces.

No duplicate modules or parallel implementations.

---

## Objective
Deliver reliable alerting for core operations:
1. Task due today/tomorrow
2. Missing daily entry
3. High mortality threshold

Expose alerts in backend and render on frontend surfaces (Home + Lot Detail).

---

## Scope
Included:
- existence audit + gap analysis
- backend alert generation/query logic
- frontend API/store integration
- UI cards/lists for alerts on Home and Lot Detail
- mark-as-read/dismiss support (if absent)

Excluded:
- push notifications (FCM/WhatsApp)
- advanced ML predictions

---

## Alert Types (MVP)
1. `TASK_DUE`
   - task scheduled today or tomorrow
2. `MISSING_DAILY_ENTRY`
   - no daily entry for active lot on expected day
3. `HIGH_MORTALITY`
   - mortality rate exceeds threshold (default 0.5% daily, configurable)

Severity:
- `INFO`, `WARNING`, `CRITICAL`

---

## Part 1 — Discovery (Required First)
Create a quick checklist in implementation notes:
- Existing DB model for alerts? yes/no
- Existing routes/controllers/services? yes/no
- Existing frontend API/store? yes/no
- Existing UI placement on Home/LotDetail? yes/no

Then implement only missing items.

---

## Part 2 — Backend

### If missing, add minimal model(s)
Suggested model:
- `Alert`
  - id
  - userId
  - farmId (optional)
  - coopId (optional)
  - lotId (optional)
  - type
  - severity
  - title
  - message
  - metadata (json optional)
  - isRead
  - createdAt

If model already exists, extend only what is necessary.

### Endpoints (reuse if already available)
- `GET /api/alerts`
  - filters: unreadOnly, severity, farmId, lotId, type
- `PATCH /api/alerts/:id/read`
- `PATCH /api/alerts/read-all` (optional)

### Generation logic
- Task due alert: from calendar tasks date window
- Missing daily entry: active lots without entry for expected day
- High mortality: from latest daily entry + alive count baseline

### Rules
- Avoid duplicate alerts for same entity/type/day (idempotency)
- Ownership checks by farm chain
- Normalize errors: 400/401/403/404/500

---

## Part 3 — Frontend

### API
Add/reuse in alerts API file:
- `getAlerts(params)`
- `markAlertRead(alertId)`
- `markAllAlertsRead()` (if endpoint exists)

### Store
Create/extend `AlertStore`:
- state: `alerts`, `unreadCount`, `isLoading`, `error`
- actions:
  - `fetchAlerts(params)`
  - `markRead(id)`
  - `markAllRead()`
  - `refreshUnreadCount()`

Register in root store if missing.

### UI Surfaces
1. Home screen
   - alerts panel
   - show top 3 latest alerts + link to view all
2. Lot detail screen
   - lot-scoped alerts section

Card style:
- warning/orange for due/missing
- critical/red for high mortality
- clear timestamp and context

---

## Design Requirements
- Follow existing design tokens and card system
- High legibility, compact and scannable
- Touch targets >= 48px

---

## Acceptance Criteria
- [ ] Existing alerts pieces are audited first; only missing pieces are implemented
- [ ] Backend returns alerts for due tasks, missing entry, and high mortality
- [ ] Duplicate same-day alerts are prevented
- [ ] Home screen displays alerts with correct severity styling
- [ ] Lot detail displays lot-specific alerts
- [ ] Read/unread behavior works and unread count updates
- [ ] Error/loading states are handled
- [ ] No duplicate architecture introduced

---

## Definition of Done
Users receive clear, deduplicated operational alerts in Home and Lot Detail, with reliable read/unread behavior and minimal changes on top of existing code.

---

## Prompt to Use in Agent Mode
Read `specs/alerts-engine-backend-frontend-us.md` and implement exactly.

Hard rules:
1. First audit what already exists (backend + frontend) and list gaps.
2. Reuse existing pieces; implement only missing functionality.
3. Deliver alerts for task due, missing daily entry, and high mortality.
4. Surface alerts on Home and Lot Detail.
5. Keep architecture consistent and avoid unrelated refactors.
6. Return changed files plus checklist mapped to acceptance criteria.