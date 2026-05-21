// Load env files the same way Next.js does: .env first, then .env.local
// overrides. Prisma CLI (build, migrate, etc.) doesn't read .env.local on
// its own, so without this the build fails with "Cannot resolve DATABASE_URL".
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "node prisma/seed.js",
    },
    datasource: {
        url: env("DATABASE_URL"),
    },
});
