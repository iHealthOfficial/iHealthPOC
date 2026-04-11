/**
 * Load `apps/api/.env` regardless of whether the process was started from the monorepo root
 * or from `apps/api`. Ensures Prisma always sees DATABASE_URL for local dev.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envFile });

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = "file:./dev.db";
}

/** HS256 signing secret for JWT. Set JWT_SECRET in apps/api/.env for production. */
if (!process.env.JWT_SECRET?.trim()) {
  process.env.JWT_SECRET = "dev-only-insecure-jwt-secret-change-me";
}
