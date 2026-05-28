import { prisma } from "@/lib/prisma";

/** Active work-item catalog grouped by category — the on-site questionnaire the
 *  architect fills out. Mirrors the feasibility catalog but used here for the
 *  formal analysis. */
export async function listActiveWorkItemsByCategory() {
    return prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            name: true,
            sortOrder: true,
            workItems: {
                where: { status: "ACTIVE" },
                orderBy: { title: "asc" },
                select: {
                    id: true,
                    title: true,
                    overview: true,
                    whyItMatters: true,
                    kind: true,
                    affectsPlans: true,
                    affectsPermitting: true,
                    affectsConstruction: true,
                },
            },
        },
    });
}
