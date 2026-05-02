# User Story — Frontend: Create Farm Form (React Hook Form)

## Story
As a farmer with no farm configured yet, I want to click "Get Started" and open a farm creation form, so I can create my first farm and start using the app dashboard.

---

## Business Context
This story completes the onboarding flow from Home empty state:
1. User lands on Home with no farms
2. User clicks "Commencer / ابدأ الآن"
3. User is taken to Farm creation form
4. On submit, app calls Create Farm API service
5. On success, user is redirected to Home dashboard with the new farm selected

---

## Scope
Included:
- `FarmFormScreen` UI and validation using `react-hook-form`
- `createFarm` service call integration (existing API layer)
- Submit/loading/success/error states
- Navigation from Home empty state Start button to Farm form
- Store refresh after farm creation

Excluded:
- Farm edit screen
- Multi-step onboarding
- Map/geolocation picker
- Image upload

---

## Dependencies
- Existing `farms.api.ts` service with `createFarm(payload)`
- Existing `FarmStore` with `fetchFarms()`
- Navigation stack containing `HomeScreen` and `FarmFormScreen`
- i18n setup for FR/AR labels

---

## Functional Requirements

### FR-1: Start Button Navigation
- On Home empty state, tap "Commencer / ابدأ الآن"
- Navigate to `FarmFormScreen`

### FR-2: Farm Form Fields
`FarmFormScreen` must contain:
- `name` (required)
- `city` (required)
- `country` (required, default "Morocco")
- Optional fields (if backend supports):
  - `address`
  - `notes`

### FR-3: Validation Rules (react-hook-form)
- `name`: required, min 2 chars, max 100
- `city`: required, min 2 chars, max 80
- `country`: required, min 2 chars, max 80
- `address`: optional, max 200
- `notes`: optional, max 500
- Errors shown inline under each field

### FR-4: Submit Behavior
- Submit button label: "Créer la ferme / إنشاء المزرعة"
- On submit:
  1. Validate form
  2. Build payload DTO
  3. Call `createFarm(payload)`
  4. Disable button + show loading state while request in-flight

### FR-5: Success Flow
- Show success feedback (toast/snackbar or inline success)
- Trigger `farmStore.fetchFarms()` to refresh list
- Select newly created farm as active (if selection exists in store)
- Navigate back to `HomeScreen`
- Home should now render dashboard state (not empty state)

### FR-6: Error Handling
Handle API errors gracefully:
- 400: show validation/business message from API
- 401: session expired message and redirect to login if app policy requires
- 409: show duplicate/conflict message
- 500/network: generic retry message

### FR-7: UX Rules
- Disable submit if form invalid or currently submitting
- Use keyboard-safe layout and scroll for smaller devices
- Input touch target min 48px
- Keep labels visible above fields (no placeholder-only labels)

---

## Non-Functional Requirements
- TypeScript strict typing for form model and payload
- No `any` types
- Keep component responsibilities clear:
  - UI + validation in `FarmFormScreen`
  - API call in service layer
  - Data refresh in store

---

## Suggested File Targets
- `frontend/src/screens/FarmFormScreen.tsx` (create/update)
- `frontend/src/screens/HomeScreen.tsx` (Start button navigation)
- `frontend/src/services/api/farms.api.ts` (reuse existing `createFarm`)
- `frontend/src/stores/FarmStore.ts` (ensure refresh/select helper exists)
- `frontend/src/navigation/*` (register route if missing)

---

## Form Model (example)
- `FarmFormValues`
  - `name: string`
  - `city: string`
  - `country: string`
  - `address?: string`
  - `notes?: string`

---

## API Contract
Request payload should match backend Create Farm endpoint DTO already defined in service layer.

Expected response:
- Created farm object with `id`, `name`, and related metadata.

---

## UI Copy (FR/AR)
- Title: "Créer une ferme / إنشاء مزرعة"
- Subtitle: "Renseignez les informations de votre ferme / أدخل معلومات مزرعتك"
- Fields:
  - "Nom de la ferme / اسم المزرعة"
  - "Ville / المدينة"
  - "Pays / البلد"
  - "Adresse (optionnel) / العنوان (اختياري)"
  - "Notes (optionnel) / ملاحظات (اختياري)"
- Buttons:
  - Primary: "Créer la ferme / إنشاء المزرعة"
  - Secondary (optional): "Annuler / إلغاء"
- Success: "Ferme créée avec succès / تم إنشاء المزرعة بنجاح"

---

## Acceptance Criteria
- [ ] From Home empty state, tapping Start navigates to `FarmFormScreen`
- [ ] Form uses `react-hook-form` and enforces all validation rules
- [ ] Invalid fields display inline errors
- [ ] Submit triggers `createFarm` service with typed payload
- [ ] Submit button shows loading and prevents double submission
- [ ] On success, farms are refreshed and user returns to Home dashboard state
- [ ] API errors (400/401/409/500/network) are surfaced with user-friendly messages
- [ ] Design system spacing/colors/typography are respected
- [ ] Bilingual FR/AR labels exist for key UI elements

---

## Definition of Done
A user with zero farms can press Start, complete the farm form, create the farm via API, and immediately continue in the normal Home dashboard flow.

---

## Agent Mode Prompt
Read `specs/frontend-farm-create-form-us.md` and implement exactly as specified.
Create/update only the farm creation flow files (`FarmFormScreen`, Home Start button navigation, and required navigation registration).
Use `react-hook-form` for validation and integrate existing `createFarm` API service.
On success, refresh farms in `FarmStore`, select the created farm, and navigate to Home.
Do not implement unrelated screens or backend changes.