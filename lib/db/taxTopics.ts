import { prisma } from "@/lib/prisma";
import type { TaxTopic } from "@prisma/client";

// Mirrors the legacy WRITE_OFFS array in Slide12_TaxBenefits.tsx.
const SEED: { name: string; note: string }[] = [
    { name: "Mortgage Interest",     note: "Interest on financing tied to the ADU." },
    { name: "Property Taxes",        note: "Annual tax on the new construction's assessed value." },
    { name: "Depreciation",          note: "Spread the building's cost across its useful life." },
    { name: "Repairs & Maintenance", note: "Ongoing fixes to keep the rental in shape." },
    { name: "Insurance Premiums",    note: "Hazard, liability, and rental coverage." },
    { name: "Management Fees",       note: "Property manager and leasing service costs." },
    { name: "Advertising",           note: "Listing fees and marketing the rental." },
    { name: "Utilities (rental %)",  note: "The tenant-attributable share of shared utilities." },
    { name: "HOA Fees (rental %)",   note: "The rental-attributable share of HOA dues." },
    { name: "Professional Services", note: "CPA, attorney, and bookkeeping fees." },
    { name: "Travel for Property",   note: "Mileage and trips for rental management." },
];

function slugify(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function seedFromLegacyConstants(): Promise<void> {
    const existing = await prisma.taxTopic.count();
    if (existing > 0) return;
    if (SEED.length === 0) return;
    await prisma.taxTopic.createMany({
        data: SEED.map((t, i) => ({
            slug: slugify(t.name),
            name: t.name,
            note: t.note,
            sortOrder: i,
        })),
        skipDuplicates: true,
    });
}

export type TaxTopicUpsertInput = {
    name: string;
    note: string;
    slug?: string;
    sortOrder?: number;
    active?: boolean;
};

export async function listTaxTopics(): Promise<TaxTopic[]> {
    await seedFromLegacyConstants();
    return prisma.taxTopic.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
}

export async function listActiveTaxTopics(): Promise<TaxTopic[]> {
    await seedFromLegacyConstants();
    return prisma.taxTopic.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
}

export async function getTaxTopic(id: string): Promise<TaxTopic | null> {
    return prisma.taxTopic.findUnique({ where: { id } });
}

export async function createTaxTopic(input: TaxTopicUpsertInput, updatedById: string | null): Promise<TaxTopic> {
    return prisma.taxTopic.create({
        data: {
            slug: input.slug && input.slug.length > 0 ? input.slug : slugify(input.name),
            name: input.name,
            note: input.note,
            sortOrder: input.sortOrder ?? 0,
            active: input.active ?? true,
            updatedById: updatedById ?? undefined,
        },
    });
}

export async function updateTaxTopic(
    id: string,
    patch: Partial<TaxTopicUpsertInput>,
    updatedById: string | null
): Promise<TaxTopic> {
    return prisma.taxTopic.update({
        where: { id },
        data: {
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.note !== undefined ? { note: patch.note } : {}),
            ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
            ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
            ...(patch.active !== undefined ? { active: patch.active } : {}),
            updatedById: updatedById ?? undefined,
        },
    });
}

export async function deleteTaxTopic(id: string): Promise<void> {
    await prisma.taxTopic.delete({ where: { id } });
}
