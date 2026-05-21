import type { ProposalSnapshot } from "@/lib/proposalSnapshot";
import {
    catalogToSiteWorkCategories,
    SITE_WORK_CATEGORIES,
    type SiteWorkCatalogData,
    type SiteWorkCategory,
} from "@/lib/investment/siteWorkItems";
import {
    PRESETS,
    catalogToPresets,
    type DiscountState,
    type DiscountsCatalogSummary,
    type PresetLike,
} from "@/lib/investment/discounts";

export type SiteWorkDriftEntry = {
    aduId: string;
    itemId: string;
    qty: number;
};

export type DiscountDriftEntry = {
    /** "master" for the all-units default state; otherwise an ADU id. */
    aduId: "master" | string;
    slug: string;
};

export type CatalogDriftReport = {
    siteWork: SiteWorkDriftEntry[];
    discounts: DiscountDriftEntry[];
    /** True when neither list has entries — convenient for `if (report.empty) return null` in the banner. */
    empty: boolean;
};

function parseDiscountState(raw: string | null | undefined): DiscountState | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.presets)) {
            return parsed as DiscountState;
        }
    } catch { /* malformed JSON — treat as missing */ }
    return null;
}

function parseDiscountCustomMap(raw: string | null | undefined): Record<string, DiscountState | null> {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
            return parsed as Record<string, DiscountState | null>;
        }
    } catch { /* malformed */ }
    return {};
}

/**
 * Find references in a saved snapshot to catalog items that no longer exist
 * in the live catalog. Two sources of drift:
 *
 * 1. Site work — EstimatorState.quantities is keyed by bare item id (e.g.
 *    "impact"). If an admin deletes "permits__impact" from the DB catalog,
 *    a saved qty for "impact" becomes orphaned.
 * 2. Discounts — DiscountState.presets is a list of slugs. If an admin
 *    deactivates or deletes a preset, saved selections become orphaned.
 *    Read from companionStorage["dp_master"] / ["dp_custom"] (the
 *    DiscountsPanel's own LS keys) because those carry slugs verbatim;
 *    snapshot.discountLinesByAduId stores resolved labels which can't be
 *    disambiguated from rep-typed custom discounts.
 *
 * Custom items / custom discounts are never reported as drift — they don't
 * reference the catalog.
 */
export function detectCatalogDrift(
    snapshot: ProposalSnapshot,
    siteWorkCatalog: SiteWorkCatalogData | null | undefined,
    discountsCatalog: DiscountsCatalogSummary | null | undefined,
): CatalogDriftReport {
    // ── Site work ────────────────────────────────────────────────────────────
    const categories: SiteWorkCategory[] = siteWorkCatalog && siteWorkCatalog.categories.length > 0
        ? catalogToSiteWorkCategories(siteWorkCatalog)
        : SITE_WORK_CATEGORIES;
    const knownItemIds = new Set<string>();
    for (const cat of categories) {
        for (const it of cat.items) knownItemIds.add(it.id);
    }

    const siteWork: SiteWorkDriftEntry[] = [];
    for (const [aduId, state] of Object.entries(snapshot.estimatorByAduId ?? {})) {
        const qtys = state?.quantities ?? {};
        for (const [itemId, qty] of Object.entries(qtys)) {
            if ((qty ?? 0) <= 0) continue;
            if (knownItemIds.has(itemId)) continue;
            siteWork.push({ aduId, itemId, qty });
        }
    }

    // ── Discounts ────────────────────────────────────────────────────────────
    const presets: PresetLike[] = discountsCatalog && discountsCatalog.items.length > 0
        ? catalogToPresets(discountsCatalog.items)
        : PRESETS;
    const knownPresetKeys = new Set(presets.map((p) => p.key));

    const discounts: DiscountDriftEntry[] = [];
    const companion = snapshot.companionStorage ?? {};
    const master = parseDiscountState(companion["dp_master"]);
    if (master) {
        for (const slug of master.presets) {
            if (!knownPresetKeys.has(slug)) {
                discounts.push({ aduId: "master", slug });
            }
        }
    }
    const customMap = parseDiscountCustomMap(companion["dp_custom"]);
    for (const [aduId, state] of Object.entries(customMap)) {
        if (!state) continue;
        for (const slug of state.presets) {
            if (!knownPresetKeys.has(slug)) {
                discounts.push({ aduId, slug });
            }
        }
    }

    return {
        siteWork,
        discounts,
        empty: siteWork.length === 0 && discounts.length === 0,
    };
}
