import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDbRole, bustUserMemo } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ROLES = new Set<Role>([
    Role.CUSTOMER,
    Role.ARCHITECT,
    Role.SALES_REP,
    Role.STAFF,
    Role.ADMIN,
]);

/**
 * PUT /api/admin/users/[id]/role
 * Body: { role: "CUSTOMER" | "ARCHITECT" | "ADMIN" }
 *
 * ADMIN-only. Updates both Clerk publicMetadata.role (source of truth for the
 * session token) and the DB User.role (queried by server routes). The Clerk
 * change takes effect when the target user's session refreshes — they may
 * need to sign out + back in for the middleware gate to reflect the new role.
 *
 * Self-edits are refused so an ADMIN can't accidentally lock themselves out.
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const caller = await requireDbRole([Role.ADMIN]);
        const { id: targetUserId } = await params;

        if (targetUserId === caller.id) {
            return NextResponse.json(
                { error: "Cannot change your own role from this endpoint." },
                { status: 400 },
            );
        }

        const body = (await req.json()) as { role?: unknown };
        const raw = typeof body.role === "string" ? body.role.toUpperCase() : "";
        if (!VALID_ROLES.has(raw as Role)) {
            return NextResponse.json(
                { error: `Invalid role. Must be one of ${[...VALID_ROLES].join(", ")}.` },
                { status: 400 },
            );
        }
        const newRole = raw as Role;

        // Confirm the user exists in Clerk (source of truth for identity).
        // The user may NOT yet exist in our DB — that's fine; we'll bootstrap
        // a row via upsert below. This is the normal state for someone who
        // signed up on Clerk but hasn't yet hit a route that calls getDbUser.
        const client = await clerkClient();
        let clerkUser;
        try {
            clerkUser = await client.users.getUser(targetUserId);
        } catch {
            return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });
        }

        const email = clerkUser.emailAddresses[0]?.emailAddress;
        const phone = clerkUser.phoneNumbers[0]?.phoneNumber;

        // Update Clerk publicMetadata.role — the session claim middleware
        // reads from. The user's existing session sees the new role only
        // after a token refresh; flagged in the response.
        await client.users.updateUserMetadata(targetUserId, {
            publicMetadata: { role: newRole },
        });

        // Mirror to our DB so server-side requireDbRole calls reflect the
        // change immediately. Upsert (not update) so we can change roles for
        // users who haven't yet been bootstrapped into the DB.
        const updated = await prisma.user.upsert({
            where: { id: targetUserId },
            update: {
                role: newRole,
                email: email ?? undefined,
                phone: phone ?? undefined,
            },
            create: {
                id: targetUserId,
                role: newRole,
                email: email ?? undefined,
                phone: phone ?? undefined,
            },
        });

        // Drop the per-instance user memo so the new role takes effect on the
        // target's next request served by this instance (others converge by TTL).
        bustUserMemo(targetUserId);

        return NextResponse.json({
            id: updated.id,
            role: updated.role,
            note: "Role updated. Target user must refresh their session (sign out + back in) before middleware reflects the change.",
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[PUT /api/admin/users/:id/role]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
