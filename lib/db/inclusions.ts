import { prisma } from "@/lib/prisma";
import type { InclusionCategory, InclusionRow, Slide4SidebarConfig } from "@prisma/client";

// ─── Seed data — mirrors the legacy hardcoded arrays in Slide4_WhatsIncluded ───

const SEED_INCLUSIONS: { name: string; rows: { label: string; text: string }[] }[] = [
    {
        name: "Kitchen",
        rows: [
            { label: "Cabinets", text: "Wood shaker, soft-close · pantry · lazy susan · spice + trash roll-outs" },
            { label: "Countertops", text: "Quartz · 4\" backsplash · mitered edge" },
            { label: "Appliances", text: "30\" fridge · range · dishwasher · over-range microwave (stainless)" },
            { label: "Sink + Faucet", text: "Undermount stainless · garbage disposal · Delta® Antony pulldown" },
            { label: "Lighting", text: "4\" LED recessed (4–8 per plan)" },
        ],
    },
    {
        name: "Bathroom",
        rows: [
            { label: "Shower", text: "60\" fiberglass pan or tub · subway-tile walls · Delta® Portwood" },
            { label: "Vanity", text: "30\" wood, soft-close · undermount sink · quartz top" },
            { label: "Toilet", text: "Elongated low-flow, water-saving" },
            { label: "Accessories", text: "Mirror · towel bar · ring · paper holder · widespread faucet" },
            { label: "Lighting", text: "3-light vanity · 2 recessed · Nutone® quiet exhaust" },
        ],
    },
    {
        name: "Interior",
        rows: [
            { label: "Ceilings", text: "Vaulted 8'–10' in great room · 8' in bedrooms" },
            { label: "Floors + Doors", text: "LVP throughout · shaker 6'8\" passage doors w/ lever sets" },
            { label: "Paint + Trim", text: "Dunn Edwards SuperPaint® · 1×2.5\" casing · 1×4\" base" },
            { label: "Electrical", text: "Decora® dimmers · outlets every 12' · prewired data hub" },
            { label: "Closets", text: "Mirrored wardrobe doors · shelf + pole" },
        ],
    },
    {
        name: "Exterior",
        rows: [
            { label: "Siding + Roof", text: "Stucco 16/20 · 30-yr asphalt shingles · 8\" Windsor fascia" },
            { label: "Windows", text: "White vinyl, dual-pane, Low-E · Title 24 · 2\" faux blinds" },
            { label: "Door", text: "36\" Masonite® fiberglass, prehung + primed" },
            { label: "Electrical", text: "Dawn-to-dusk light · 2 GFCI outlets · EV charger prep" },
            { label: "Plumbing", text: "1 exterior hose bib" },
        ],
    },
    {
        name: "Construction",
        rows: [
            { label: "Structure", text: "Wood-framed · slab-on-grade · 2×4 walls · 5/8\" fire-rated drywall" },
            { label: "Insulation", text: "R15 walls + R30 roof · interior + exterior walls insulated" },
            { label: "Energy", text: "CA Title 24 compliant · PV solar on 2+ bed plans" },
            { label: "Roof", text: "Gabled · 20\" front/rear overhang · 3'×3' concrete patio stoop" },
        ],
    },
    {
        name: "Systems & Utilities",
        rows: [
            { label: "Water Heater", text: "High-efficiency 50-gal heat pump · 3.24 EF · enclosure" },
            { label: "HVAC", text: "Mini-split · flush cassettes · 1 head per bedroom · heat + cool" },
            { label: "Plumbing", text: "PEX water lines · shutoffs at every fixture · external exhaust venting" },
            { label: "Electrical", text: "200A panel + 225 busbar · 100A ADU sub-panel · CAT 6 + coax" },
        ],
    },
];

const SEED_DEPT_PILLS = [
    "Planning", "Building", "Engineering",
    "Public Works", "Waste", "City / County Fire",
    "Recorder", "Water", "Electric Provider",
    "School Districts", "CA ADU Law",
];

const SEED_FEE_BULLETS = [
    "Address + plan check + building fees — admin, inspection, sub panel, fire",
    "School fees · notarization · permit pull · plan checker follow-up",
    "Corrections review · state compliance · dedicated PM + superintendent",
];

const SIDEBAR_ID = "default";

