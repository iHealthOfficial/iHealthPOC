import fs from "node:fs";
import path from "node:path";
import type { Express, Request, Response } from "express";
import multer from "multer";
import { prisma } from "../db.js";
import { processUploadArtifact } from "../services/processUpload.js";
import { ensureUploadsDir, uploadsDir } from "../paths.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const uploadListSelect = {
  id: true,
  createdAt: true,
  patientId: true,
  originalName: true,
  mimeType: true,
  storagePath: true,
  sizeBytes: true,
  scanStatus: true,
  scanMessage: true,
  ocrStatus: true,
  ocrMessage: true,
} as const;

export function registerUploadRoutes(app: Express): void {
  app.post(
    "/api/upload",
    upload.single("file"),
    async (req: Request, res: Response) => {
      if (!req.file) {
        res.status(400).json({ error: "Missing file field `file`" });
        return;
      }
      const patientId = typeof req.body.patientId === "string" && req.body.patientId ? req.body.patientId : null;

      if (patientId) {
        const p = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!p) {
          fs.unlinkSync(req.file.path);
          res.status(400).json({ error: "Unknown patientId" });
          return;
        }
      }

      const row = await prisma.uploadArtifact.create({
        data: {
          patientId: patientId ?? undefined,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          storagePath: req.file.filename,
          sizeBytes: req.file.size,
        },
      });

      try {
        await processUploadArtifact(row.id, req.file.filename, req.file.mimetype);
      } catch (e) {
        console.error("processUploadArtifact", e);
        await prisma.uploadArtifact.update({
          where: { id: row.id },
          data: {
            scanStatus: "error",
            scanMessage: "Processing failed unexpectedly",
            ocrStatus: "error",
            ocrMessage: e instanceof Error ? e.message : String(e),
          },
        });
      }

      const updated = await prisma.uploadArtifact.findUnique({ where: { id: row.id } });
      res.status(201).json(updated);
    },
  );

  app.get("/api/uploads", async (_req: Request, res: Response) => {
    const rows = await prisma.uploadArtifact.findMany({
      orderBy: { createdAt: "desc" },
      select: uploadListSelect,
    });
    res.json(rows);
  });

  app.get("/api/uploads/:id/file", async (req: Request, res: Response) => {
    const row = await prisma.uploadArtifact.findUnique({ where: { id: req.params.id } });
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const abs = path.resolve(uploadsDir, row.storagePath);
    if (!abs.startsWith(path.resolve(uploadsDir)) || !fs.existsSync(abs)) {
      res.status(404).json({ error: "File missing" });
      return;
    }
    res.sendFile(abs);
  });

  app.get("/api/uploads/:id", async (req: Request, res: Response) => {
    const row = await prisma.uploadArtifact.findUnique({ where: { id: req.params.id } });
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  });
}
