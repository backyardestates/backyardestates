import { prisma } from "@/lib/prisma";
import type { DiscountPreset } from "@prisma/client";
import { PRESETS } from "@/lib/investment/discounts";

/** Seed the DiscountPreset table from the legacy PRESETS constants. Idempotent. */
async function seedFromLegacyConstants(): Promise<void> {
    const existing = await prisma.discountPreset.count();
    if (existing > 0) return;
    if (PRESETS.length === 0) return;
    await prisma.discountPreset.createMany({
        data: PRESETS.map((p, i) => ({
            slug: p.key,
            label: p.label,
            amount: p.amount,
            sortOrder: i,
        })),
        skipDuplicates: true,
    });
}

export type DiscountUpsertInput = {
    label: string;
    slug?: string;
    amount: number;
    sortOrder?: number;
    active?: boolean;
    notes?: string | null;
};

function slugify(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function listDiscounts(): Promise<DiscountPreset[]> {
    await seedFromLegacyConstants();
    return prisma.discountPreset.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
}

export async function listAllDiscounts(): Promise<DiscountPreset[]> {
    await seedFromLegacyConstants();
    return prisma.discountPreset.findMany({
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
}

export async function getDiscount(id: string): Promise<DiscountPreset | null> {
    return prisma.discountPreset.findUnique({ where: { id } });
}

export async function createDiscount(input: DiscountUpsertInput, updatedById: string | null): Promise<DiscountPreset> {
    return prisma.discountPreset.create({
        data: {
            slug: input.slug && input.slug.length > 0 ? input.slug : slugify(input.label),
            label: input.label,
            amount: input.amount,
            sortOrder: input.sortOrder ?? 0,
            active: input.active ?? true,
            notes: input.notes ?? null,
            updatedById: updatedById ?? undefined,
        },
    });
}

export async function updateDiscount(
    id: string,
    patch: Partial<DiscountUpsertInput>,
    updatedById: string | null
): Promise<DiscountPreset> {
    return prisma.discountPreset.update({
        where: { id },
        data: {
            ...(patch.label !== undefined ? { label: patch.label } : {}),
            ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
            ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
            ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
            ...(patch.active !== undefined ? { active: patch.active } : {}),
            ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
            updatedById: updatedById ?? undefined,
        },
    });
}

export async function deleteDiscount(id: string): Promise<void> {
    await prisma.discountPreset.delete({ where: { id } });
}
