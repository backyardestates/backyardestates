import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Runtime Prisma client.
 *
 * In Prisma 7, schema.prisma can't carry a `url` — the runtime URL comes
 * from one of two paths:
 *
 *   1. `accelerateUrl` option  → for `prisma+postgres://accelerate...` URLs.
 *      Queries route through Accelerate's HTTP proxy with global pooling and
 *      edge support, no client-side adapter needed.
 *
 *   2. `adapter` option        → for plain `postgres://` / `postgresql://`
 *      URLs. Uses PrismaPg for a direct TCP connection.
 *
 * We sniff DATABASE_URL and pick the right shape so the same code works in
 * both local-Postgres dev and Accelerate prod.
 *
 * For explicit per-query caching (`.cache({ ttl: 60 })`), the
 * `@prisma/extension-accelerate` extension is installed but not applied
 * here — it currently narrows a handful of select/groupBy return types in
 * Prisma 7.3. Wrap with `.$extends(withAccelerate())` once you need it and
 * cast the affected sites.
 */

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local.");
}

const isAccelerateUrl =
    databaseUrl.startsWith("prisma+postgres://") ||
    databaseUrl.startsWith("prisma://");

function createPrismaClient(): PrismaClient {
    if (isAccelerateUrl) {
        return new PrismaClient({ accelerateUrl: databaseUrl });
    }
    return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    // Reuse across Next.js dev HMR reloads.
    globalForPrisma.prisma = prisma;
}