function slugify(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ─── Seeders ──────────────────────────────────────────────────────────────────

async function seedInclusions(): Promise<void> {
    const existing = await prisma.inclusionCategory.count();
    if (existing > 0) return;

    for (const [i, cat] of SEED_INCLUSIONS.entries()) {
        const slug = slugify(cat.name);
        const created = await prisma.inclusionCategory.create({
            data: { slug, name: cat.name, sortOrder: i },
        });
        if (cat.rows.length === 0) continue;
        await prisma.inclusionRow.createMany({
            data: cat.rows.map((r, j) => ({
                categoryId: created.id,
                slug: `${slug}__${slugify(r.label)}`,
                label: r.label,
                text: r.text,
                sortOrder: j,
            })),
        });
    }
}

async function seedSidebar(): Promise<Slide4SidebarConfig> {
    return prisma.slide4SidebarConfig.upsert({
        where: { id: SIDEBAR_ID },
        update: {},
        create: { id: SIDEBAR_ID, deptPills: SEED_DEPT_PILLS, feeBullets: SEED_FEE_BULLETS },
    });
}

// ─── Inclusions API ──────────────────────────────────────────────────────────

export type CategoryWithRows = InclusionCategory & { rows: InclusionRow[] };

export async function listInclusions(): Promise<CategoryWithRows[]> {
    await seedInclusions();
    return prisma.inclusionCategory.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
            rows: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] },
        },
    });
}

export type CategoryUpsertInput = {
    name: string;
    slug?: string;
    sortOrder?: number;
    active?: boolean;
};

export async function createInclusionCategory(input: CategoryUpsertInput): Promise<InclusionCategory> {
    return prisma.inclusionCategory.create({
        data: {
            slug: input.slug && input.slug.length > 0 ? input.slug : slugify(input.name),
            name: input.name,
            sortOrder: input.sortOrder ?? 0,
            active: input.active ?? true,
        },
    });
}

export async function updateInclusionCategory(
    id: string,
    patch: Partial<CategoryUpsertInput>
): Promise<InclusionCategory> {
    return prisma.inclusionCategory.update({
        where: { id },
        data: {
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
            ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
            ...(patch.active !== undefined ? { active: patch.active } : {}),
        },
    });
}

export async function deleteInclusionCategory(id: string): Promise<void> {
    await prisma.$transaction([
        prisma.inclusionRow.deleteMany({ where: { categoryId: id } }),
        prisma.inclusionCategory.delete({ where: { id } }),
    ]);
}

export type RowUpsertInput = {
    categoryId: string;
    label: string;
    text: string;
    slug?: string;
    sortOrder?: number;
    active?: boolean;
};

export async function createInclusionRow(input: RowUpsertInput): Promise<InclusionRow> {
    const cat = await prisma.inclusionCategory.findUnique({ where: { id: input.categoryId } });
    const baseSlug = input.slug && input.slug.length > 0
        ? input.slug
        : `${cat?.slug ?? "cat"}__${slugify(input.label)}-${Date.now()}`;
    return prisma.inclusionRow.create({
        data: {
            categoryId: input.categoryId,
            slug: baseSlug,
            label: input.label,
            text: input.text,
            sortOrder: input.sortOrder ?? 0,
            active: input.active ?? true,
        },
    });
}

export async function updateInclusionRow(id: string, patch: Partial<RowUpsertInput>): Promise<InclusionRow> {
    return prisma.inclusionRow.update({
        where: { id },
        data: {
            ...(patch.categoryId !== undefined ? { categoryId: patch.categoryId } : {}),
            ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
            ...(patch.label !== undefined ? { label: patch.label } : {}),
            ...(patch.text !== undefined ? { text: patch.text } : {}),
            ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
            ...(patch.active !== undefined ? { active: patch.active } : {}),
        },
    });
}

export async function deleteInclusionRow(id: string): Promise<void> {
    await prisma.inclusionRow.delete({ where: { id } });
}

// ─── Sidebar (dept pills + fee bullets) API ──────────────────────────────────

export async function getSidebarConfig(): Promise<Slide4SidebarConfig> {
    return seedSidebar();
}

export async function setSidebarConfig(
    next: { deptPills: string[]; feeBullets: string[] },
    updatedById: string | null
): Promise<Slide4SidebarConfig> {
    return prisma.slide4SidebarConfig.upsert({
        where: { id: SIDEBAR_ID },
        create: {
            id: SIDEBAR_ID,
            deptPills: next.deptPills,
            feeBullets: next.feeBullets,
            updatedById: updatedById ?? undefined,
        },
        update: {
            deptPills: next.deptPills,
            feeBullets: next.feeBullets,
            updatedById: updatedById ?? undefined,
        },
    });
}
