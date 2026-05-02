# User Story — Backend Database MCD (Validation First)

## Story
As a developer, I want to define and validate the **MCD (Modèle Conceptuel de Données)** for PoultryTrack
so that we can implement the Prisma schema with a correct domain structure before building routes.

---

## Scope (this story)
Only define and validate the conceptual model for:
- User
- Farm
- Coop (Poulailler)
- Lot
- Daily Entry
- Vaccination
- Treatment
- Lot Closure

No route implementation in this story.

---

## Target Hierarchy (confirmed)
`User -> Farm -> Coop -> Lot`

- One `User` can have multiple `Farm`
- One `Farm` can have multiple `Coop`
- One `Coop` can have multiple `Lot` over time
- One `Coop` should have **max one active lot at a time**

---

## MCD Entities (Draft v2)

### 1) User
- id (UUID, PK)
- email (unique)
- full_name
- phone (nullable)
- role (`farmer`, `admin`)
- created_at
- updated_at

### 2) Farm
- id (UUID, PK)
- user_id (UUID, FK -> User.id)
- name
- region
- city
- address (nullable)
- created_at
- updated_at

### 3) Coop
- id (UUID, PK)
- farm_id (UUID, FK -> Farm.id)
- name
- capacity
- area_m2
- building_type (`open`, `semi_closed`, `closed`)
- created_at
- updated_at

### 4) Lot
- id (UUID, PK)
- coop_id (UUID, FK -> Coop.id)
- code (unique)
- breed (`ROSS_308`, `COBB_500`, `HUBBARD`, `OTHER`)
- source_supplier (nullable)
- start_date
- target_end_date (nullable)
- initial_chick_count
- initial_avg_weight_g (nullable)
- status (`active`, `closed`, `cancelled`)
- created_at
- updated_at

### 5) DailyEntry
- id (UUID, PK)
- lot_id (UUID, FK -> Lot.id)
- entry_date
- age_day (optional stored value)
- dead_count
- cull_count (nullable)
- feed_kg
- water_l
- avg_weight_g (nullable)
- temp_morning_c (nullable)
- temp_evening_c (nullable)
- humidity_pct (nullable)
- notes (nullable)
- created_at
- updated_at

Constraint:
- unique (lot_id, entry_date)

### 6) VaccinePlan
- id (UUID, PK)
- lot_id (UUID, FK -> Lot.id)
- vaccine_name
- planned_day
- planned_date (nullable)
- administration_route (`water`, `spray`, `ocular`, `injection`, `other`)
- status (`planned`, `done`, `missed`, `cancelled`)
- created_at
- updated_at

### 7) VaccineEvent
- id (UUID, PK)
- vaccine_plan_id (UUID, FK -> VaccinePlan.id)
- executed_at
- batch_number (nullable)
- dosage (nullable)
- notes (nullable)
- created_by (UUID, FK -> User.id, nullable)

### 8) Treatment
- id (UUID, PK)
- lot_id (UUID, FK -> Lot.id)
- name
- start_date
- end_date
- dosage (nullable)
- withdrawal_days (default 0)
- reason (nullable)
- notes (nullable)
- created_at
- updated_at

### 9) LotClosure
- id (UUID, PK)
- lot_id (UUID, FK -> Lot.id, unique)
- closed_at
- sold_birds_count
- total_weight_kg
- avg_sale_price_per_kg_mad
- buyer_name (nullable)
- rejection_count (nullable)
- transport_cost_mad (nullable)
- other_costs_mad (nullable)
- notes (nullable)

---

## Cardinalities
- User (1,1) -> (0,n) Farm
- Farm (1,1) -> (1,n) Coop
- Coop (1,1) -> (0,n) Lot
- Lot (1,1) -> (0,n) DailyEntry
- Lot (1,1) -> (0,n) VaccinePlan
- VaccinePlan (1,1) -> (0,1) VaccineEvent
- Lot (1,1) -> (0,n) Treatment
- Lot (1,1) -> (0,1) LotClosure

---

## Business Rules to Enforce Later in DB
- A coop cannot have more than one `active` lot simultaneously
- `DailyEntry.entry_date` must be between lot start and lot close date (if closed)
- `LotClosure` can exist only once per lot
- `sold_birds_count` should be <= initial_chick_count - cumulative mortality/culls

---

## Acceptance Criteria
- [ ] MCD file is reviewed and approved
- [ ] Hierarchy `User -> Farm -> Coop -> Lot` is confirmed
- [ ] All entities and relationships are validated
- [ ] Open decisions are finalized
- [ ] Ready to create next US for Prisma schema implementation

---

## Open Decisions to Confirm
1. Keep `age_day` stored in `DailyEntry` or compute dynamically from `start_date`?
2. Keep `phone` optional in `User` for now (email auth active)?
3. Breed as enum now, reference table later?

---

## Definition of Done
This file is approved and frozen, and we can create the next implementation story:
`specs/backend-database-prisma-us.md`.
