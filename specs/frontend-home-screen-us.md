# User Story — Frontend: Home Screen

## Story
As a farmer, I want a home screen that shows me the most important information about my active lots
and gives me quick access to daily actions, so I can manage my operations efficiently every day.

---

## Preconditions
- User is authenticated (JWT in secure storage)
- FarmStore, CoopStore, LotStore are available via RootStore
- Design system from DESIGN.md is applied (colors, typography, spacing)

---

## Scope
Included:
- Empty state (no farms) with Get Started flow
- Loaded state (farms exist) with active lots overview
- KPI summary cards
- Active lots list
- Quick action buttons
- Alerts panel
- Bottom navigation bar

Excluded:
- DailyEntry screen
- Vaccine/Treatment screens
- KPI charts/analytics
- Offline sync

---

## Two States of the Home Screen

### State A — No Farm Exists (Empty / Onboarding)
- Full screen centered layout
- App logo at top
- Welcome message:
  - FR: "Bienvenue sur PoultryTrack"
  - AR: "مرحباً بك في PoultryTrack"
- Short description:
  - FR: "Commencez par créer votre première ferme"
- Large primary green button: "Commencer / ابدأ الآن"
  - Navigates to FarmFormScreen
- Illustration or simple icon of a farm (optional)

---

### State B — Farms Exist (Main Dashboard)

#### Header
- Left: Greeting + farmer name ("Bonjour, Hamza 👋")
- Right: Farm selector dropdown (if user has multiple farms)

#### KPI Summary Row (horizontal scroll, 4 cards)
- 🐣 Active lots count
- 💀 Today's total mortality (sum across active lots)
- 📊 Average IC (across active lots)
- 🔔 Pending alerts count (orange badge if > 0)

#### Alerts Panel (visible only if alerts exist)
- WhatsApp-style notification cards
- Types:
  - Vaccine due tomorrow → orange
  - Mortality > 0.5% today → red
  - Missing daily entry → yellow
- Max 3 shown, "See all" link if more

#### Active Lots Section
- Section title: "Lots actifs / الأقفاص النشطة"
- Each lot card shows:
  - Lot code + breed
  - Age: `J+{days}` badge
  - Birds alive count
  - Today's mortality count
  - Current IC value (green if < 1.8, orange if > 1.8)
  - Status badge (Active / Closed)
  - Quick action: "Add Entry" button on card

#### Quick Actions Row (bottom of content, above nav)
- "Nouveau Lot" (+ icon) → navigates to LotFormScreen
- "Entrée du jour" (📝 icon) → navigates to DailyEntry (future)
- "Mes Fermes" (🏠 icon) → navigates to FarmsScreen

#### Bottom Navigation Bar
- 4 tabs: `Home`, `Farms`, `Lots`, `Profile`
- Active tab uses primary green
- Uses icons + bilingual labels

---

## Loading State
- Skeleton cards for KPI row
- Skeleton cards for lot list
- No action buttons during loading

---

## Error State
- Full error message with retry button
- FR: "Une erreur est survenue"

---

## Data Flow
1. On mount, check `farmStore.fetchFarms()`
2. If farms empty → show State A
3. If farms exist → set default selected farm
4. Fetch active lots for selected farm's coops
5. Compute KPIs from active lots data
6. Fetch and display alerts (vaccine plans due, daily entry missing)

---

## Design System Application (from DESIGN.md)
- Background: `#f7fbf1`
- Primary buttons: `#1B5E20` height 56px
- Action buttons: orange `#FF6F00`
- Cards: white, 8px radius, soft shadow
- KPI cards: `surface-container-low` background
- Status badges: pill-shaped
- Typography: Work Sans, bilingual labels
- Spacing: 16px margins, 12px gutters
- Touch targets: min 48px

---

## Navigation

```
HomeScreen
  ├── (no farms) → FarmFormScreen
  ├── lot card tap → LotDetailsScreen
  ├── "Add Entry" → DailyEntryScreen (future)
  ├── "Nouveau Lot" → LotFormScreen
  └── "Mes Fermes" → FarmsScreen
```

---

## i18n Keys to Add

```json
{
  "home": {
    "greeting": "Bonjour",
    "welcome": "Bienvenue sur PoultryTrack",
    "getStarted": "Commencer",
    "noFarmDescription": "Commencez par créer votre première ferme",
    "activeLots": "Lots actifs",
    "todayMortality": "Mortalité aujourd'hui",
    "averageIC": "IC Moyen",
    "alerts": "Alertes",
    "addEntry": "Entrée du jour",
    "newLot": "Nouveau Lot",
    "myFarms": "Mes Fermes",
    "seeAll": "Voir tout",
    "errorOccurred": "Une erreur est survenue",
    "retry": "Réessayer"
  }
}
```

---

## Acceptance Criteria
- [ ] Empty state (State A) shown when user has no farms
- [ ] "Get Started" button navigates to FarmFormScreen
- [ ] Dashboard (State B) shown when farms exist
- [ ] KPI cards display correct live values from active lots
- [ ] Alerts panel shown only when alerts exist
- [ ] Each lot card shows code, breed, age, IC, mortality, status
- [ ] "Add Entry" button on lot card is present (navigation placeholder for now)
- [ ] Farm selector works when user has multiple farms
- [ ] Bottom navigation renders and navigates correctly
- [ ] Loading and error states are handled
- [ ] Design system applied (colors, fonts, spacing, shadows)
- [ ] Bilingual labels (FR/AR) on all key elements

---

## Out of Scope
- DailyEntry implementation
- Vaccine/Treatment screens
- KPI charts/graphs
- Offline cache behavior

---

## Definition of Done
User lands on HomeScreen after login, sees their active lot status or a clear Get Started prompt,
and can navigate to all key sections from one screen.
