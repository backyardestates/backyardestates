import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFinancialDefaults } from "@/lib/db/financialDefaults";
import { listCities } from "@/lib/db/cities";
import { getDefaultSlideOrder } from "@/lib/db/slideOrder";
import { listMilestones } from "@/lib/db/paymentMilestones";
import { listCategoriesWithItems } from "@/lib/db/siteWork";
import { listAllDiscounts } from "@/lib/db/discounts";
import { listInclusions, getSidebarConfig } from "@/lib/db/inclusions";
import { listTaxTopics } from "@/lib/db/taxTopics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dev utility — invokes every catalog's idempotent seeder by calling its
 * `list*`/`get*` entry point, then reports row counts so we can verify the
 * DB is fully populated. Each seeder is a no-op when its table already has
 * rows, so this is safe to hit multiple times.
 *
 * Defense in depth: (1) gated to NODE_ENV !== "production" so it cannot run
 * in deployed envs, (2) requires an authenticated ADMIN user — protects us
 * from a misconfigured staging that runs with NODE_ENV=development.
 */
export async function GET() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "disabled in production" }, { status: 403 });
    }
    try {
        await requireDbRole([Role.ADMIN]);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        return NextResponse.json({ error: msg }, { status: 500 });
    }

    const results: Record<string, unknown> = {};

    try {
        const financialDefaults = await getFinancialDefaults();
        results.financialDefaults = {
            seeded: true,
            interestRate: financialDefaults.interestRate,
            termYears: financialDefaults.termYears,
        };
    } catch (e) {
        results.financialDefaults = { error: String(e) };
    }

    try {
        const cities = await listCities();
        results.cities = { count: cities.length };
    } catch (e) {
        results.cities = { error: String(e) };
    }

    try {
        const slideOrder = await getDefaultSlideOrder();
        results.slideOrder = { length: slideOrder.length, value: slideOrder };
    } catch (e) {
        results.slideOrder = { error: String(e) };
    }

    try {
        const milestones = await listMilestones();
        results.paymentMilestones = { count: milestones.length };
    } catch (e) {
        results.paymentMilestones = { error: String(e) };
    }

    try {
        const siteWork = await listCategoriesWithItems();
        results.siteWork = {
            categories: siteWork.length,
            items: siteWork.reduce((sum, c) => sum + c.items.length, 0),
        };
    } catch (e) {
        results.siteWork = { error: String(e) };
    }

    try {
        const discounts = await listAllDiscounts();
        results.discounts = {
            total: discounts.length,
            active: discounts.filter((d) => d.active).length,
        };
    } catch (e) {
        results.discounts = { error: String(e) };
    }

    try {
        const inclusions = await listInclusions();
        results.inclusions = {
            categories: inclusions.length,
            rows: inclusions.reduce((sum, c) => sum + c.rows.length, 0),
        };
    } catch (e) {
        results.inclusions = { error: String(e) };
    }

    try {
        const sidebar = await getSidebarConfig();
        results.slide4Sidebar = {
            deptPills: sidebar.deptPills.length,
            feeBullets: sidebar.feeBullets.length,
        };
    } catch (e) {
        results.slide4Sidebar = { error: String(e) };
    }

    try {
        const taxTopics = await listTaxTopics();
        results.taxTopics = {
            total: taxTopics.length,
            active: taxTopics.filter((t) => t.active).length,
        };
    } catch (e) {
        results.taxTopics = { error: String(e) };
    }

    // Also report raw row counts straight from Prisma so we can cross-check
    // that the seeders actually wrote what they claim.
    const counts = await Promise.all([
        prisma.financialDefaults.count().catch(() => -1),
        prisma.city.count().catch(() => -1),
        prisma.slideOrderDefault.count().catch(() => -1),
        prisma.paymentMilestoneDef.count().catch(() => -1),
        prisma.siteWorkCategory.count().catch(() => -1),
        prisma.siteWorkPreset.count().catch(() => -1),
        prisma.discountPreset.count().catch(() => -1),
        prisma.inclusionCategory.count().catch(() => -1),
        prisma.inclusionRow.count().catch(() => -1),
        prisma.slide4SidebarConfig.count().catch(() => -1),
        prisma.taxTopic.count().catch(() => -1),
    ]);
    results.rawCounts = {
        financialDefaults: counts[0],
        cities: counts[1],
        slideOrderDefaults: counts[2],
        paymentMilestoneDefs: counts[3],
        siteWorkCategories: counts[4],
        siteWorkPresets: counts[5],
        discountPresets: counts[6],
        inclusionCategories: counts[7],
        inclusionRows: counts[8],
        slide4SidebarConfigs: counts[9],
        taxTopics: counts[10],
    };

    return NextResponse.json(results);
}
