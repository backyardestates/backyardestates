export type CityPhaseStats = { city: string; be: string };

export type CityTimeline = {
    plans: CityPhaseStats;
    permitting: CityPhaseStats;
    build: CityPhaseStats;
};

export const CITY_TIMELINES: Record<string, CityTimeline> = {
    Corona:    { plans: { city: "Not tracked", be: "25 days" }, permitting: { city: "1,202 days", be: "130 days" }, build: { city: "Not tracked", be: "40 days" } },
    Upland:    { plans: { city: "6 months",    be: "25 days" }, permitting: { city: "6 months",   be: "130 days" }, build: { city: "6-12 months", be: "40 days" } },
    Ontario:   { plans: { city: "Not tracked", be: "25 days" }, permitting: { city: "215 days",   be: "40 days"  }, build: { city: "Not tracked", be: "40 days" } },
    Norco:     { plans: { city: "Not tracked", be: "25 days" }, permitting: { city: "Not tracked", be: "130 days" }, build: { city: "Not tracked", be: "40 days" } },
    Claremont: { plans: { city: "Not tracked", be: "25 days" }, permitting: { city: "Not tracked", be: "130 days" }, build: { city: "Not tracked", be: "40 days" } },
    default:   { plans: { city: "Varies",      be: "25 days" }, permitting: { city: "Varies",     be: "130 days" }, build: { city: "Varies",      be: "40 days" } },
};

export function getCityTimeline(address: string): CityTimeline {
    const city = Object.keys(CITY_TIMELINES).find(
        (c) => c !== "default" && address.toLowerCase().includes(c.toLowerCase())
    );
    return CITY_TIMELINES[city ?? "default"];
}
