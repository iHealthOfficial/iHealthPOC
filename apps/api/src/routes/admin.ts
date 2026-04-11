import type { Express, Request, Response } from "express";
import { prisma } from "../db.js";
import { logActivity } from "../activity/logActivity.js";
import { filterPatientPayloadByConsent } from "../consent/filterPatient.js";
import { mergeConsentIntersection } from "../consent/consentTypes.js";
import { requireAuth } from "../middleware/auth.js";
import { patientIncludeAll } from "./patientsIncludes.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function adminOnly(handler: (req: Request, res: Response) => void | Promise<void>) {
  return (req: Request, res: Response, next: (e?: unknown) => void) => {
    requireAuth(req, res, () => {
      if (req.auth?.role !== "admin") {
        res.status(403).json({ error: "Admin only" });
        return;
      }
      void Promise.resolve(handler(req, res)).catch(next);
    });
  };
}

export function registerAdminRoutes(app: Express) {
  app.get(
    "/api/admin/summary",
    adminOnly(async (_req: Request, res: Response) => {
      const [patientCount, userCount, feedbackUnreadCount, recentEvents] = await Promise.all([
        prisma.patient.count(),
        prisma.user.count(),
        prisma.feedbackReport.count({ where: { readAt: null } }),
        prisma.activityEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            actorUser: { select: { email: true } },
          },
        }),
      ]);

      res.json({
        patientCount,
        userCount,
        feedbackUnreadCount,
        recentEvents: recentEvents.map((e) => ({
          id: e.id,
          createdAt: e.createdAt.toISOString(),
          action: e.action,
          detail: e.detail,
          actorEmail: e.actorUser?.email ?? null,
          patientId: e.patientId,
          metaJson: e.metaJson,
        })),
      });
    }),
  );

  app.get("/api/admin/patients/:id", adminOnly(async (req: Request, res: Response) => {
    const id = String(req.params.id ?? "").trim();
    if (!id) {
      res.status(400).json({ error: "Missing id" });
      return;
    }

    const p = await prisma.patient.findUnique({
      where: { id },
      include: patientIncludeAll,
    });
    if (!p) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const linkedUsers = await prisma.user.findMany({
      where: { linkedPatientId: id },
      select: { id: true, consentScopesJson: true },
    });

    if (linkedUsers.length === 0) {
      res.json({
        ...p,
        _adminConsent: { applied: false, reason: "no_linked_user" as const },
      });
      return;
    }

    const merged = mergeConsentIntersection(linkedUsers);
    const filtered = filterPatientPayloadByConsent(p as unknown as Record<string, unknown>, merged);
    res.json({
      ...(filtered as typeof p),
      _adminConsent: {
        applied: true,
        linkedUserCount: linkedUsers.length,
        scopes: merged,
      },
    });
  }));

  app.get("/api/admin/patients/:id/activity", adminOnly(async (req: Request, res: Response) => {
    const id = String(req.params.id ?? "").trim();
    if (!id) {
      res.status(400).json({ error: "Missing id" });
      return;
    }

    const linkedAccounts = await prisma.user.findMany({
      where: { linkedPatientId: id },
      select: { id: true },
    });
    const linkedIds = linkedAccounts.map((u) => u.id);

    const events = await prisma.activityEvent.findMany({
      where:
        linkedIds.length > 0
          ? {
              OR: [{ patientId: id }, { actorUserId: { in: linkedIds } }],
            }
          : { patientId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { actorUser: { select: { email: true } } },
    });

    res.json({
      events: events.map((e) => ({
        id: e.id,
        createdAt: e.createdAt.toISOString(),
        action: e.action,
        detail: e.detail,
        actorEmail: e.actorUser?.email ?? null,
        metaJson: e.metaJson,
      })),
    });
  }));

  app.delete("/api/admin/patients/:id", adminOnly(async (req: Request, res: Response) => {
    const id = String(req.params.id ?? "").trim();
    if (!id || !UUID_RE.test(id)) {
      res.status(400).json({ error: "Invalid patient id" });
      return;
    }

    const existing = await prisma.patient.findUnique({
      where: { id },
      select: { id: true, family: true, given: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    const actorUserId = req.auth?.userId ?? null;
    let givenPreview = "";
    try {
      const g = JSON.parse(existing.given) as unknown;
      givenPreview = Array.isArray(g) ? g.join(" ") : String(existing.given);
    } catch {
      givenPreview = existing.given;
    }
    const label = [existing.family, givenPreview].filter(Boolean).join(", ") || id;

    await prisma.patient.delete({ where: { id } });

    await logActivity({
      actorUserId,
      patientId: null,
      action: "admin_patient_delete",
      detail: `Deleted patient ${label} (${id})`,
      meta: { deletedPatientId: id },
    });

    res.json({ ok: true, deletedId: id });
  }));
}
