import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  createFarmSchema,
  updateFarmSchema,
} from "../validators/farm.validator";
import * as farmsService from "../services/farms.service";

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
  const parsed = createFarmSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const farm = await farmsService.createFarm(req.user!.id, parsed.data);
  res.status(201).json({ success: true, data: farm });
}

export async function list(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { page, limit } = paginationParams(req.query);
  const result = await farmsService.listFarms(req.user!.id, page, limit);
  res.json({ success: true, data: result });
}

export async function getOne(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const farm = await farmsService.getFarm(req.user!.id, req.params.farmId);
  if (!farm) {
    res.status(404).json({ success: false, error: "Farm not found" });
    return;
  }
  res.json({ success: true, data: farm });
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = updateFarmSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }
  const farm = await farmsService.updateFarm(
    req.user!.id,
    req.params.farmId,
    parsed.data,
  );
  if (!farm) {
    res.status(404).json({ success: false, error: "Farm not found" });
    return;
  }
  res.json({ success: true, data: farm });
}

export async function remove(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const result = await farmsService.deleteFarm(req.user!.id, req.params.farmId);
  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Farm not found" });
    return;
  }
  if (result.status === "has_coops") {
    res
      .status(409)
      .json({ success: false, error: "Farm has coops. Remove coops first." });
    return;
  }
  res.json({ success: true, data: { message: "Farm deleted" } });
}
