export type PresetKey = "solarPanels" | "educators" | "firstResponders" | "openHouse";

export const PRESETS: { key: PresetKey; label: string; amount: number }[] = [
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

export function computeDiscountTotal(state: DiscountState): number {
    const presetTotal = state.presets.reduce(
        (sum, key) => sum + (PRESETS.find((p) => p.key === key)?.amount ?? 0),
        0
    );
    const customTotal = state.custom.reduce((sum, c) => sum + Math.max(0, c.amount), 0);
    return presetTotal + customTotal;
}

export function countDiscounts(state: DiscountState): number {
    return state.presets.length + state.custom.filter((c) => c.amount > 0).length;
}

export function getDiscountLines(state: DiscountState): { label: string; amount: number }[] {
    const presetLines = state.presets
        .map((key) => PRESETS.find((p) => p.key === key))
        .filter((p): p is (typeof PRESETS)[number] => p !== undefined)
        .map((p) => ({ label: p.label, amount: p.amount }));
    const customLines = state.custom
        .filter((c) => c.amount > 0 && c.label.trim().length > 0)
        .map((c) => ({ label: c.label, amount: c.amount }));
    return [...presetLines, ...customLines];
}
