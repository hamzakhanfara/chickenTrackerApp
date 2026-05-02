import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  createCoopSchema,
  updateCoopSchema,
} from "../validators/coop.validator";
import * as coopsService from "../services/coops.service";

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
  const parsed = createCoopSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const coop = await coopsService.createCoop(
    req.user!.id,
    req.params.farmId,
    parsed.data,
  );
  if (!coop) {
    res.status(404).json({ success: false, error: "Farm not found" });
    return;
  }
  res.status(201).json({ success: true, data: coop });
}

export async function list(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { page, limit } = paginationParams(req.query);
  const result = await coopsService.listCoops(
    req.user!.id,
    req.params.farmId,
    page,
    limit,
  );
  if (!result) {
    res.status(404).json({ success: false, error: "Farm not found" });
    return;
  }
  res.json({ success: true, data: result });
}

export async function getOne(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const coop = await coopsService.getCoop(req.user!.id, req.params.coopId);
  if (!coop) {
    res.status(404).json({ success: false, error: "Coop not found" });
    return;
  }
  res.json({ success: true, data: coop });
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = updateCoopSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const coop = await coopsService.updateCoop(
    req.user!.id,
    req.params.coopId,
    parsed.data,
  );
  if (!coop) {
    res.status(404).json({ success: false, error: "Coop not found" });
    return;
  }
  res.json({ success: true, data: coop });
}

export async function remove(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const result = await coopsService.deleteCoop(req.user!.id, req.params.coopId);
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Coop not found" });
    return;
  }
  if (result.status === "has_lots") {
    res
      .status(409)
      .json({ success: false, error: "Coop has lots. Remove lots first." });
    return;
  }
  res.json({ success: true, data: { message: "Coop deleted" } });
}
