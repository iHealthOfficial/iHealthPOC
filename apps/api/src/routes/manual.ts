import fs from "node:fs";
import path from "node:path";
import type { Express, Request, Response } from "express";
import { manualDir } from "../paths.js";
import { paramString } from "../routeParams.js";

type ManifestPage = {
  id: string;
  title: string;
  file: string;
};

type Manifest = {
  title: string;
  pages: ManifestPage[];
};

function readManifest(): Manifest {
  const p = path.join(manualDir, "manifest.json");
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw) as Manifest;
}

export function registerManualRoutes(app: Express): void {
  app.get("/api/manual/manifest", (_req: Request, res: Response) => {
    try {
      res.json(readManifest());
    } catch {
      res.status(500).json({ error: "Could not read manual manifest" });
    }
  });

  app.get("/api/manual/section/:id", (req: Request, res: Response) => {
    try {
      const sectionId = paramString(req.params.id);
      if (!sectionId) {
        res.status(400).json({ error: "Missing section id" });
        return;
      }
      const manifest = readManifest();
      const page = manifest.pages.find((p) => p.id === sectionId);
      if (!page) {
        res.status(404).json({ error: "Unknown section" });
        return;
      }
      const filePath = path.resolve(manualDir, page.file);
      if (!filePath.startsWith(path.resolve(manualDir))) {
        res.status(400).json({ error: "Invalid path" });
        return;
      }
      const html = fs.readFileSync(filePath, "utf-8");
      res.type("html").send(html);
    } catch {
      res.status(500).json({ error: "Could not load section" });
    }
  });
}
