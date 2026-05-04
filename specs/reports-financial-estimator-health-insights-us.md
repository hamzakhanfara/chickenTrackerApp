# User Story — Reports Tab: Financial Summary, Revenue Estimator, Scientific Health Metrics, and Optimization Tips

## Story
As a farm manager, I want a Reports tab that summarizes financial performance, estimates expected revenue, tracks scientific flock health metrics, and provides actionable tips, so I can optimize production and profitability.

---

## Objective
Build a complete Reports module (backend + frontend) that uses existing lot, daily entry, and expenses data to generate:
1. Financial summary
2. Revenue estimator (projection)
3. Scientific health/performance metrics
4. Smart tips/suggestions

---

## Scope
Included:
- report computation APIs/services
- frontend store + Reports tab UI
- lot-level and optional coop/farm aggregations
- explanatory labels/formulas in UI

Excluded:
- external AI service integration
- long-term forecasting model training
- PDF export (can be separate US)

---

## Data Sources
Must reuse existing persisted data:
- lots (status, start/end, initial count)
- daily entries (mortality, feed, water, weights)
- lot expenses (fixed + additional)
- optional task adherence data (if available)

---

## Part 1 — Backend (Reports Service + Endpoints)

### Rule: Check-Then-Implement
First check if report endpoints/services already exist.
If they exist, extend only missing calculations.
If absent, create minimal report module.

### Endpoints (recommended)
- `GET /api/reports/lots/:lotId/summary`
  - full report payload for one lot
- `GET /api/reports/coops/:coopId/summary` (optional MVP+)
- `GET /api/reports/farms/:farmId/summary` (optional MVP+)

### Output Blocks
1. `financialSummary`
2. `revenueEstimator`
3. `healthMetrics`
4. `optimizationTips`

---

## Financial Summary Calculations
Use available data with safe fallbacks.

### Required metrics
- Total expenses (sum all expense categories + additional lines)
- Feed cost share (%)
- Cost per chick
- Cost per surviving chick
- If weight data available:
  - Cost per kg live weight

Definitions:
- `survivingBirds = initialBirdCount - totalMortality`
- `totalExpense = sum(all expenses)`
- `costPerChick = totalExpense / initialBirdCount`
- `costPerSurvivingChick = totalExpense / survivingBirds`

Handle divide-by-zero safely.

---

## Revenue Estimator (Projection)

### Inputs
- market selling price per kg (user-provided default or system default)
- projected final avg weight
- projected surviving birds

### Outputs
- projected revenue
- projected gross margin = projected revenue - totalExpense
- projected margin rate (%)
- break-even price per kg

Reference formulas:
- `projectedRevenue = projectedSurvivingBirds * projectedAvgWeightKg * sellPricePerKg`
- `grossMargin = projectedRevenue - totalExpense`
- `marginRate = grossMargin / projectedRevenue`
- `breakEvenPricePerKg = totalExpense / (projectedSurvivingBirds * projectedAvgWeightKg)`

If inputs missing, return partial outputs with explanatory flags.

---

## Scientific Health & Performance Metrics
Include practical poultry KPIs:
- Mortality rate (%)
- Average Daily Gain (ADG/GMQ)
- Feed Conversion Ratio (FCR/IC)
- Uniformity proxy (if enough weight points; else mark unavailable)
- Water-to-feed ratio (if water data exists)
- Trend flags: improving / stable / worsening (simple slope over last entries)

Examples:
- `mortalityRate = totalMortality / initialBirdCount`
- `FCR = totalFeedKg / totalWeightGainKg` (when computable)

Every metric should return:
- value
- unit
- status zone (`good`, `watch`, `critical`) based on configurable thresholds

---

## Optimization Tips / Suggestions Engine
Generate deterministic rule-based tips from computed metrics.

Examples:
- High FCR -> feed quality/ration timing suggestion
- Rising mortality -> immediate health check + biosecurity actions
- Low ADG -> temperature, density, feed protein review
- Abnormal water/feed ratio -> check drinker leakage or heat stress
- High fixed costs share -> cost-control recommendation

Each tip object:
- `id`
- `severity`
- `title`
- `description`
- `recommendedActions[]`

No generative AI required; rule engine is enough.

---

## Part 2 — Frontend (API + Store + Reports Tab)

### API
Add/extend reports API:
- `getLotReportSummary(lotId, params?)`
- optional coop/farm summary methods

### Store
Create `ReportStore`:
- state: `lotReports`, `isLoading`, `error`
- actions:
  - `fetchLotReport(lotId, params?)`
  - optional `fetchCoopReport`, `fetchFarmReport`
  - `setEstimatorInputs(...)` (if estimator is interactive)

Register in root store.

### Reports Tab UI
Build `ReportsScreen` (or Report tab section) with cards:
1. Financial Summary card
2. Revenue Estimator card (editable inputs + recalculation)
3. Health Metrics card grid
4. Tips & Suggestions list

UI behavior:
- clear units and number formatting
- show calculation context/help text
- loading skeletons and empty/error states

---

## Design Requirements
- Keep same app visual language (cards, spacing, typography)
- high readability for non-technical users
- bilingual-ready labels
- no dense table overload; prioritize scannable cards

---

## Suggested Files
### Backend
- `backend/src/routes/reports.routes.ts`
- `backend/src/controllers/reports.controller.ts`
- `backend/src/services/reports.service.ts`
- optional `backend/src/services/reports-calculators/*`
- route registration in app bootstrap

### Frontend
- `frontend/src/services/api/reports.api.ts`
- `frontend/src/stores/ReportStore.ts`
- `frontend/src/stores/RootStore.ts`
- `frontend/src/screens/ReportsScreen.tsx`
- optional shared components for metric cards/tips

---

## Acceptance Criteria
- [ ] Existing report logic is audited first; only missing parts are added
- [ ] Reports tab shows Financial Summary from real persisted data
- [ ] Revenue Estimator computes projected revenue and gross margin
- [ ] Scientific metrics (mortality, ADG, FCR, etc.) are computed and displayed with zones
- [ ] Tips/suggestions are generated from deterministic rules tied to metrics
- [ ] UI handles partial/missing data safely with clear messaging
- [ ] Store/API architecture follows existing patterns
- [ ] No unrelated refactors

---

## Definition of Done
A farmer can open Reports and immediately understand costs, projected revenue, flock health quality, and concrete actions to improve production.

---

## Prompt to Use in Agent Mode
Read `specs/reports-financial-estimator-health-insights-us.md` and implement exactly.

Hard rules:
1. Audit existing reports implementation first.
2. Reuse existing modules and add only missing pieces.
3. Implement financial summary, revenue estimator, scientific metrics, and rule-based tips.
4. Use real data from lots, daily entries, and expenses.
5. Build Reports tab UI with clear cards and user-friendly explanations.
6. Keep TypeScript strict and avoid unrelated refactors.
7. Return changed files and acceptance-criteria mapping.