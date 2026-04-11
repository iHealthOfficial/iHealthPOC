import type { Express, NextFunction, Request, Response } from "express";
import { z } from "zod";
import { logActivity } from "../activity/logActivity.js";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const feedbackBody = z.object({
  kind: z.enum(["bug", "suggestion"]),
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().trim().min(1, "Description is required").max(8000, "Description is too long"),
});

function requireAuthThen(
  handler: (req: Request, res: Response) => void | Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      void Promise.resolve(handler(req, res)).catch(next);
    });
  };
}

function adminOnly(handler: (req: Request, res: Response) => void | Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (req.auth?.role !== "admin") {
        res.status(403).json({ error: "Admin only" });
        return;
      }
      void Promise.resolve(handler(req, res)).catch(next);
    });
  };
}

export function registerFeedbackRoutes(app: Express): void {
  app.post(
    "/api/feedback",
    requireAuthThen(async (req: Request, res: Response) => {
      const parsed = feedbackBody.safeParse(req.body);
      if (!parsed.success) {
        const first = parsed.error.flatten().fieldErrors;
        const msg = Object.values(first)[0]?.[0] ?? "Invalid input";
        res.status(400).json({ error: msg });
        return;
      }
      const { kind, title, description } = parsed.data;
      const userId = req.auth!.userId;

      const row = await prisma.feedbackReport.create({
        data: {
          kind,
          title,
          description,
          userId,
        },
      });

      await logActivity({
        actorUserId: userId,
        action: kind === "bug" ? "feedback_bug" : "feedback_suggestion",
        detail: title.slice(0, 200),
        meta: { feedbackId: row.id },
      });

      res.status(201).json({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        kind: row.kind,
        title: row.title,
      });
    }),
  );

  app.get(
    "/api/admin/feedback",
    adminOnly(async (_req: Request, res: Response) => {
      const rows = await prisma.feedbackReport.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      });

      res.json({
        items: rows.map((r) => ({
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          kind: r.kind,
          title: r.title,
          description: r.description,
          readAt: r.readAt?.toISOString() ?? null,
          user: {
            id: r.user.id,
            email: r.user.email,
            displayName: r.user.displayName,
          },
        })),
      });
    }),
  );

  app.patch(
    "/api/admin/feedback/:id/read",
    adminOnly(async (req: Request, res: Response) => {
      const id = String(req.params.id ?? "").trim();
      if (!id) {
        res.status(400).json({ error: "Missing id" });
        return;
      }
      const existing = await prisma.feedbackReport.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const row = await prisma.feedbackReport.update({
        where: { id },
        data: { readAt: existing.readAt ?? new Date() },
      });
      res.json({
        id: row.id,
        readAt: row.readAt!.toISOString(),
      });
    }),
  );

  app.post(
    "/api/admin/feedback/mark-all-read",
    adminOnly(async (_req: Request, res: Response) => {
      const result = await prisma.feedbackReport.updateMany({
        where: { readAt: null },
        data: { readAt: new Date() },
      });
      res.json({ updated: result.count });
    }),
  );
}
