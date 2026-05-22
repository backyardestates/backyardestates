// Load env files the same way Next.js does: .env first, then .env.local
// overrides. Prisma CLI (build, migrate, etc.) doesn't read .env.local on
// its own, so without this the build fails with "Cannot resolve DATABASE_URL".
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

import { defineConfig } from "prisma/config";

// Resolve a migration-time URL. Prefer DIRECT_URL (set when Accelerate is in
// front of DATABASE_URL) so migrate/seed talk to Postgres directly. Falls
// back to DATABASE_URL for local setups that aren't on Accelerate yet.
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!migrationUrl) {
    throw new Error(
        "Set DATABASE_URL (and DIRECT_URL if using Accelerate) before running Prisma CLI.",
    );
}

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "node prisma/seed.js",
    },
    datasource: {
        url: migrationUrl,
    },
});
