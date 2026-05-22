/**
 * A preset key is a stable string identifier. Originally a string-literal union
 * for the 4 hardcoded discounts; widened to `string` once the DB-backed catalog
 * (DiscountPreset table) replaced the constant — catalog slugs aren't known at
 * compile time.
 */
export type PresetKey = string;

/** Shape both the legacy PRESETS constant and the DB catalog can satisfy. */
export type PresetLike = { key: string; label: string; amount: number };

export const PRESETS: PresetLike[] = [
    { key: "solarPanels",     label: "Solar Panels",      amount: 7500 },
    { key: "educators",       label: "Educators",          amount: 1500 },
    { key: "firstResponders", label: "First Responders",   amount: 1500 },
    { key: "openHouse",       label: "Open House",         amount: 1500 },
];

export interface CustomDiscount {
    id: string;
    label: string;
    amount: number;
}

export interface DiscountState {
    presets: PresetKey[];
    custom: CustomDiscount[];
}

export function createEmptyDiscountState(): DiscountState {
    return { presets: [], custom: [] };
}

/**
 * Compute the dollar total of selected presets + custom discounts. The
 * `presets` argument lets callers pass the live DB catalog (each entry shaped
 * `{ key, label, amount }`); when omitted, falls back to the legacy PRESETS
 * constants for backward compatibility.
 */
export function computeDiscountTotal(state: DiscountState, presets: PresetLike[] = PRESETS): number {
    const presetTotal = state.presets.reduce(
        (sum, key) => sum + (presets.find((p) => p.key === key)?.amount ?? 0),
        0
    );
    const customTotal = state.custom.reduce((sum, c) => sum + Math.max(0, c.amount), 0);
    return presetTotal + customTotal;
}

export function countDiscounts(state: DiscountState): number {
    return state.presets.length + state.custom.filter((c) => c.amount > 0).length;
}

export function getDiscountLines(
    state: DiscountState,
    presets: PresetLike[] = PRESETS
): { label: string; amount: number }[] {
    const presetLines = state.presets
        .map((key) => presets.find((p) => p.key === key))
        .filter((p): p is PresetLike => p !== undefined)
        .map((p) => ({ label: p.label, amount: p.amount }));
    const customLines = state.custom
        .filter((c) => c.amount > 0 && c.label.trim().length > 0)
        .map((c) => ({ label: c.label, amount: c.amount }));
    return [...presetLines, ...customLines];
}

/** Project a DB-catalog row into the shared PresetLike shape. Use `slug` as
 *  the runtime key so existing DiscountState (keyed by legacy slug strings)
 *  continues to match. */
export function catalogToPresets(catalog: { slug: string; label: string; amount: number; active?: boolean }[]): PresetLike[] {
    return catalog
        .filter((d) => d.active !== false)
        .map((d) => ({ key: d.slug, label: d.label, amount: d.amount }));
}

/**
 * Serializable summary of the DiscountPreset catalog passed from the admin
 * page → AdminMasterClient → hooks → DiscountsPanel. Lives here so hooks can
 * type their props without taking a dependency on the `app/` layer.
 */
export type DiscountsCatalogSummary = {
    items: { id: string; slug: string; label: string; amount: number; active: boolean }[];
    activeCount: number;
    totalCount: number;
};
