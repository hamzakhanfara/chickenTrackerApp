import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);

  if (!bearerMatch) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const token = bearerMatch[1].trim().replace(/^"|"$/g, "");

  if (!token) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    console.error(
      "[authMiddleware] Invalid token",
      error?.message ?? "No user",
    );
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  req.user = {
    id: data.user.id,
    email: data.user.email ?? "",
  };

  next();
}
