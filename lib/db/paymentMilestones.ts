import { prisma } from "@/lib/prisma";
import type { PaymentMilestoneDef } from "@prisma/client";
import {
    PROPOSAL_MILESTONE_DEFS,
    PROPOSAL_FIRST_AMOUNT,
    PROPOSAL_LAST_AMOUNT,
} from "@/lib/investment/proposalPaymentSchedule";

// Mirrors the constants in proposalPaymentSchedule.ts. When the table is empty
// we seed with this exact shape so the balloon generator behaves identically
// to the pre-DB version (same milestone order, weights, fixed endpoints).
const SEED_WEIGHTS = [0, 5, 9, 13, 17, 20, 19, 12, 5, 0];

async function seedFromLegacyConstants(): Promise<void> {
    const existing = await prisma.paymentMilestoneDef.count();
    if (existing > 0) return;
    if (PROPOSAL_MILESTONE_DEFS.length === 0) return;

    const rows = PROPOSAL_MILESTONE_DEFS.map((m, i) => {
        const isFirst = i === 0;
        const isLast = i === PROPOSAL_MILESTONE_DEFS.length - 1;
        return {
            slug: m.id,
            label: m.label,
            trigger: m.trigger,
            sortOrder: i,
            weight: SEED_WEIGHTS[i] ?? 0,
            fixedAmount: isFirst
                ? PROPOSAL_FIRST_AMOUNT
                : isLast
                ? PROPOSAL_LAST_AMOUNT
                : null,
        };
    });

    await prisma.paymentMilestoneDef.createMany({
        data: rows,
        skipDuplicates: true,
    });
}

export async function listMilestones(): Promise<PaymentMilestoneDef[]> {
    await seedFromLegacyConstants();
    return prisma.paymentMilestoneDef.findMany({
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
}

export async function listActiveMilestones(): Promise<PaymentMilestoneDef[]> {
    await seedFromLegacyConstants();
    return prisma.paymentMilestoneDef.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
}

export async function getMilestone(id: string): Promise<PaymentMilestoneDef | null> {
    return prisma.paymentMilestoneDef.findUnique({ where: { id } });
}

export type MilestoneUpsertInput = {
    label: string;
    slug?: string;
    trigger: string;
    sortOrder?: number;
    weight: number;
    fixedAmount?: number | null;
    active?: boolean;
    notes?: string | null;
};

function slugify(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function createMilestone(
    input: MilestoneUpsertInput,
    updatedById: string | null
): Promise<PaymentMilestoneDef> {
    return prisma.paymentMilestoneDef.create({
        data: {
            slug: input.slug && input.slug.length > 0 ? input.slug : slugify(input.label),
            label: input.label,
            trigger: input.trigger,
            sortOrder: input.sortOrder ?? 0,
            weight: input.weight,
            fixedAmount: input.fixedAmount ?? null,
            active: input.active ?? true,
            notes: input.notes ?? null,
            updatedById: updatedById ?? undefined,
        },
    });
}

export async function updateMilestone(
    id: string,
    patch: Partial<MilestoneUpsertInput>,
    updatedById: string | null
): Promise<PaymentMilestoneDef> {
    return prisma.paymentMilestoneDef.update({
        where: { id },
        data: {
            ...(patch.label !== undefined ? { label: patch.label } : {}),
            ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
            ...(patch.trigger !== undefined ? { trigger: patch.trigger } : {}),
            ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
            ...(patch.weight !== undefined ? { weight: patch.weight } : {}),
            ...(patch.fixedAmount !== undefined ? { fixedAmount: patch.fixedAmount } : {}),
            ...(patch.active !== undefined ? { active: patch.active } : {}),
            ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
            updatedById: updatedById ?? undefined,
        },
    });
}

export async function deleteMilestone(id: string): Promise<void> {
    await prisma.paymentMilestoneDef.delete({ where: { id } });
}

/**
 * Build a balloon-shaped schedule for a given totalPrice using the DB catalog.
 * Thin wrapper around the pure `generateBalloonFromCatalogDefs` helper so the
 * same algorithm runs on both server (here) and client (PaymentSchedulePanel).
 */
export async function generateBalloonScheduleFromCatalog(totalPrice: number) {
    const defs = await listActiveMilestones();
    const { generateBalloonFromCatalogDefs } = await import(
        "@/lib/investment/proposalPaymentSchedule"
    );
    return generateBalloonFromCatalogDefs(
        totalPrice,
        defs.map((d) => ({
            id: d.id,
            slug: d.slug,
            label: d.label,
            trigger: d.trigger,
            sortOrder: d.sortOrder,
            weight: d.weight,
            fixedAmount: d.fixedAmount,
        }))
    );
}

/** Return milestone defs in serializable shape — useful for passing through
 *  SSR props to client components. */
export async function getMilestoneDefsSerializable() {
    const defs = await listActiveMilestones();
    return defs.map((d) => ({
        id: d.id,
        slug: d.slug,
        label: d.label,
        trigger: d.trigger,
        sortOrder: d.sortOrder,
        weight: d.weight,
        fixedAmount: d.fixedAmount,
    }));
}
