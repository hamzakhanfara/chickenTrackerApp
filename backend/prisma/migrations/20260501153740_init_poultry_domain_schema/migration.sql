-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('farmer', 'admin');

-- CreateEnum
CREATE TYPE "BuildingType" AS ENUM ('open', 'semi_closed', 'closed');

-- CreateEnum
CREATE TYPE "LotBreed" AS ENUM ('ROSS_308', 'COBB_500', 'HUBBARD', 'OTHER');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('active', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "AdministrationRoute" AS ENUM ('water', 'spray', 'ocular', 'injection', 'other');

-- CreateEnum
CREATE TYPE "VaccinePlanStatus" AS ENUM ('planned', 'done', 'missed', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'farmer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coops" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "buildingType" "BuildingType" NOT NULL DEFAULT 'open',
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lots" (
    "id" TEXT NOT NULL,
    "coopId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "breed" "LotBreed" NOT NULL DEFAULT 'OTHER',
    "status" "LotStatus" NOT NULL DEFAULT 'active',
    "entryDate" TIMESTAMP(3) NOT NULL,
    "initialCount" INTEGER NOT NULL,
    "initialWeightKg" DECIMAL(65,30),
    "entryPricePerKg" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_entries" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "entryDate" DATE NOT NULL,
    "ageDay" INTEGER,
    "mortalityCount" INTEGER NOT NULL DEFAULT 0,
    "feedConsumedKg" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "avgWeightGrams" DECIMAL(65,30),
    "waterLiters" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccine_plans" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "scheduledDay" INTEGER NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "administrationRoute" "AdministrationRoute" NOT NULL,
    "status" "VaccinePlanStatus" NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccine_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccine_events" (
    "id" TEXT NOT NULL,
    "vaccinePlanId" TEXT NOT NULL,
    "createdById" TEXT,
    "executedDate" DATE NOT NULL,
    "dosesGiven" INTEGER,
    "batchNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccine_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatments" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "reason" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "dosage" TEXT,
    "costMad" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_closures" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "closureDate" DATE NOT NULL,
    "totalWeightKg" DECIMAL(65,30),
    "totalSold" INTEGER,
    "avgSalePricePerKgMad" DECIMAL(65,30),
    "totalRevenueMad" DECIMAL(65,30),
    "totalFeedCostMad" DECIMAL(65,30),
    "totalOtherCosts" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lot_closures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "farms_userId_idx" ON "farms"("userId");

-- CreateIndex
CREATE INDEX "coops_farmId_idx" ON "coops"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "lots_code_key" ON "lots"("code");

-- CreateIndex
CREATE INDEX "lots_coopId_idx" ON "lots"("coopId");

-- CreateIndex
CREATE INDEX "lots_status_idx" ON "lots"("status");

-- CreateIndex
CREATE INDEX "daily_entries_lotId_idx" ON "daily_entries"("lotId");

-- CreateIndex
CREATE INDEX "daily_entries_entryDate_idx" ON "daily_entries"("entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_entries_lotId_entryDate_key" ON "daily_entries"("lotId", "entryDate");

-- CreateIndex
CREATE INDEX "vaccine_plans_lotId_idx" ON "vaccine_plans"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "vaccine_events_vaccinePlanId_key" ON "vaccine_events"("vaccinePlanId");

-- CreateIndex
CREATE INDEX "treatments_lotId_idx" ON "treatments"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "lot_closures_lotId_key" ON "lot_closures"("lotId");

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coops" ADD CONSTRAINT "coops_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_coopId_fkey" FOREIGN KEY ("coopId") REFERENCES "coops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccine_plans" ADD CONSTRAINT "vaccine_plans_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccine_events" ADD CONSTRAINT "vaccine_events_vaccinePlanId_fkey" FOREIGN KEY ("vaccinePlanId") REFERENCES "vaccine_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccine_events" ADD CONSTRAINT "vaccine_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_closures" ADD CONSTRAINT "lot_closures_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
