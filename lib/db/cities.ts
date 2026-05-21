import { prisma } from "@/lib/prisma";
import type { City } from "@prisma/client";
import { CITY_TIMELINES } from "@/lib/config/cityTimelines";

// Parse the city-side timeline strings from the legacy CITY_TIMELINES map
// ("25 days" / "6 months" / "6-12 months" / "1,202 days" / "Not tracked").
// Returns { days, label } so we keep the original wording for display fidelity
// alongside the numeric estimate (numeric wins when both are present).
function parseTimelineString(raw: string): { days: number | null; label: string | null } {
    if (!raw) return { days: null, label: null };
    const v = raw.replace(/,/g, "").toLowerCase().trim();
    if (v.includes("varies") || v.includes("not tracked")) return { days: null, label: raw };

    const dayMatch = v.match(/(\d+(?:\.\d+)?)\s*days?/);
    if (dayMatch) return { days: Math.round(parseFloat(dayMatch[1])), label: raw };

    const monthRange = v.match(/(\d+)\s*-\s*(\d+)\s*months?/);
    if (monthRange) {
        const days = Math.round(((parseInt(monthRange[1]) + parseInt(monthRange[2])) / 2) * 30);
        return { days, label: raw };
    }

    const monthMatch = v.match(/(\d+)\s*months?/);
    if (monthMatch) return { days: parseInt(monthMatch[1]) * 30, label: raw };

    return { days: null, label: raw };
}

function slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Seed the City catalog from the legacy `CITY_TIMELINES` map. Idempotent —
 * only inserts cities that don't already exist (matched by `name`). Skipped
 * once the table has any rows, so admin edits in the dashboard are preserved.
 */
async function seedFromLegacyConstants(): Promise<void> {
    const existing = await prisma.city.count();
    if (existing > 0) return;

    const rows = Object.entries(CITY_TIMELINES)
        .filter(([name]) => name !== "default") // "default" lives in code as the fallback
        .map(([name, t], i) => {
            const bePlans = parseTimelineString(t.plans.be).days ?? 25;
            const bePermits = parseTimelineString(t.permitting.be).days ?? 130;
            const beBuild = parseTimelineString(t.build.be).days ?? 40;
            const cityPlans = parseTimelineString(t.plans.city);
            const cityPermits = parseTimelineString(t.permitting.city);
            const cityBuild = parseTimelineString(t.build.city);

            return {
                name,
                slug: slugify(name),
                bePlansDays: bePlans,
                bePermitsDays: bePermits,
                beBuildDays: beBuild,
                cityPlansDays: cityPlans.days,
                cityPermitsDays: cityPermits.days,
                cityBuildDays: cityBuild.days,
                cityPlansLabel: cityPlans.label,
                cityPermitsLabel: cityPermits.label,
                cityBuildLabel: cityBuild.label,
                sortOrder: i,
            };
        });

    if (rows.length === 0) return;
    await prisma.city.createMany({ data: rows, skipDuplicates: true });
}

/** List all active cities (sorted). Seeds the table on first call. */
export async function listCities(): Promise<City[]> {
    await seedFromLegacyConstants();
    return prisma.city.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
}

/** Match a free-text address against the city catalog (case-insensitive). */
export async function matchCityForAddress(address: string): Promise<City | null> {
    if (!address) return null;
    const cities = await listCities();
    const a = address.toLowerCase();
    return cities.find((c) => a.includes(c.name.toLowerCase())) ?? null;
}

export async function getCity(id: string): Promise<City | null> {
    await seedFromLegacyConstants();
    return prisma.city.findUnique({ where: { id } });
}

export type CityUpsertInput = Omit<
    City,
    "id" | "createdAt" | "updatedAt" | "updatedById"
>;

export async function createCity(data: CityUpsertInput, updatedById: string | null): Promise<City> {
    return prisma.city.create({
        data: {
            ...data,
            slug: data.slug || slugify(data.name),
            updatedById: updatedById ?? undefined,
        },
    });
}

export async function updateCity(
    id: string,
    patch: Partial<CityUpsertInput>,
    updatedById: string | null
): Promise<City> {
    return prisma.city.update({
        where: { id },
        data: { ...patch, updatedById: updatedById ?? undefined },
    });
}

export async function deleteCity(id: string): Promise<void> {
    await prisma.city.delete({ where: { id } });
}
