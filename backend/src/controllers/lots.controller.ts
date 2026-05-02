import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { createLotSchema, updateLotSchema } from "../validators/lot.validator";
import * as lotsService from "../services/lots.service";

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
  const parsed = createLotSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const result = await lotsService.createLot(
    req.user!.id,
    req.params.coopId,
    parsed.data,
  );
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Coop not found" });
    return;
  }
  if (result.status === "active_lot_exists") {
    res
      .status(409)
      .json({
        success: false,
        error: "An active lot already exists for this coop",
      });
    return;
  }
  if (result.status === "duplicate_code") {
    res.status(409).json({ success: false, error: "Lot code already in use" });
    return;
  }
  res.status(201).json({ success: true, data: result.lot });
}

export async function list(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { page, limit } = paginationParams(req.query);
  const result = await lotsService.listLots(
    req.user!.id,
    req.params.coopId,
    page,
    limit,
  );
  if (!result) {
    res.status(404).json({ success: false, error: "Coop not found" });
    return;
  }
  res.json({ success: true, data: result });
}

export async function getOne(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const lot = await lotsService.getLot(req.user!.id, req.params.lotId);
  if (!lot) {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }
  res.json({ success: true, data: lot });
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = updateLotSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const result = await lotsService.updateLot(
    req.user!.id,
    req.params.lotId,
    parsed.data,
  );
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }
  if (result.status === "closed") {
    res
      .status(409)
      .json({ success: false, error: "Closed lots cannot be updated" });
    return;
  }
  if (result.status === "duplicate_code") {
    res.status(409).json({ success: false, error: "Lot code already in use" });
    return;
  }
  res.json({ success: true, data: result.lot });
}

export async function closeLot(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const result = await lotsService.closeLot(req.user!.id, req.params.lotId);
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }
  if (result.status === "already_closed") {
    res.status(409).json({ success: false, error: "Lot is already closed" });
    return;
  }
  if (result.status === "cancelled") {
    res
      .status(409)
      .json({ success: false, error: "Cancelled lots cannot be closed" });
    return;
  }
  res.json({ success: true, data: result.lot });
}

export async function remove(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const result = await lotsService.deleteLot(req.user!.id, req.params.lotId);
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }
  if (result.status === "not_cancelled") {
    res
      .status(409)
      .json({ success: false, error: "Only cancelled lots can be deleted" });
    return;
  }
  if (result.status === "has_records") {
    res
      .status(409)
      .json({
        success: false,
        error: "Lot has dependent records and cannot be deleted",
      });
    return;
  }
  res.json({ success: true, data: { message: "Lot deleted" } });
}
