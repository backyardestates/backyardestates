import { cache } from "react";
import { clerkClient } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "../../types/roles";

export type MergedUser = {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    /** The effective role: DB value when the user has a DB row, otherwise
     *  whatever Clerk publicMetadata.role says (defaults to CUSTOMER). */
    role: Role;
    /** Whether this user has been bootstrapped into our DB. False = signed up
     *  on Clerk but never hit a route that calls getDbUser. */
    inDb: boolean;
    createdAt: Date;
    lastSignInAt: Date | null;
    counts: {
        proposalsCreated: number;
        proposalsAssigned: number;
        feasibilityReports: number;
    };
};

/**
 * Fetch every user the system knows about — both the Clerk authoritative
 * directory and our local DB (which only has rows for users who've made at
 * least one authenticated request). Merged by id; Clerk identity fields win
 * (email, name, phone), DB role wins for users that have one, with Clerk's
 * publicMetadata.role as the fallback for Clerk-only users.
 *
 * `limit` is intentionally high — we don't expect more than a few hundred
 * staff/architects/customers for the foreseeable future. If the org ever
 * crosses ~500 users this needs pagination.
 */
/**
 * React.cache deduplicates the Clerk + DB fetch within a single request, so
 * separate Suspense boundaries (e.g. the user stat card AND the recent-users
 * list on the admin dashboard) can call this without re-hitting Clerk.
 */
export const getMergedUsers = cache(_getMergedUsers);

async function _getMergedUsers(limit = 500): Promise<MergedUser[]> {
    const client = await clerkClient();
    const [clerkResp, dbUsers] = await Promise.all([
        client.users.getUserList({ limit }),
        prisma.user.findMany({
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        proposalsCreated: true,
                        proposalsAssigned: true,
                        feasibilityReports: true,
                    },
                },
            },
        }),
    ]);

    // Newer Clerk SDK (@clerk/backend ≥1.0) returns { data, totalCount };
    // older shapes returned the array directly. Handle both.
    const clerkUsers = Array.isArray(clerkResp) ? clerkResp : clerkResp.data ?? [];

    const dbById = new Map(dbUsers.map((u) => [u.id, u]));
    const merged: MergedUser[] = clerkUsers.map((c) => {
        const db = dbById.get(c.id);
        const email = c.emailAddresses[0]?.emailAddress ?? db?.email ?? null;
        const phone = c.phoneNumbers[0]?.phoneNumber ?? db?.phone ?? null;
        const role: Role = db?.role ?? (normalizeRole(c.publicMetadata?.role) as Role);

        return {
            id: c.id,
            email,
            phone,
            firstName: c.firstName ?? null,
            lastName: c.lastName ?? null,
            role,
            inDb: !!db,
            createdAt: db?.createdAt ?? new Date(c.createdAt),
            lastSignInAt: c.lastSignInAt ? new Date(c.lastSignInAt) : null,
            counts: {
                proposalsCreated: db?._count.proposalsCreated ?? 0,
                proposalsAssigned: db?._count.proposalsAssigned ?? 0,
                feasibilityReports: db?._count.feasibilityReports ?? 0,
            },
        };
    });

    // Sort by most-recent-signin first, then most-recent-Clerk-creation.
    merged.sort((a, b) => {
        const ax = a.lastSignInAt?.getTime() ?? 0;
        const bx = b.lastSignInAt?.getTime() ?? 0;
        if (ax !== bx) return bx - ax;
        return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return merged;
}
