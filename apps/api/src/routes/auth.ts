import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { logActivity } from "../activity/logActivity.js";
import { signUserToken } from "../auth/jwt.js";
import {
  CONSENT_RESOURCE_TYPES,
  defaultConsentScopes,
  parseConsentScopesJson,
} from "../consent/consentTypes.js";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const linkPatientBody = z.object({
  patientId: z.union([z.string().uuid("Invalid patient id"), z.null()]),
});

const registerBody = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().trim().max(120).optional(),
});

const loginBody = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const consentBody = z.object({
  scopes: z.record(z.boolean()),
});

function publicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    role: u.role as "user" | "admin",
    displayName: u.displayName ?? undefined,
    linkedPatientId: u.linkedPatientId ?? undefined,
    consentScopes: parseConsentScopesJson(u.consentScopesJson),
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
    await logActivity({
      actorUserId: user.id,
      action: "auth_register",
      detail: "Account created",
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
    await logActivity({
      actorUserId: user.id,
      patientId: user.linkedPatientId ?? undefined,
      action: "auth_login",
      detail: "Signed in",
    });
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

  app.put("/api/me/consent-scopes", requireAuth, async (req: Request, res: Response) => {
    const parsed = consentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid scopes" });
      return;
    }
    const uid = req.auth!.userId;
    for (const k of Object.keys(parsed.data.scopes)) {
      if (!CONSENT_RESOURCE_TYPES.includes(k as (typeof CONSENT_RESOURCE_TYPES)[number])) {
        res.status(400).json({ error: `Unknown consent key: ${k}` });
        return;
      }
    }
    const merged = { ...defaultConsentScopes(), ...parsed.data.scopes };
    const user = await prisma.user.update({
      where: { id: uid },
      data: { consentScopesJson: JSON.stringify(merged) },
    });
    await logActivity({
      actorUserId: uid,
      patientId: user.linkedPatientId ?? undefined,
      action: "consent_saved",
      detail: "Consent preferences saved",
    });
    res.json({ user: publicUser(user) });
  });

  app.put("/api/me/linked-patient", requireAuth, async (req: Request, res: Response) => {
    const parsed = linkPatientBody.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors.patientId?.[0] ?? "Invalid input";
      res.status(400).json({ error: first });
      return;
    }
    const { patientId } = parsed.data;
    const uid = req.auth!.userId;

    if (patientId) {
      const p = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!p) {
        res.status(404).json({ error: "Patient not found" });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: uid },
      data: { linkedPatientId: patientId },
    });
    await logActivity({
      actorUserId: uid,
      patientId: patientId ?? undefined,
      action: patientId ? "patient_link" : "patient_unlink",
      detail: patientId ? "Linked account to patient record" : "Unlinked patient record",
    });
    res.json({ user: publicUser(user) });
  });
}
