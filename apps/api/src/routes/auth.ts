import bcrypt from "bcryptjs";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { signUserToken } from "../auth/jwt.js";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const registerBody = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().trim().max(120).optional(),
});

const loginBody = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

function publicUser(u: { id: string; email: string; role: string; displayName: string | null }) {
  return {
    id: u.id,
    email: u.email,
    role: u.role as "user" | "admin",
    displayName: u.displayName ?? undefined,
  };
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const parsed = registerBody.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors;
      const first = Object.values(msg)[0]?.[0] ?? "Invalid input";
      res.status(400).json({ error: first });
      return;
    }
    const { email, password, displayName } = parsed.data;
    const normalized = email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        displayName: displayName || null,
        role: "user",
      },
    });
    const token = await signUserToken(user.id, user.email, user.role);
    res.status(201).json({ token, user: publicUser(user) });
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors;
      const first = Object.values(msg)[0]?.[0] ?? "Invalid input";
      res.status(400).json({ error: first });
      return;
    }
    const { email, password } = parsed.data;
    const normalized = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = await signUserToken(user.id, user.email, user.role);
    res.json({ token, user: publicUser(user) });
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    const id = req.auth!.userId;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ user: publicUser(user) });
  });
}
