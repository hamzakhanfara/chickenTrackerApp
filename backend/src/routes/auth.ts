import { Router, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { supabase } from "../lib/supabase";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const prisma = new PrismaClient();

const router = Router();

const authSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// POST /auth/register
router.post("/register", async (req, res: Response): Promise<void> => {
  const result = authSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid input",
    });
    return;
  }

  const { email, password } = result.data;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      res
        .status(409)
        .json({ success: false, error: "Email already registered" });
      return;
    }
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  // Supabase returns a user with an identity when email is already registered
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    res.status(409).json({ success: false, error: "Email already registered" });
    return;
  }

  // Create user record in Prisma
  if (data.user) {
    try {
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {},
        create: {
          id: data.user.id,
          email,
          role: "farmer",
        },
      });
    } catch (dbError) {
      console.error("Failed to create user record:", dbError);
      res
        .status(500)
        .json({ success: false, error: "Failed to register user" });
      return;
    }
  }

  res
    .status(201)
    .json({ success: true, data: { message: "Registration successful" } });
});

// POST /auth/login
router.post("/login", async (req, res: Response): Promise<void> => {
  const result = authSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid input",
    });
    return;
  }

  const { email, password } = result.data;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    res
      .status(401)
      .json({ success: false, error: "Invalid email or password" });
    return;
  }

  // Ensure user record exists in Prisma
  try {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: {},
      create: {
        id: data.user.id,
        email: data.user.email ?? email,
        role: "farmer",
      },
    });
  } catch (dbError) {
    console.error("Failed to upsert user record:", dbError);
    res.status(500).json({ success: false, error: "Failed to login user" });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    },
  });
});

// POST /auth/logout (protected)
router.post(
  "/logout",
  authMiddleware,
  async (_req, res: Response): Promise<void> => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true, data: { message: "Logged out" } });
  },
);

// GET /auth/me (protected)
router.get(
  "/me",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    res.status(200).json({ success: true, data: req.user });
  },
);

export default router;
