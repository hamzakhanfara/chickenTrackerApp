import { PrismaClient, BuildingType } from "@prisma/client";
import { CreateCoopDto, UpdateCoopDto } from "../validators/coop.validator";

const prisma = new PrismaClient();

async function ownsFarm(userId: string, farmId: string) {
  return prisma.farm.findFirst({ where: { id: farmId, userId } });
}

async function ownsCoopViaFarm(userId: string, coopId: string) {
  return prisma.coop.findFirst({
    where: { id: coopId, farm: { userId } },
    include: { farm: true },
  });
}

export async function createCoop(
  userId: string,
  farmId: string,
  dto: CreateCoopDto,
) {
  const farm = await ownsFarm(userId, farmId);
  if (!farm) return null;

  return prisma.coop.create({
    data: {
      farmId,
      name: dto.name,
      capacity: dto.capacity,
      buildingType: dto.buildingType as BuildingType,
    },
  });
}

export async function listCoops(
  userId: string,
  farmId: string,
  page: number,
  limit: number,
) {
  const farm = await ownsFarm(userId, farmId);
  if (!farm) return null;

  const skip = (page - 1) * limit;
  const [coops, total] = await Promise.all([
    prisma.coop.findMany({
      where: { farmId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.coop.count({ where: { farmId } }),
  ]);
  return { coops, total, page, limit };
}

export async function getCoop(userId: string, coopId: string) {
  return ownsCoopViaFarm(userId, coopId);
}

export async function updateCoop(
  userId: string,
  coopId: string,
  dto: UpdateCoopDto,
) {
  const coop = await ownsCoopViaFarm(userId, coopId);
  if (!coop) return null;

  return prisma.coop.update({
    where: { id: coopId },
    data: {
      ...(dto.name && { name: dto.name }),
      ...(dto.capacity !== undefined && { capacity: dto.capacity }),
      ...(dto.buildingType && {
        buildingType: dto.buildingType as BuildingType,
      }),
    },
  });
}

export async function deleteCoop(userId: string, coopId: string) {
  const coop = await prisma.coop.findFirst({
    where: { id: coopId, farm: { userId } },
    include: { _count: { select: { lots: true } } },
  });
  if (!coop) return { status: "not_found" as const };
  if (coop._count.lots > 0) return { status: "has_lots" as const };

  await prisma.coop.delete({ where: { id: coopId } });
  return { status: "deleted" as const };
}
