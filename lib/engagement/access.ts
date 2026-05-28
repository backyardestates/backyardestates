import { Role } from "@prisma/client";

/** Visibility rule shared by engagement + consultation routes: admins see
 *  everything; reps/architects see engagements they're assigned to. */
export function canAccessEngagement(
    engagement: { repId: string | null; architectId: string | null },
    userId: string,
    role: Role,
): boolean {
    return (
        role === Role.ADMIN ||
        engagement.repId === userId ||
        engagement.architectId === userId
    );
}
