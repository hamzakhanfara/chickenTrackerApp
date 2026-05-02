import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  createDailyEntrySchema,
  dailyEntryDateParamSchema,
} from "../validators/dailyEntry.validator";
import * as dailyEntriesService from "../services/dailyEntries.service";

function paginationParams(query: any) {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit ?? "20", 10) || 20),
  );
  return { page, limit };
}

export async function create(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = createDailyEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const result = await dailyEntriesService.createDailyEntry(
    req.user!.id,
    req.params.lotId,
    parsed.data,
  );

  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }

  if (result.status === "forbidden") {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }

  if (result.status === "lot_closed") {
    res
      .status(400)
      .json({ success: false, error: "Cannot create entry for closed lot" });
    return;
  }

  if (result.status === "before_lot_start") {
    res
      .status(400)
      .json({ success: false, error: "Entry date cannot be before lot start" });
    return;
  }

  if (result.status === "future_date") {
    res
      .status(400)
      .json({ success: false, error: "Entry date is too far in the future" });
    return;
  }

  if (result.status === "duplicate") {
    res
      .status(409)
      .json({
        success: false,
        error: "Entry already exists for this lot/date",
      });
    return;
  }

  res.status(201).json({ success: true, data: result.entry });
}

export async function list(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { page, limit } = paginationParams(req.query);
  const result = await dailyEntriesService.listDailyEntries(
    req.user!.id,
    req.params.lotId,
    page,
    limit,
  );

  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }

  if (result.status === "forbidden") {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }

  res.json({ success: true, data: result.data });
}

export async function getByDate(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = dailyEntryDateParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const result = await dailyEntriesService.getDailyEntryByDate(
    req.user!.id,
    req.params.lotId,
    parsed.data.entryDate,
  );

  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }

  if (result.status === "forbidden") {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }

  if (result.status === "entry_not_found") {
    res.status(404).json({ success: false, error: "Daily entry not found" });
    return;
  }

  res.json({ success: true, data: result.entry });
}
