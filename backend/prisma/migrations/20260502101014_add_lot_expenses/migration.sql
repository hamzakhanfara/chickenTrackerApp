-- CreateEnum
CREATE TYPE "ExpenseEntryMode" AS ENUM ('PER_CHICK', 'TOTAL');

-- CreateTable
CREATE TABLE "lot_expenses" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "entryMode" "ExpenseEntryMode" NOT NULL DEFAULT 'TOTAL',
    "chickPrice" DECIMAL(65,30),
    "vaccinationExpense" DECIMAL(65,30),
    "coopExpense" DECIMAL(65,30),
    "farmerExpense" DECIMAL(65,30),
    "gasExpense" DECIMAL(65,30),
    "waterExpense" DECIMAL(65,30),
    "feedExpense" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lot_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_additional_expenses" (
    "id" TEXT NOT NULL,
    "lotExpenseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lot_additional_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lot_expenses_lotId_key" ON "lot_expenses"("lotId");

-- CreateIndex
CREATE INDEX "lot_additional_expenses_lotExpenseId_idx" ON "lot_additional_expenses"("lotExpenseId");

-- AddForeignKey
ALTER TABLE "lot_expenses" ADD CONSTRAINT "lot_expenses_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_additional_expenses" ADD CONSTRAINT "lot_additional_expenses_lotExpenseId_fkey" FOREIGN KEY ("lotExpenseId") REFERENCES "lot_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
