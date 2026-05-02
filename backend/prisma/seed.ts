import { PrismaClient, LotStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Sample user
  const user = await prisma.user.upsert({
    where: { email: "farmer@example.com" },
    update: {},
    create: {
      email: "farmer@example.com",
      role: "farmer",
    },
  });
  console.log(`User: ${user.id} (${user.email})`);

  // Sample farm
  const farm = await prisma.farm.upsert({
    where: { id: "seed-farm-001" },
    update: {},
    create: {
      id: "seed-farm-001",
      userId: user.id,
      name: "Ferme Exemple",
      location: "Casablanca, Maroc",
    },
  });
  console.log(`Farm: ${farm.id} (${farm.name})`);

  // Sample coop
  const coop = await prisma.coop.upsert({
    where: { id: "seed-coop-001" },
    update: {},
    create: {
      id: "seed-coop-001",
      farmId: farm.id,
      name: "Poulailler A",
      buildingType: "closed",
      capacity: 5000,
    },
  });
  console.log(`Coop: ${coop.id} (${coop.name})`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
