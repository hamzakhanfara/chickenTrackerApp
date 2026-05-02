import { PrismaClient, ExpenseEntryMode } from "@prisma/client";
import { UpsertLotExpenseDto } from "../validators/lotExpense.validator";

const prisma = new PrismaClient();

async function ownsLot(userId: string, lotId: string) {
  return prisma.lot.findFirst({
    where: { id: lotId, coop: { farm: { userId } } },
  });
}

export async function getLotExpenses(userId: string, lotId: string) {
  const lot = await ownsLot(userId, lotId);
  if (!lot) return { status: "not_found" as const };

  const expense = await prisma.lotExpense.findUnique({
    where: { lotId },
    include: { additionalExpenses: true },
  });

  return { status: "ok" as const, expense };
}

export async function upsertLotExpenses(
  userId: string,
  lotId: string,
  dto: UpsertLotExpenseDto,
) {
  const lot = await ownsLot(userId, lotId);
  if (!lot) return { status: "not_found" as const };

  const expense = await prisma.lotExpense.upsert({
    where: { lotId },
    create: {
      lotId,
      entryMode: dto.entryMode as ExpenseEntryMode,
      chickPrice: dto.chickPrice ?? null,
      vaccinationExpense: dto.vaccinationExpense ?? null,
      coopExpense: dto.coopExpense ?? null,
      farmerExpense: dto.farmerExpense ?? null,
      gasExpense: dto.gasExpense ?? null,
      waterExpense: dto.waterExpense ?? null,
      feedExpense: dto.feedExpense ?? null,
      additionalExpenses: {
        create: (dto.additionalExpenses ?? []).map((line) => ({
          label: line.label.trim(),
          amount: line.amount,
        })),
      },
    },
    update: {
      entryMode: dto.entryMode as ExpenseEntryMode,
      chickPrice: dto.chickPrice ?? null,
      vaccinationExpense: dto.vaccinationExpense ?? null,
      coopExpense: dto.coopExpense ?? null,
      farmerExpense: dto.farmerExpense ?? null,
      gasExpense: dto.gasExpense ?? null,
      waterExpense: dto.waterExpense ?? null,
      feedExpense: dto.feedExpense ?? null,
      additionalExpenses: {
        deleteMany: {},
        create: (dto.additionalExpenses ?? []).map((line) => ({
          label: line.label.trim(),
          amount: line.amount,
        })),
      },
    },
    include: { additionalExpenses: true },
  });

  return { status: "ok" as const, expense };
}
