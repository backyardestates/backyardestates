import { INCLUDED_BASE, OPTIONAL_UPGRADES, POTENTIAL_SITE_SPECIFIC } from "@/lib/IncludedScope";

type StoreUpgrade = { selected: boolean; title: string; cost?: { min: number; max: number; display?: string } };
type StoreSite = { status: string; title: string; cost?: { min: number; max: number; display?: string } };

export function buildValueSections(params: {
    optionalUpgrades?: Record<string, StoreUpgrade> | null;
    siteSpecific?: Record<string, StoreSite> | null;
}) {
    const upgradesSelected = Object.entries(params.optionalUpgrades ?? {})
        .filter(([, v]) => !!v?.selected)
        .map(([id, v]) => {
            const meta = OPTIONAL_UPGRADES.find((x) => x.id === id);
            return { id, store: v, meta };
        });

    const siteFlagged = Object.entries(params.siteSpecific ?? {})
        .filter(([, v]) => v?.status === "might_apply" || v?.status === "unknown" || v?.status === "selected")
        .map(([id, v]) => {
            const meta = POTENTIAL_SITE_SPECIFIC.find((x) => x.id === id);
            return { id, store: v, meta };
        });

    // “Included” highlights: pick the most compelling subset so the page stays clean
    const includedHighlights = INCLUDED_BASE.filter((x) =>
        ["project_management", "design", "permits", "construction", "design_finish_features"].includes(x.category)
    ).slice(0, 14);

    return { includedHighlights, upgradesSelected, siteFlagged };
}
