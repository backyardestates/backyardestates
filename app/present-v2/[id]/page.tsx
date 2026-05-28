import { notFound } from "next/navigation";
import { client } from "@/sanity/client";
import {
    PRESENTER_COMPLETED_PROPERTIES_QUERY,
    PRESENTER_ALL_FLOORPLANS_QUERY,
    PRESENTER_STORIES_QUERY,
} from "@/sanity/queries";
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
        floorplans,
        stories,
        completedProperties,
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
        client.fetch<SanityFloorplan[]>(PRESENTER_ALL_FLOORPLANS_QUERY).catch(() => []),
        client.fetch<SanityStory[]>(PRESENTER_STORIES_QUERY).catch(() => []),
        client.fetch<SanityProperty[]>(PRESENTER_COMPLETED_PROPERTIES_QUERY).catch(() => []),
        listInclusions().catch(() => []),
        getSidebarConfig().catch(() => null),
        listActiveTaxTopics().catch(() => []),
        listCities().catch(() => []),
        listDiscounts().catch(() => []),
    ]);

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
