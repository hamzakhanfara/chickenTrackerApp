-- Partial unique index: only one active lot per coop at a time
-- This enforces the business rule: a coop can have at most one Lot with status = 'active'
CREATE UNIQUE INDEX "lots_coop_id_active_unique"
  ON "lots" ("coopId")
  WHERE ("status" = 'active');
