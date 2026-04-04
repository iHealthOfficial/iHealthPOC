import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Monorepo root: iHealth/ */
export const repoRoot = path.resolve(__dirname, "..", "..", "..");

export const manualDir = path.join(repoRoot, "manual");
export const uploadsDir = path.join(repoRoot, "uploads");
/** Vite production build — served by Express on the same port as the API */
export const webDistDir = path.join(repoRoot, "apps", "web", "dist");

export function ensureUploadsDir(): void {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}
