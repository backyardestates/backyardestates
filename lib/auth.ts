import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { normalizeRole, STAFF_ROLES } from "../types/roles";
import { Role } from "@prisma/client";

export async function requireUserId() {
    const { userId } = await auth();
    if (!userId) throw new Error("UNAUTHORIZED");
    return userId;
}

export async function getDbUser() {
    const userId = await requireUserId();

    // Try to pull Clerk user info (optional but helps populate email/phone)
    const cu = await currentUser();

    const email = cu?.emailAddresses?.[0]?.emailAddress;
    const phone = cu?.phoneNumbers?.[0]?.phoneNumber;

    const clerkRole = normalizeRole(cu?.publicMetadata?.role);
    // Sync staff-tier roles (Admin/Architect/Sales rep/Staff) from Clerk; never
    // auto-demote an existing staff user to CUSTOMER.
    const syncedStaffRole = STAFF_ROLES.includes(clerkRole) ? (clerkRole as Role) : undefined;

    const dbUser = await prisma.user.upsert({
        where: { id: userId },
        update: {
            email: email ?? undefined,
            phone: phone ?? undefined,
            role: syncedStaffRole,
        },
        create: {
            id: userId,
            email: email ?? undefined,
            phone: phone ?? undefined,
            role: syncedStaffRole ?? "CUSTOMER",
        },
    });

    return dbUser;
}

export async function requireDbRole(roles: Role[]) {
    const dbUser = await getDbUser();
    if (!roles.includes(dbUser.role)) throw new Error("FORBIDDEN");
    return dbUser;
}
