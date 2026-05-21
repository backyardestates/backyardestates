import AdminMasterClient from "./components/AdminMasterClient";
import { client } from "@/sanity/client";
import { FLOORPLANS_QUERY, PRESENTER_COMPLETED_PROPERTIES_QUERY, PRESENTER_STORIES_QUERY } from "@/sanity/queries";
import { getFinancialDefaults } from "@/lib/db/financialDefaults";
import { listCities } from "@/lib/db/cities";
import { getDefaultSlideOrder } from "@/lib/db/slideOrder";
import { getMilestoneDefsSerializable } from "@/lib/db/paymentMilestones";
import { listCategoriesWithItems, type CategoryWithItems } from "@/lib/db/siteWork";
import { listAllDiscounts } from "@/lib/db/discounts";
import type { DiscountPreset } from "@prisma/client";
import type { CityData } from "@/lib/store/presentationStore";
import type { PaymentMilestoneDefData } from "@/lib/investment/proposalPaymentSchedule";
import type { DiscountsCatalogSummary } from "@/lib/investment/discounts";
import type { SiteWorkCatalogData, SiteWorkUnit } from "@/lib/investment/siteWorkItems";

// Re-export so panels that import "../../page" keep working. The canonical
// definition lives in lib/investment/discounts.ts where shared hooks can
// reach it without taking a dependency on the `app/` layer.
export type { DiscountsCatalogSummary };

export default async function AdminMasterPage() {
    const [
        floorplans,
        completedProperties,
        stories,
        financialDefaults,
        cities,
        defaultSlideOrder,
        milestoneDefs,
        siteWorkCats,
        discountRows,
    ] = await Promise.all([
        client.fetch(FLOORPLANS_QUERY),
        client.fetch(PRESENTER_COMPLETED_PROPERTIES_QUERY),
        client.fetch(PRESENTER_STORIES_QUERY),
        // Catalog defaults — seeded with the code-defined DEFAULTS the first
        // time it runs. New proposals will inherit whatever an admin has saved
        // here; existing proposals keep their own frozen copy.
        getFinancialDefaults(),
        // DB-backed city timelines. Step 11 auto-populates from this when the
        // address matches; Slide 7 also reads it via the presenter store.
        listCities().catch(() => []),
        // Default slide order — new proposals inherit this; existing keep theirs.
        getDefaultSlideOrder().catch(() => [] as number[]),
        // Payment milestone defs — used by Step 12 to generate balloon schedules.
        getMilestoneDefsSerializable().catch(() => [] as PaymentMilestoneDefData[]),
        // Pass A: catalog visibility for Site Work + Discounts. The panels
        // still use legacy hardcoded constants — these are surfaced only so
        // admins can verify the DB has the values they expect before we
        // cut over.
        listCategoriesWithItems().catch(() => [] as CategoryWithItems[]),
        listAllDiscounts().catch(() => [] as DiscountPreset[]),
    ]);

    // Project the Prisma City rows down to the serializable shape the client
    // expects (strips Date fields and DB-only audit columns).
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

    // Runtime-shaped catalog for the SiteWorkEstimator + helpers. Includes full
    // item rows; bare-id stripping happens in catalogToSiteWorkCategories at
    // the point of use so the EstimatorState keys still line up.
    const siteWorkCatalog: SiteWorkCatalogData = {
        categories: siteWorkCats.map((c) => ({
            id: c.id,
            slug: c.slug,
            label: c.label,
            sortOrder: c.sortOrder,
            active: c.active,
            items: c.items.map((it) => ({
                id: it.id,
                slug: it.slug,
                label: it.label,
                unit: it.unit as SiteWorkUnit,
                beCost: it.beCost,
                markup: it.markup,
                sortOrder: it.sortOrder,
                active: it.active,
            })),
        })),
    };

    const discountsCatalogSummary: DiscountsCatalogSummary = {
        items: discountRows.map((d) => ({
            id: d.id,
            slug: d.slug,
            label: d.label,
            amount: d.amount,
            active: d.active,
        })),
        activeCount: discountRows.filter((d) => d.active).length,
        totalCount: discountRows.length,
    };

    return (
        <AdminMasterClient
            initialFloorplans={floorplans ?? []}
            initialCompletedProperties={completedProperties ?? []}
            initialStories={stories ?? []}
            initialFinancialDefaults={financialDefaults}
            initialCitiesCatalog={citiesCatalog}
            initialSlideOrder={defaultSlideOrder}
            initialMilestoneDefs={milestoneDefs}
            initialSiteWorkCatalogData={siteWorkCatalog}
            initialDiscountsCatalog={discountsCatalogSummary}
        />
    );
}
