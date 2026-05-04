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

  // Task templates
  const taskTemplates = [
    {
      name: "Vaccination J7",
      description: "First vaccination at day 7.",
      category: "vaccine",
      defaultOffsetDays: 7,
    },
    {
      name: "Vaccination J14",
      description: "Second vaccination at day 14.",
      category: "vaccine",
      defaultOffsetDays: 14,
    },
    {
      name: "Vaccination J21",
      description: "Third vaccination at day 21.",
      category: "vaccine",
      defaultOffsetDays: 21,
    },
    {
      name: "Contrôle poids",
      description: "Weekly weight check — 30 birds.",
      category: "control",
      defaultOffsetDays: 7,
    },
    {
      name: "Nettoyage poulailler",
      description: "Clean and disinfect the coop.",
      category: "control",
      defaultOffsetDays: null,
    },
    {
      name: "Stock aliment",
      description: "Check feed stock, reorder if low.",
      category: "feeding",
      defaultOffsetDays: null,
    },
    {
      name: "Traitement préventif",
      description: "Preventive treatment per schedule.",
      category: "treatment",
      defaultOffsetDays: null,
    },
  ];
  for (const tpl of taskTemplates) {
    const existing = await prisma.taskTemplate.findFirst({
      where: { name: tpl.name },
    });
    if (!existing) {
      await prisma.taskTemplate.create({
        data: { ...tpl, isActive: true },
      });
    }
  }
  console.log(`Task templates: ${taskTemplates.length} upserted.`);

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
