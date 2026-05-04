# User Story — Calendar Tasks (DB + Backend + Frontend)

## Story
As a farm manager, I want a calendar where I can schedule and track lot-related tasks, and quickly create tasks from predefined templates, so I can plan operations day by day.

---

## Objective
Implement Calendar Tasks end-to-end in this order:
1. **Database (Prisma)**
2. **Backend services + API**
3. **Frontend API + MobX store**
4. **Frontend calendar/task screens**

UI must follow design references in:
- `/Maquette/calendar/*`

---

## Scope
Included:
- Task model linked to lot (and optionally farm/coop via lot relation)
- Predefined task templates stored in DB
- Create task from template or custom task
- Calendar views (at least month + selected day task list)
- Task status updates (`PENDING`, `DONE`, `CANCELED`)

Excluded:
- Push notifications/reminders (can be next US)
- Recurring rule engine (advanced)
- Team assignment permissions (single-user scope for now)

---

## Part 1 — Prisma / Database

### Enums
- `TaskStatus`: `PENDING`, `DONE`, `CANCELED`
- `TaskPriority` (optional but recommended): `LOW`, `MEDIUM`, `HIGH`

### Models

#### `TaskTemplate`
Used for predefined tasks selectable in create flow.
- `id` (uuid)
- `name` (string, required)
- `description` (string, optional)
- `defaultOffsetDays` (int, optional; from lot start date)
- `category` (string, optional; e.g. vaccine, treatment, control, feeding)
- `isActive` (boolean, default true)
- `createdAt`, `updatedAt`

#### `CalendarTask`
- `id` (uuid)
- `lotId` (FK required)
- `templateId` (FK optional)
- `title` (string, required)
- `description` (string, optional)
- `scheduledDate` (date required)
- `status` (`TaskStatus`, default `PENDING`)
- `priority` (`TaskPriority`, optional)
- `completedAt` (datetime optional)
- `createdAt`, `updatedAt`

### Constraints
- index on `scheduledDate`
- index on `(lotId, scheduledDate)`
- ownership enforced via lot->coop->farm chain in service layer

### Seed (recommended)
Add initial `TaskTemplate` records, e.g.:
- Vaccination J7
- Vaccination J14
- Weight control weekly
- Coop cleaning
- Feed stock check

---

## Part 2 — Backend (Services + API)

### Endpoints
#### Templates
- `GET /api/task-templates`
  - returns active templates

#### Calendar Tasks
- `POST /api/lots/:lotId/tasks`
  - create custom task or from template
- `GET /api/lots/:lotId/tasks`
  - list tasks for lot (supports date range filters)
- `GET /api/tasks/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&farmId=...`
  - aggregated tasks for calendar period
- `PATCH /api/tasks/:taskId/status`
  - update status (`PENDING|DONE|CANCELED`)
- `PATCH /api/tasks/:taskId`
  - edit title/description/date/priority (optional MVP+)
- `DELETE /api/tasks/:taskId`
  - delete task (optional MVP+)

### Create Payload
- `templateId` (optional)
- `title` (required if no template)
- `description` (optional)
- `scheduledDate` (required)
- `priority` (optional)

If `templateId` is provided, backend can default title/description from template if omitted.

### Business Rules
1. Task must belong to an owned lot.
2. `scheduledDate` required and valid.
3. If task status set to `DONE`, set `completedAt`.
4. If status moved away from `DONE`, clear `completedAt`.
5. Template must be active if used for creation.

### Error Mapping
- 400 validation/business errors
- 401 unauthorized
- 403 forbidden
- 404 not found (lot/task/template)
- 409 conflict (if needed)
- 500 internal

---

## Part 3 — Frontend (API + Store)

### API files
- `frontend/src/services/api/tasks.api.ts`
  - `getTaskTemplates()`
  - `createTask(lotId, payload)`
  - `getLotTasks(lotId, params?)`
  - `getCalendarTasks(params)`
  - `updateTaskStatus(taskId, status)`

### Store
Create `TaskStore.ts` with:
- state:
  - `templates`
  - `tasksByDate`
  - `tasksByLot`
  - `isLoading`, `isSubmitting`, `error`
- actions:
  - `fetchTemplates()`
  - `fetchCalendarTasks(range, farmId?)`
  - `fetchLotTasks(lotId)`
  - `createTask(lotId, payload)`
  - `setTaskStatus(taskId, status)`
  - `resetError()`

Register in `RootStore`.

---

## Part 4 — Frontend Screens (match `/Maquette/calendar`)

## Mandatory Design Rule
Before coding, inspect **all images** under `/Maquette/calendar/*` and replicate structure closely.

### A) Calendar Screen
- Month calendar view
- Markers/dots/badges on days with tasks
- Day selection shows task list below
- Filter chips (optional): `All`, `Pending`, `Done`
- CTA: `Add Task`

### B) Add Task Screen / Modal
- Choose lot (if not already scoped)
- Toggle source:
  - `From predefined task`
  - `Custom task`
- If predefined:
  - template picker/select
  - prefill title/description
- Inputs:
  - title
  - description
  - scheduled date
  - priority (optional)
- Submit button with loading state

### C) Task Item Actions
- Mark done / reopen
- Optional cancel
- Visual status chips:
  - Pending (orange/neutral)
  - Done (green)
  - Canceled (gray/red)

---

## UI/UX Requirements
- Follow existing design system and form behavior
- bilingual-ready labels (FR/AR)
- touch targets >= 48px
- keyboard-safe for forms
- consistent card styles with other app pages

---

## Suggested Files
### Backend
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts` (if used)
- `backend/src/routes/tasks.routes.ts`
- `backend/src/controllers/tasks.controller.ts`
- `backend/src/services/tasks.service.ts`
- `backend/src/validators/task.validator.ts`
- `backend/src/index.ts` route registration

### Frontend
- `frontend/src/services/api/tasks.api.ts`
- `frontend/src/stores/TaskStore.ts`
- `frontend/src/stores/RootStore.ts`
- `frontend/src/screens/CalendarScreen.tsx`
- `frontend/src/screens/AddTaskScreen.tsx` (or modal component)
- `frontend/src/navigation/*` route typing + registration

---

## Acceptance Criteria
- [ ] Prisma schema supports task templates and calendar tasks
- [ ] Seed includes predefined templates (or equivalent initial data)
- [ ] Backend APIs for templates, task creation, listing, and status update are implemented
- [ ] Ownership/auth checks are enforced via lot hierarchy
- [ ] Frontend API + `TaskStore` integrated in `RootStore`
- [ ] Calendar screen shows tasks by date and supports day selection
- [ ] User can add task from predefined template
- [ ] User can add custom task
- [ ] User can mark task as done and status updates instantly
- [ ] UI matches `/Maquette/calendar` design closely

---

## Definition of Done
A user can open Calendar, see tasks on dates, create tasks (template-based or custom), and update task status with full backend persistence and store-driven UI updates.

---

## Prompt to Use in Agent Mode
Read `specs/calendar-tasks-backend-frontend-us.md` and implement it exactly.

Implementation order:
1. Prisma schema + migration (and seed templates).
2. Backend task/template module (routes/controllers/services/validators).
3. Frontend tasks API + `TaskStore` + RootStore integration.
4. Calendar UI + Add Task flow, matching `/Maquette/calendar`.
5. Task status updates and full state refresh.

Constraints:
- Reuse existing architecture patterns.
- Keep TypeScript strict.
- No unrelated refactors.
- Return changed files and mapping to each acceptance criterion.