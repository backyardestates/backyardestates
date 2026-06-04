import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { normalizeRole, STAFF_ROLES } from "../types/roles";
import { Role, type User } from "@prisma/client";

export async function requireUserId() {
    const { userId } = await auth();
    if (!userId) throw new Error("UNAUTHORIZED");
    return userId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-instance user memo.
//
// getDbUser() used to run a Clerk `currentUser()` roundtrip + a `user.upsert`
// WRITE on every authenticated request — including the admin tool's 1.5s
// autosaves — which added ~200-500ms and constant write churn to every API
// call in production. The memo makes the hot path free:
//
//   memo hit (within TTL)  → 0 Clerk calls, 0 queries
//   memo miss, row exists  → 1 findUnique + 1 Clerk call; UPDATE only if the
//                            Clerk role/email/phone actually changed (so roles
//                            edited directly in the Clerk dashboard still
//                            propagate within the TTL window)
//   first login            → 1 Clerk call + 1 create (unchanged behavior)
//
// The returned role is ALWAYS the DB role (never session claims) — RBAC
// helpers (requireDbRole, getPermissions) rely on it being fresh immediately
// after an in-app promotion. The admin role routes call bustUserMemo() so a
// promotion takes effect on the next request served by this instance; other
// instances converge within MEMO_TTL_MS (strictly better than the old
// "sign out and back in" caveat).
// ─────────────────────────────────────────────────────────────────────────────
const MEMO_TTL_MS = 60_000;
const userMemo = new Map<string, { user: User; at: number }>();

/** Drop a user's cached row (call after writing their role/profile). */
export function bustUserMemo(userId: string) {
    userMemo.delete(userId);
}

export async function getDbUser(): Promise<User> {
    const userId = await requireUserId();

    const hit = userMemo.get(userId);
    if (hit && Date.now() - hit.at < MEMO_TTL_MS) return hit.user;

    let user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        // First login: pull Clerk identity + role and create the row.
        const cu = await currentUser();
        const email = cu?.emailAddresses?.[0]?.emailAddress;
        const phone = cu?.phoneNumbers?.[0]?.phoneNumber;
        const clerkRole = normalizeRole(cu?.publicMetadata?.role);
        // Staff-tier roles (Admin/Architect/Sales rep/Staff) come from Clerk;
        // everyone else starts as CUSTOMER.
        const syncedStaffRole = STAFF_ROLES.includes(clerkRole) ? (clerkRole as Role) : undefined;
        user = await prisma.user.create({
            data: {
                id: userId,
                email: email ?? undefined,
                phone: phone ?? undefined,
                role: syncedStaffRole ?? "CUSTOMER",
            },
        });
    } else {
        // Periodic re-sync (once per TTL window, not per request): pick up
        // role/profile edits made directly in the Clerk dashboard. Never
        // auto-demote — we only write the role when Clerk reports a STAFF role.
        const cu = await currentUser().catch(() => null);
        if (cu) {
            const email = cu.emailAddresses?.[0]?.emailAddress;
            const phone = cu.phoneNumbers?.[0]?.phoneNumber;
            const clerkRole = normalizeRole(cu.publicMetadata?.role);
            const syncedStaffRole = STAFF_ROLES.includes(clerkRole) ? (clerkRole as Role) : undefined;

            const roleChanged = !!syncedStaffRole && syncedStaffRole !== user.role;
            const emailChanged = !!email && email !== user.email;
            const phoneChanged = !!phone && phone !== user.phone;
            if (roleChanged || emailChanged || phoneChanged) {
                user = await prisma.user.update({
                    where: { id: userId },
                    data: {
                        role: roleChanged ? syncedStaffRole : undefined,
                        email: emailChanged ? email : undefined,
                        phone: phoneChanged ? phone : undefined,
                    },
                });
            }
        }
    }

    userMemo.set(userId, { user, at: Date.now() });
    return user;
}

export async function requireDbRole(roles: Role[]) {
    const dbUser = await getDbUser();
    if (!roles.includes(dbUser.role)) throw new Error("FORBIDDEN");
    return dbUser;
}
