import {
  AlertSeverity,
  AlertType,
  Prisma,
  PrismaClient,
  TaskStatus,
} from "@prisma/client";
import {
  ListAlertsQueryDto,
  MarkAllReadDto,
} from "../validators/alerts.validator";

const prisma = new PrismaClient();

const HIGH_MORTALITY_THRESHOLD_PCT = 0.5;

const startOfUtcDay = (date: Date) => {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
};

const addUtcDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

const dayString = (date: Date) => date.toISOString().slice(0, 10);

async function upsertOperationalAlert(params: {
  userId: string;
  farmId?: string | null;
  coopId?: string | null;
  lotId?: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
  entityKey: string;
  alertDate: Date;
}) {
  return prisma.alert.upsert({
    where: {
      userId_type_entityKey_alertDate: {
        userId: params.userId,
        type: params.type,
        entityKey: params.entityKey,
        alertDate: params.alertDate,
      },
    },
    update: {
      severity: params.severity,
      title: params.title,
      message: params.message,
      metadata: params.metadata,
      farmId: params.farmId ?? null,
      coopId: params.coopId ?? null,
      lotId: params.lotId ?? null,
    },
    create: {
      userId: params.userId,
      farmId: params.farmId ?? null,
      coopId: params.coopId ?? null,
      lotId: params.lotId ?? null,
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      metadata: params.metadata,
      entityKey: params.entityKey,
      alertDate: params.alertDate,
      isRead: false,
    },
  });
}

export async function generateOperationalAlerts(userId: string) {
  const today = startOfUtcDay(new Date());
  const tomorrow = addUtcDays(today, 1);
  const expectedEntryDate = addUtcDays(today, -1);

  // 1) Task due today/tomorrow (pending)
  const dueTasks = await prisma.calendarTask.findMany({
    where: {
      status: TaskStatus.PENDING,
      scheduledDate: {
        gte: today,
        lte: tomorrow,
      },
      lot: {
        coop: {
          farm: { userId },
        },
      },
    },
    include: {
      lot: {
        include: {
          coop: {
            include: {
              farm: true,
            },
          },
        },
      },
    },
  });

  for (const task of dueTasks) {
    const dueDate = startOfUtcDay(task.scheduledDate);
    const isToday = dayString(dueDate) === dayString(today);
    const title = isToday ? "Task due today" : "Task due tomorrow";

    await upsertOperationalAlert({
      userId,
      farmId: task.lot.coop.farm.id,
      coopId: task.lot.coop.id,
      lotId: task.lot.id,
      type: AlertType.TASK_DUE,
      severity: AlertSeverity.WARNING,
      title,
      message: `${task.title} • Lot ${task.lot.code} • ${dayString(task.scheduledDate)}`,
      metadata: {
        taskId: task.id,
        scheduledDate: dayString(task.scheduledDate),
        lotCode: task.lot.code,
      },
      entityKey: `task:${task.id}`,
      alertDate: dueDate,
    });
  }

  // 2) Missing daily entry on expected day (yesterday)
  const activeLots = await prisma.lot.findMany({
    where: {
      status: "active",
      coop: { farm: { userId } },
    },
    include: {
      coop: { include: { farm: true } },
    },
  });

  for (const lot of activeLots) {
    const lotStartDay = startOfUtcDay(lot.entryDate);
    if (lotStartDay > expectedEntryDate) {
      continue;
    }

    const entry = await prisma.dailyEntry.findUnique({
      where: {
        lotId_entryDate: {
          lotId: lot.id,
          entryDate: expectedEntryDate,
        },
      },
    });

    if (!entry) {
      await upsertOperationalAlert({
        userId,
        farmId: lot.coop.farm.id,
        coopId: lot.coop.id,
        lotId: lot.id,
        type: AlertType.MISSING_DAILY_ENTRY,
        severity: AlertSeverity.WARNING,
        title: "Missing daily entry",
        message: `No daily entry for Lot ${lot.code} on ${dayString(expectedEntryDate)}`,
        metadata: {
          lotCode: lot.code,
          missingDate: dayString(expectedEntryDate),
        },
        entityKey: `missing-entry:${lot.id}`,
        alertDate: expectedEntryDate,
      });
    }
  }

  // 3) High mortality based on expected day entry + alive baseline
  const expectedEntries = await prisma.dailyEntry.findMany({
    where: {
      entryDate: expectedEntryDate,
      lot: {
        status: "active",
        coop: { farm: { userId } },
      },
    },
    include: {
      lot: {
        include: {
          coop: { include: { farm: true } },
        },
      },
    },
  });

  for (const entry of expectedEntries) {
    const before = await prisma.dailyEntry.aggregate({
      where: {
        lotId: entry.lotId,
        entryDate: { lt: expectedEntryDate },
      },
      _sum: {
        mortalityCount: true,
      },
    });

    const previousMortality = before._sum.mortalityCount ?? 0;
    const baselineAlive = Math.max(
      1,
      entry.lot.initialCount - previousMortality,
    );
    const mortalityRatePct = (entry.mortalityCount / baselineAlive) * 100;

    if (mortalityRatePct > HIGH_MORTALITY_THRESHOLD_PCT) {
      await upsertOperationalAlert({
        userId,
        farmId: entry.lot.coop.farm.id,
        coopId: entry.lot.coop.id,
        lotId: entry.lot.id,
        type: AlertType.HIGH_MORTALITY,
        severity: AlertSeverity.CRITICAL,
        title: "High mortality detected",
        message: `Lot ${entry.lot.code}: ${mortalityRatePct.toFixed(2)}% on ${dayString(expectedEntryDate)}`,
        metadata: {
          dailyEntryId: entry.id,
          lotCode: entry.lot.code,
          mortalityCount: entry.mortalityCount,
          baselineAlive,
          mortalityRatePct: Number(mortalityRatePct.toFixed(4)),
          thresholdPct: HIGH_MORTALITY_THRESHOLD_PCT,
        },
        entityKey: `mortality:${entry.id}`,
        alertDate: expectedEntryDate,
      });
    }
  }
}

export async function listAlerts(userId: string, query: ListAlertsQueryDto) {
  await generateOperationalAlerts(userId);

  return prisma.alert.findMany({
    where: {
      userId,
      ...(query.unreadOnly ? { isRead: false } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.farmId ? { farmId: query.farmId } : {}),
      ...(query.lotId ? { lotId: query.lotId } : {}),
      ...(query.type ? { type: query.type } : {}),
    },
    include: {
      lot: { select: { id: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
    take: query.limit,
  });
}

export async function markAlertRead(userId: string, id: string) {
  const result = await prisma.alert.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });

  if (result.count === 0) {
    return { status: "not_found" as const };
  }

  const alert = await prisma.alert.findUnique({
    where: { id },
    include: { lot: { select: { id: true, code: true } } },
  });

  return { status: "ok" as const, alert };
}

export async function markAllAlertsRead(
  userId: string,
  query?: MarkAllReadDto,
) {
  const result = await prisma.alert.updateMany({
    where: {
      userId,
      isRead: false,
      ...(query?.farmId ? { farmId: query.farmId } : {}),
      ...(query?.lotId ? { lotId: query.lotId } : {}),
    },
    data: { isRead: true },
  });

  return { updated: result.count };
}
