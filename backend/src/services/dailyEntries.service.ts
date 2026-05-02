import { PrismaClient } from "@prisma/client";
import { CreateDailyEntryDto } from "../validators/dailyEntry.validator";

const prisma = new PrismaClient();

const toDayString = (value: Date): string => value.toISOString().slice(0, 10);

const fromDayString = (value: string): Date =>
  new Date(`${value}T00:00:00.000Z`);

async function getLotAccess(userId: string, lotId: string) {
  const lot = await prisma.lot.findUnique({
    where: { id: lotId },
    include: { coop: { include: { farm: true } } },
  });

  if (!lot) {
    return { status: "not_found" as const };
  }

  if (lot.coop.farm.userId !== userId) {
    return { status: "forbidden" as const };
  }

  return { status: "ok" as const, lot };
}

export async function createDailyEntry(
  userId: string,
  lotId: string,
  dto: CreateDailyEntryDto,
) {
  const access = await getLotAccess(userId, lotId);
  if (access.status !== "ok") {
    return access;
  }

  if (access.lot.status !== "active") {
    return { status: "lot_closed" as const };
  }

  const lotStartDate = toDayString(access.lot.entryDate);
  if (dto.entryDate < lotStartDate) {
    return { status: "before_lot_start" as const };
  }

  const maxDate = new Date();
  maxDate.setUTCHours(0, 0, 0, 0);
  maxDate.setUTCDate(maxDate.getUTCDate() + 1);
  if (fromDayString(dto.entryDate) > maxDate) {
    return { status: "future_date" as const };
  }

  try {
    const entry = await prisma.dailyEntry.create({
      data: {
        lotId,
        entryDate: fromDayString(dto.entryDate),
        mortalityCount: dto.mortalityCount,
        feedConsumedKg: dto.feedKg,
        waterLiters: dto.waterLiters ?? null,
        avgWeightGrams: dto.avgWeightGrams ?? null,
        notes: dto.notes?.trim() || null,
      },
    });

    return { status: "created" as const, entry };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { status: "duplicate" as const };
    }
    throw err;
  }
}

export async function listDailyEntries(
  userId: string,
  lotId: string,
  page: number,
  limit: number,
) {
  const access = await getLotAccess(userId, lotId);
  if (access.status !== "ok") {
    return access;
  }

  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    prisma.dailyEntry.findMany({
      where: { lotId },
      skip,
      take: limit,
      orderBy: { entryDate: "desc" },
    }),
    prisma.dailyEntry.count({ where: { lotId } }),
  ]);

  return {
    status: "ok" as const,
    data: { entries, total, page, limit },
  };
}

export async function getDailyEntryByDate(
  userId: string,
  lotId: string,
  entryDate: string,
) {
  const access = await getLotAccess(userId, lotId);
  if (access.status !== "ok") {
    return access;
  }

  const entry = await prisma.dailyEntry.findUnique({
    where: {
      lotId_entryDate: {
        lotId,
        entryDate: fromDayString(entryDate),
      },
    },
  });

  if (!entry) {
    return { status: "entry_not_found" as const };
  }

  return { status: "ok" as const, entry };
}
