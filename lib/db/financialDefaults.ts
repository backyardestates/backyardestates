import { prisma } from "@/lib/prisma";
import { DEFAULTS, type Defaults } from "@/lib/investment/types";

const SINGLETON_ID = "default";

/**
 * Read the canonical financial defaults from the DB. Seeds the row with the
 * code-defined DEFAULTS the first time it's accessed, so the catalog is never
 * empty and the admin always has a working starting point.
 */
export async function getFinancialDefaults(): Promise<Defaults> {
    const row = await prisma.financialDefaults.upsert({
        where: { id: SINGLETON_ID },
        update: {},
        create: { id: SINGLETON_ID, ...DEFAULTS },
    });

    // Strip DB-only columns to return a clean Defaults shape.
    const { id, updatedAt, updatedById, ...defaults } = row;
    return defaults satisfies Defaults;
}

/**
 * Replace the financial defaults. Caller is responsible for auth checks.
 * Returns the updated defaults.
 */
export async function setFinancialDefaults(
    next: Defaults,
    updatedById: string | null
): Promise<Defaults> {
    const row = await prisma.financialDefaults.upsert({
        where: { id: SINGLETON_ID },
        create: { id: SINGLETON_ID, ...next, updatedById: updatedById ?? undefined },
        update: { ...next, updatedById: updatedById ?? undefined },
    });

    const { id, updatedAt, updatedById: _u, ...defaults } = row;
    return defaults satisfies Defaults;
}
