import { PrismaClient, LotBreed, LotStatus } from "@prisma/client";
import { CreateLotDto, UpdateLotDto } from "../validators/lot.validator";

const prisma = new PrismaClient();

async function ownsCoopViaFarm(userId: string, coopId: string) {
  return prisma.coop.findFirst({
    where: { id: coopId, farm: { userId } },
  });
}

async function ownsLot(userId: string, lotId: string) {
  return prisma.lot.findFirst({
    where: { id: lotId, coop: { farm: { userId } } },
    include: { closure: true },
  });
}

export async function createLot(
  userId: string,
  coopId: string,
  dto: CreateLotDto,
) {
  const coop = await ownsCoopViaFarm(userId, coopId);
  if (!coop) return { status: "not_found" as const };

  // Enforce one-active-lot-per-coop at API layer
  const activeLot = await prisma.lot.findFirst({
    where: { coopId, status: "active" },
  });
  if (activeLot) return { status: "active_lot_exists" as const };

  try {
    const lot = await prisma.lot.create({
      data: {
        coopId,
        code: dto.code,
        breed: dto.breed as LotBreed,
        status: LotStatus.active,
        entryDate: new Date(dto.startDate),
        initialCount: dto.initialChickCount,
        initialWeightKg: dto.initialAvgWeightG
          ? dto.initialAvgWeightG / 1000
          : null,
      },
    });
    return { status: "created" as const, lot };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { status: "duplicate_code" as const };
    }
    throw err;
  }
}

export async function listLots(
  userId: string,
  coopId: string,
  page: number,
  limit: number,
) {
  const coop = await ownsCoopViaFarm(userId, coopId);
  if (!coop) return null;

  const skip = (page - 1) * limit;
  const [lots, total] = await Promise.all([
    prisma.lot.findMany({
      where: { coopId },
      include: { closure: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.lot.count({ where: { coopId } }),
  ]);
  return { lots, total, page, limit };
}

export async function getLot(userId: string, lotId: string) {
  return ownsLot(userId, lotId);
}

export async function updateLot(
  userId: string,
  lotId: string,
  dto: UpdateLotDto,
) {
  const lot = await ownsLot(userId, lotId);
  if (!lot) return { status: "not_found" as const };
  if (lot.status === "closed") return { status: "closed" as const };

  try {
    const updated = await prisma.lot.update({
      where: { id: lotId },
      data: {
        ...(dto.code && { code: dto.code }),
        ...(dto.breed && { breed: dto.breed as LotBreed }),
      },
    });
    return { status: "updated" as const, lot: updated };
  } catch (err: any) {
    if (err.code === "P2002") return { status: "duplicate_code" as const };
    throw err;
  }
}

export async function closeLot(userId: string, lotId: string) {
  const lot = await ownsLot(userId, lotId);
  if (!lot) return { status: "not_found" as const };
  if (lot.status === "closed") return { status: "already_closed" as const };
  if (lot.status === "cancelled") return { status: "cancelled" as const };

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const closed = await prisma.lot.update({
    where: { id: lotId },
    data: {
      status: LotStatus.closed,
      closure: {
        upsert: {
          update: { closureDate: today },
          create: { closureDate: today },
        },
      },
    },
    include: { closure: true },
  });
  return { status: "closed" as const, lot: closed };
}

export async function deleteLot(userId: string, lotId: string) {
  const lot = await prisma.lot.findFirst({
    where: { id: lotId, coop: { farm: { userId } } },
    include: {
      _count: {
        select: { dailyEntries: true, vaccinePlans: true, treatments: true },
      },
    },
  });
  if (!lot) return { status: "not_found" as const };
  if (lot.status !== "cancelled") return { status: "not_cancelled" as const };

  const hasDeps =
    lot._count.dailyEntries > 0 ||
    lot._count.vaccinePlans > 0 ||
    lot._count.treatments > 0;
  if (hasDeps) return { status: "has_records" as const };

  await prisma.lot.delete({ where: { id: lotId } });
  return { status: "deleted" as const };
}
