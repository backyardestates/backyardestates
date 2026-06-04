import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

// All proposals currently roll up to a single "Backyard Estates" org.
// Once you have explicit team / organization management this id becomes
// per-team and we look it up from the user's Membership.
const DEFAULT_ORG_ID = "be_default_org";
const DEFAULT_ORG_NAME = "Backyard Estates";

// Users whose org + membership rows have been confirmed by this serverless
// instance. Once confirmed they can't un-exist (we never delete the default
// org, and membership deletion only happens via user deletion, which also
// invalidates the session), so a plain Set is safe — no TTL needed.
//
// This used to be two unconditional UPSERTs (writes) on EVERY authenticated
// request across ~80 routes, including the admin tool's 1.5s autosaves.
const ensured = new Set<string>();

/**
 * Ensure the current Clerk-authed user has a `User` row, a default
 * `Organization`, and a `Membership` linking them. Returns the user + org ids
 * for use when creating Proposal rows.
 *
 * Idempotent: safe to call on every authenticated request. Hot path (already
 * confirmed this instance) does zero queries beyond the memoized user lookup.
 */
export async function ensureProposalContext(): Promise<{
    userId: string;
    organizationId: string;
    role: Role;
}> {
    // Memoized: 0 Clerk calls / 0 writes within the TTL window (lib/auth.ts).
    const dbUser = await getDbUser();

    if (!ensured.has(dbUser.id)) {
        // Read-first; create only what's actually missing.
        const org = await prisma.organization.findUnique({
            where: { id: DEFAULT_ORG_ID },
            select: { id: true },
        });
        if (!org) {
            await prisma.organization.create({
                data: { id: DEFAULT_ORG_ID, name: DEFAULT_ORG_NAME },
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: DEFAULT_ORG_ID,
                    userId: dbUser.id,
                },
            },
            select: { id: true },
        });
        if (!membership) {
            await prisma.membership.create({
                data: {
                    organizationId: DEFAULT_ORG_ID,
                    userId: dbUser.id,
                    role: dbUser.role, // mirror the user's DB role on the membership
                },
            });
        }
        ensured.add(dbUser.id);
    }

    return {
        userId: dbUser.id,
        organizationId: DEFAULT_ORG_ID,
        role: dbUser.role,
    };
}
