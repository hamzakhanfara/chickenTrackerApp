import { PrismaClient } from "@prisma/client";
import { CreateFarmDto, UpdateFarmDto } from "../validators/farm.validator";

const prisma = new PrismaClient();

export async function createFarm(userId: string, dto: CreateFarmDto) {
  return prisma.farm.create({
    data: {
      userId,
      name: dto.name,
      location: [dto.city, dto.region, dto.address].filter(Boolean).join(", "),
    },
  });
}

export async function listFarms(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [farms, total] = await Promise.all([
    prisma.farm.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.farm.count({ where: { userId } }),
  ]);
  return { farms, total, page, limit };
}

export async function getFarm(userId: string, farmId: string) {
  const farm = await prisma.farm.findFirst({ where: { id: farmId, userId } });
  return farm ?? null;
}

export async function updateFarm(
  userId: string,
  farmId: string,
  dto: UpdateFarmDto,
) {
  const farm = await prisma.farm.findFirst({ where: { id: farmId, userId } });
  if (!farm) return null;

  const locationParts = [dto.city, dto.region, dto.address].filter(Boolean);
  const location =
    locationParts.length > 0 ? locationParts.join(", ") : undefined;

  return prisma.farm.update({
    where: { id: farmId },
    data: {
      ...(dto.name && { name: dto.name }),
      ...(location !== undefined && { location }),
    },
  });
}

export async function deleteFarm(userId: string, farmId: string) {
  const farm = await prisma.farm.findFirst({
    where: { id: farmId, userId },
    include: { _count: { select: { coops: true } } },
  });
  if (!farm) return { status: "not_found" as const };
  if (farm._count.coops > 0) return { status: "has_coops" as const };

  await prisma.farm.delete({ where: { id: farmId } });
  return { status: "deleted" as const };
}
