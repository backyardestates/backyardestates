import { prisma } from "@/lib/prisma";
import type { SiteWorkCategory, SiteWorkPreset } from "@prisma/client";
import { SITE_WORK_CATEGORIES } from "@/lib/investment/siteWorkItems";

export type CategoryWithItems = SiteWorkCategory & { items: SiteWorkPreset[] };

/**
 * Seed the SiteWork catalog from the legacy `SITE_WORK_CATEGORIES` constants.
 * Idempotent — only runs when the categories table is empty, so admin edits in
 * the dashboard are preserved across deploys.
 */
async function seedFromLegacyConstants(): Promise<void> {
    const existing = await prisma.siteWorkCategory.count();
    if (existing > 0) return;

    // Create categories first, then items, since items reference category ids.
    for (const [i, cat] of SITE_WORK_CATEGORIES.entries()) {
        const created = await prisma.siteWorkCategory.create({
            data: {
                slug: cat.id,
                label: cat.label,
                sortOrder: i,
            },
        });

        if (cat.items.length === 0) continue;
        await prisma.siteWorkPreset.createMany({
            data: cat.items.map((it, j) => ({
                categoryId: created.id,
                slug: `${cat.id}__${it.id}`, // namespaced so two categories can both have "demo"
                label: it.label,
                unit: it.unit,
                beCost: it.beCost,
                markup: it.markup,
                sortOrder: j,
            })),
        });
    }
}

export async function listCategoriesWithItems(): Promise<CategoryWithItems[]> {
    await seedFromLegacyConstants();
    return prisma.siteWorkCategory.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        include: {
            items: {
                where: { active: true },
                orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
            },
        },
    });
}

export async function getCategory(id: string): Promise<CategoryWithItems | null> {
    return prisma.siteWorkCategory.findUnique({
        where: { id },
        include: { items: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] } },
    });
}

export type CategoryUpsertInput = {
    label: string;
    slug?: string;
    sortOrder?: number;
    active?: boolean;
};

function slugify(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function createCategory(input: CategoryUpsertInput): Promise<SiteWorkCategory> {
    return prisma.siteWorkCategory.create({
        data: {
            slug: input.slug && input.slug.length > 0 ? input.slug : slugify(input.label),
            label: input.label,
            sortOrder: input.sortOrder ?? 0,
            active: input.active ?? true,
        },
    });
}

export async function updateCategory(id: string, patch: Partial<CategoryUpsertInput>): Promise<SiteWorkCategory> {
    return prisma.siteWorkCategory.update({
        where: { id },
        data: {
            ...(patch.label !== undefined ? { label: patch.label } : {}),
            ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
            ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
            ...(patch.active !== undefined ? { active: patch.active } : {}),
        },
    });
}

export async function deleteCategory(id: string): Promise<void> {
    // Cascade-delete the items first since we don't set onDelete: Cascade in
    // the schema (safer to be explicit and let Prisma do it transactionally).
    await prisma.$transaction([
        prisma.siteWorkPreset.deleteMany({ where: { categoryId: id } }),
        prisma.siteWorkCategory.delete({ where: { id } }),
    ]);
}

// ── Item / preset ────────────────────────────────────────────────────────────

export type PresetUpsertInput = {
    categoryId: string;
    label: string;
    slug?: string;
    unit: string;       // "flat" | "sqft" | "lft" | "quote"
    beCost: number;
    markup: number;
    sortOrder?: number;
    active?: boolean;
    notes?: string | null;
};

export async function getPreset(id: string): Promise<SiteWorkPreset | null> {
    return prisma.siteWorkPreset.findUnique({ where: { id } });
}

export async function createPreset(input: PresetUpsertInput, updatedById: string | null): Promise<SiteWorkPreset> {
    return prisma.siteWorkPreset.create({
        data: {
            categoryId: input.categoryId,
            slug: input.slug && input.slug.length > 0 ? input.slug : slugify(input.label),
            label: input.label,
            unit: input.unit,
            beCost: input.beCost,
            markup: input.markup,
            sortOrder: input.sortOrder ?? 0,
            active: input.active ?? true,
            notes: input.notes ?? null,
            updatedById: updatedById ?? undefined,
        },
    });
}

export async function updatePreset(
    id: string,
    patch: Partial<PresetUpsertInput>,
    updatedById: string | null
): Promise<SiteWorkPreset> {
    return prisma.siteWorkPreset.update({
        where: { id },
        data: {
            ...(patch.categoryId !== undefined ? { categoryId: patch.categoryId } : {}),
            ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
            ...(patch.label !== undefined ? { label: patch.label } : {}),
            ...(patch.unit !== undefined ? { unit: patch.unit } : {}),
            ...(patch.beCost !== undefined ? { beCost: patch.beCost } : {}),
            ...(patch.markup !== undefined ? { markup: patch.markup } : {}),
            ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
            ...(patch.active !== undefined ? { active: patch.active } : {}),
            ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
            updatedById: updatedById ?? undefined,
        },
    });
}

export async function deletePreset(id: string): Promise<void> {
    await prisma.siteWorkPreset.delete({ where: { id } });
}
