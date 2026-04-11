/**
 * Creates or updates the admin account (bcrypt hash in DB — plaintext is never stored).
 *
 * Run from apps/api: npx prisma db seed
 * Or from repo root: npm run db:seed
 *
 * Override defaults with env (recommended for any shared/hosted environment):
 *   ADMIN_EMAIL=you@domain.com ADMIN_PASSWORD='strong-secret' npx prisma db seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = "admin@ihealthhub.in";
const DEFAULT_ADMIN_PASSWORD = "AdminChangeMe!";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: "admin",
      displayName: "Administrator",
    },
    update: {
      passwordHash,
      role: "admin",
    },
  });

  const usingDefaultPassword = !process.env.ADMIN_PASSWORD;
  console.log("");
  console.log("iHealth — admin user is ready in the database:");
  console.log(`  Email:    ${email}`);
  if (usingDefaultPassword) {
    console.log(`  Password: ${DEFAULT_ADMIN_PASSWORD}`);
    console.log("  (default — set ADMIN_PASSWORD before seed in production)");
  } else {
    console.log("  Password: (value from ADMIN_PASSWORD env — not printed here)");
  }
  console.log("");
  console.log("Sign in with the email and password above (Admin dashboard after login).");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
