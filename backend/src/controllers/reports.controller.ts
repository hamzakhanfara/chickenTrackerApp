import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  reportEstimatorQuerySchema,
  reportParamsSchema,
} from "../validators/reports.validator";
import * as reportsService from "../services/reports.service";

export async function getLotSummary(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const paramsParsed = reportParamsSchema.safeParse(req.params);
  if (!paramsParsed.success || !paramsParsed.data.lotId) {
    res.status(400).json({ success: false, error: "Invalid lotId" });
    return;
  }

  const queryParsed = reportEstimatorQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    res
      .status(400)
      .json({ success: false, error: queryParsed.error.issues[0]?.message });
    return;
  }

  const result = await reportsService.getLotSummary(
    req.user!.id,
    paramsParsed.data.lotId,
    queryParsed.data,
  );

  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Lot not found" });
    return;
  }

  res.json({ success: true, data: result.report });
}

export async function getCoopSummary(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const paramsParsed = reportParamsSchema.safeParse(req.params);
  if (!paramsParsed.success || !paramsParsed.data.coopId) {
    res.status(400).json({ success: false, error: "Invalid coopId" });
    return;
  }

  const queryParsed = reportEstimatorQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    res
      .status(400)
      .json({ success: false, error: queryParsed.error.issues[0]?.message });
    return;
  }

  const result = await reportsService.getCoopSummary(
    req.user!.id,
    paramsParsed.data.coopId,
    queryParsed.data,
  );

  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Coop not found" });
    return;
  }

  res.json({ success: true, data: result.report });
}

export async function getFarmSummary(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const paramsParsed = reportParamsSchema.safeParse(req.params);
  if (!paramsParsed.success || !paramsParsed.data.farmId) {
    res.status(400).json({ success: false, error: "Invalid farmId" });
    return;
  }

  const queryParsed = reportEstimatorQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    res
      .status(400)
      .json({ success: false, error: queryParsed.error.issues[0]?.message });
    return;
  }

  const result = await reportsService.getFarmSummary(
    req.user!.id,
    paramsParsed.data.farmId,
    queryParsed.data,
  );

  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Farm not found" });
    return;
  }

  res.json({ success: true, data: result.report });
}
