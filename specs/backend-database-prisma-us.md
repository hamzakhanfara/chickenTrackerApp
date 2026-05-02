# User Story — Backend Database Prisma Implementation (from validated MCD)

## Validation Summary (MCD Review)
After reviewing [specs/backend-database-mcd.md](specs/backend-database-mcd.md), the model is **coherent** with the confirmed hierarchy:

`User -> Farm -> Coop -> Lot`

### Hierarchy Check
- `User` owns many `Farm` ✅
- `Farm` contains many `Coop` ✅
- `Coop` contains many `Lot` over time ✅
- `Lot` owns operational records (`DailyEntry`, `VaccinePlan`, `Treatment`, `LotClosure`) ✅

### Blocking Inconsistencies
- **None blocking** for Prisma implementation.

### Non-blocking items to finalize during implementation
1. `DailyEntry.age_day`: store vs compute (default decision in this story: **store optional**).
2. `User.phone`: keep optional while auth is email/password.
3. `Breed`: use enum now; move to reference table later if needed.

---

## Story
As a backend developer, I want to implement the validated MCD as a Prisma schema and migration baseline,
so that the project has a reliable relational foundation before API routes are expanded.

---

## Scope
Implement database schema only (Prisma + migration + basic seed scaffold).

Included:
- Prisma models for all validated entities
- Prisma enums
- PK/FK/unique/index/check-like constraints where feasible
- Migration generation and apply
- Optional seed scaffold (empty or minimal)

Excluded:
- API routes/controllers/services
- Business workflow code
- Advanced analytics materialized tables

---

## Prisma Models to Implement

1. `User`
2. `Farm`
3. `Coop`
4. `Lot`
5. `DailyEntry`
6. `VaccinePlan`
7. `VaccineEvent`
8. `Treatment`
9. `LotClosure`

---

## Enums to Implement

- `UserRole`: `farmer`, `admin`
- `BuildingType`: `open`, `semi_closed`, `closed`
- `LotBreed`: `ROSS_308`, `COBB_500`, `HUBBARD`, `OTHER`
- `LotStatus`: `active`, `closed`, `cancelled`
- `AdministrationRoute`: `water`, `spray`, `ocular`, `injection`, `other`
- `VaccinePlanStatus`: `planned`, `done`, `missed`, `cancelled`

---

## Required Relations

- `User 1 -> n Farm`
- `Farm 1 -> n Coop`
- `Coop 1 -> n Lot`
- `Lot 1 -> n DailyEntry`
- `Lot 1 -> n VaccinePlan`
- `VaccinePlan 1 -> 0..1 VaccineEvent`
- `Lot 1 -> n Treatment`
- `Lot 1 -> 0..1 LotClosure`
- `User 1 -> n VaccineEvent` (optional `createdBy`)

---

## Constraints and Indexes

### Unique constraints
- `User.email` unique
- `Lot.code` unique
- `DailyEntry` composite unique: `(lotId, entryDate)`
- `LotClosure.lotId` unique
- `VaccineEvent.vaccinePlanId` unique (to enforce 0..1 event per plan)

### Indexes
- `Farm.userId`
- `Coop.farmId`
- `Lot.coopId`
- `Lot.status`
- `DailyEntry.lotId`
- `DailyEntry.entryDate`
- `VaccinePlan.lotId`
- `Treatment.lotId`

### DB/business constraints to handle
- Max one active lot per coop at a time:
  - Preferred: partial unique index in SQL migration (`UNIQUE (coop_id) WHERE status='active'`)
  - If not done in Prisma DSL, add manual SQL in migration
- Date consistency checks (entry date vs lot lifecycle, treatment dates): enforce later in service layer if DB checks are not added now

---

## Field and Type Requirements

- IDs as UUID (`@default(uuid())`)
- Timestamps on major tables:
  - `createdAt @default(now())`
  - `updatedAt @updatedAt`
- Numeric types:
  - counts as `Int`
  - kg/liter/price as `Decimal` where precision matters (preferred) or `Float` for MVP simplicity

**Decision for this US:**
- Use `Decimal` for monetary and weight totals where possible (`avgSalePricePerKgMad`, `totalWeightKg`, costs).

---

## Migration Steps

1. Update `prisma/schema.prisma` with models/enums/relations.
2. Run Prisma format/validate.
3. Generate migration with descriptive name:
   - `init_poultry_domain_schema`
4. Apply migration to dev DB.
5. Regenerate Prisma Client.
6. (Optional) Add basic `prisma/seed.ts` scaffold with a sample user/farm/coop.

---

## Acceptance Criteria

- [ ] All 9 models exist in Prisma schema with correct field types
- [ ] All enums are defined and used by models
- [ ] All required relations compile and generate Prisma client successfully
- [ ] Unique constraints implemented:
  - [ ] `User.email`
  - [ ] `Lot.code`
  - [ ] `DailyEntry(lotId, entryDate)`
  - [ ] `LotClosure.lotId`
  - [ ] `VaccineEvent.vaccinePlanId`
- [ ] Required indexes added for FK lookup and status/date filtering
- [ ] Migration generated and applied successfully on Supabase/Postgres
- [ ] Prisma client generation succeeds without errors
- [ ] No API route/controller code added in this story

---

## Out of Scope

- No CRUD endpoints
- No auth middleware changes
- No profile/business validations in controllers
- No billing/subscription tables
- No IoT tables
- No marketplace tables

---

## Definition of Done
- Prisma schema reflects the validated MCD with all core entities, relations, enums, and constraints.
- Migration `init_poultry_domain_schema` is applied successfully.
- Database is ready for the next user story: route-level CRUD for Farm/Coop/Lot.
