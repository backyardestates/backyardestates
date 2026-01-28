import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { normalizeRole } from "../types/roles";

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

    // Ensure user exists + keep DB role aligned with Clerk role for staff
    // (Customers remain CUSTOMER unless you explicitly promote them)
    const dbUser = await prisma.user.upsert({
        where: { id: userId },
        update: {
            email: email ?? undefined,
            phone: phone ?? undefined,
            role: clerkRole === "ADMIN" ? "ADMIN" : clerkRole === "ARCHITECT" ? "ARCHITECT" : undefined,
        },
        create: {
            id: userId,
            email: email ?? undefined,
            phone: phone ?? undefined,
            role: clerkRole === "ADMIN" ? "ADMIN" : clerkRole === "ARCHITECT" ? "ARCHITECT" : "CUSTOMER",
        },
    });

    return dbUser;
}

export async function requireDbRole(roles: Role[]) {
    const dbUser = await getDbUser();
    if (!roles.includes(dbUser.role)) throw new Error("FORBIDDEN");
    return dbUser;
}
