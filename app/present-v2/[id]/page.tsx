import { notFound } from "next/navigation";
import { getPresenterSanityCatalog } from "@/lib/presenter/sanityCatalog";
import type {
    SanityFloorplan,
    SanityStory,
    SanityProperty,
    InclusionCategoryData,
    TaxTopicData,
    CityData,
    DiscountPresetData,
    AdminBroadcast,
} from "@/lib/store/presentationStore";
import { listInclusions, getSidebarConfig } from "@/lib/db/inclusions";
import { listActiveTaxTopics } from "@/lib/db/taxTopics";
import { listCities } from "@/lib/db/cities";
import { listDiscounts } from "@/lib/db/discounts";
import { prisma } from "@/lib/prisma";
import { PresentClient } from "../PresentClient";

export const dynamic = "force-dynamic";

// Standalone presenter deck loaded by proposal id or shareToken (Phase 0b).
// Renders the saved presenter payload with no live admin session required.
export default async function PresentByIdPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const [
        proposal,
        sanityCatalog,
        inclusions,
        sidebar,
        taxTopics,
        cities,
        discounts,
    ] = await Promise.all([
        prisma.proposal
            .findFirst({
                where: { OR: [{ id }, { shareToken: id }] },
                select: { presenterBroadcast: true },
            })
            .catch(() => null),
        // Cached (5 min) — these three Sanity queries used to run uncached on
        // every present/print render.
        getPresenterSanityCatalog().catch(() => ({
            floorplans: [] as SanityFloorplan[],
            stories: [] as SanityStory[],
            completedProperties: [] as SanityProperty[],
        })),
        listInclusions().catch(() => []),
        getSidebarConfig().catch(() => null),
        listActiveTaxTopics().catch(() => []),
        listCities().catch(() => []),
        listDiscounts().catch(() => []),
    ]);
    const { floorplans, stories, completedProperties } = sanityCatalog;

    if (!proposal?.presenterBroadcast) {
        // No saved presenter payload (proposal missing, or saved before Phase 0b).
        notFound();
    }

    const inclusionsCatalog: InclusionCategoryData[] = inclusions.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
        active: c.active,
        rows: c.rows.map((r) => ({
            id: r.id,
            label: r.label,
            text: r.text,
            sortOrder: r.sortOrder,
            active: r.active,
        })),
    }));

    const inclusionsSidebar = sidebar
        ? { deptPills: sidebar.deptPills, feeBullets: sidebar.feeBullets }
        : null;

    const taxTopicsCatalog: TaxTopicData[] = taxTopics.map((t) => ({
        id: t.id,
        name: t.name,
        note: t.note,
        slug: t.slug,
        sortOrder: t.sortOrder,
        active: t.active,
    }));

    const discountsCatalog: DiscountPresetData[] = discounts.map((d) => ({
        id: d.id,
        slug: d.slug,
        label: d.label,
        amount: d.amount,
        sortOrder: d.sortOrder,
        active: d.active,
    }));

    const citiesCatalog: CityData[] = cities.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        bePlansDays: c.bePlansDays,
        bePermitsDays: c.bePermitsDays,
        beBuildDays: c.beBuildDays,
        cityPlansDays: c.cityPlansDays,
        cityPermitsDays: c.cityPermitsDays,
        cityBuildDays: c.cityBuildDays,
        cityPlansLabel: c.cityPlansLabel,
        cityPermitsLabel: c.cityPermitsLabel,
        cityBuildLabel: c.cityBuildLabel,
        active: c.active,
        sortOrder: c.sortOrder,
    }));

    return (
        <PresentClient
            floorplans={floorplans}
            stories={stories}
            completedProperties={completedProperties}
            inclusionsCatalog={inclusionsCatalog}
            inclusionsSidebar={inclusionsSidebar}
            taxTopicsCatalog={taxTopicsCatalog}
            citiesCatalog={citiesCatalog}
            discountsCatalog={discountsCatalog}
            initialBroadcast={
                proposal.presenterBroadcast as unknown as Partial<AdminBroadcast>
            }
        />
    );
}
