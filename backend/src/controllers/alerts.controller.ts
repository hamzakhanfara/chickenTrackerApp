import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  alertIdParamSchema,
  listAlertsQuerySchema,
  markAllReadSchema,
} from "../validators/alerts.validator";
import * as alertsService from "../services/alerts.service";

export async function list(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = listAlertsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const alerts = await alertsService.listAlerts(req.user!.id, parsed.data);
  res.json({ success: true, data: alerts });
}

export async function markRead(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsedParams = alertIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res
      .status(400)
      .json({ success: false, error: parsedParams.error.issues[0]?.message });
    return;
  }

  const result = await alertsService.markAlertRead(
    req.user!.id,
    parsedParams.data.id,
  );

  if (result.status === "not_found") {
    res.status(404).json({ success: false, error: "Alert not found" });
    return;
  }

  res.json({ success: true, data: result.alert });
}

export async function markAllRead(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsedQuery = markAllReadSchema.safeParse(req.query);
  if (!parsedQuery.success) {
    res
      .status(400)
      .json({ success: false, error: parsedQuery.error.issues[0]?.message });
    return;
  }

  const result = await alertsService.markAllAlertsRead(
    req.user!.id,
    parsedQuery.data,
  );
  res.json({ success: true, data: result });
}
