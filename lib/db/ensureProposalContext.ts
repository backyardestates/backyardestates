import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

// All proposals currently roll up to a single "Backyard Estates" org.
// Once you have explicit team / organization management this id becomes
// per-team and we look it up from the user's Membership.
const DEFAULT_ORG_ID = "be_default_org";
const DEFAULT_ORG_NAME = "Backyard Estates";

/**
 * Ensure the current Clerk-authed user has a `User` row, a default
 * `Organization`, and a `Membership` linking them. Returns the user + org ids
 * for use when creating Proposal rows.
 *
 * Idempotent: safe to call on every authenticated request.
 */
export async function ensureProposalContext(): Promise<{
    userId: string;
    organizationId: string;
    role: Role;
}> {
    // Upserts the User row by Clerk userId (also keeps email/phone/role in sync).
    const dbUser = await getDbUser();

    // Make sure the default org exists (once per project lifetime).
    await prisma.organization.upsert({
        where: { id: DEFAULT_ORG_ID },
        update: {},
        create: {
            id: DEFAULT_ORG_ID,
            name: DEFAULT_ORG_NAME,
        },
    });

    // Make sure this user is a member of the org. Composite unique constraint
    // on (organizationId, userId) lets us upsert safely.
    await prisma.membership.upsert({
        where: {
            organizationId_userId: {
                organizationId: DEFAULT_ORG_ID,
                userId: dbUser.id,
            },
        },
        update: {},
        create: {
            organizationId: DEFAULT_ORG_ID,
            userId: dbUser.id,
            role: dbUser.role, // mirror the user's DB role on the membership
        },
    });

    return {
        userId: dbUser.id,
        organizationId: DEFAULT_ORG_ID,
        role: dbUser.role,
    };
}
