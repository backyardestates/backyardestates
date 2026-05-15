// lib/investment/siteWorkItems.ts
// Customer price = beCost × markup × qty  (fixed items)
// Customer price = qty × markup            (quote items — qty holds the sub-quote dollar amount)

export type SiteWorkUnit = "flat" | "sqft" | "lft" | "quote";

export type SiteWorkPreset = {
    id: string;
    label: string;
    unit: SiteWorkUnit;
    beCost: number;  // catalog default — overridable per row
    markup: number;  // catalog default — overridable per row
};

export type SiteWorkCategory = {
    id: string;
    label: string;
    items: SiteWorkPreset[];
};

export const SITE_WORK_CATEGORIES: SiteWorkCategory[] = [
    {
        id: "permits",
        label: "Permits & engineering",
        items: [
            { id: "impact",      label: "Impact fees",                         unit: "flat",  beCost: 5000,  markup: 1.0 },
            { id: "elec_calcs",  label: "Electrical calcs (200amp)",           unit: "flat",  beCost: 750,   markup: 1.0 },
            { id: "meps",        label: "Official MEPs / unit",                unit: "flat",  beCost: 2500,  markup: 1.0 },
            { id: "survey",      label: "Survey",                              unit: "flat",  beCost: 2600,  markup: 1.0 },
            { id: "soils",       label: "Soils report",                        unit: "flat",  beCost: 3600,  markup: 1.2 },
            { id: "grading_pl",  label: "Grading plans",                       unit: "flat",  beCost: 7500,  markup: 1.2 },
            { id: "encroach",    label: "Encroachment permit",                 unit: "flat",  beCost: 1500,  markup: 1.2 },
            { id: "arch_inc",    label: "Architectural price increase",        unit: "flat",  beCost: 2000,  markup: 1.2 },
        ],
    },
    {
        id: "utilities",
        label: "Utilities & meters",
        items: [
            { id: "new_meter",   label: "New electrical meter",               unit: "flat",  beCost: 7000,  markup: 1.0 },
            { id: "rel_gas",     label: "Relocate gas meter",                  unit: "flat",  beCost: 2500,  markup: 1.1 },
            { id: "new_gas",     label: "New gas meter",                       unit: "flat",  beCost: 5000,  markup: 1.1 },
            { id: "water_meter", label: "Water meter upgrade",                 unit: "flat",  beCost: 5000,  markup: 1.3 },
            { id: "sewer_scope", label: "Sewer scope",                         unit: "flat",  beCost: 350,   markup: 1.1 },
            { id: "rel_panel",   label: "Relocate panel & electrical",         unit: "flat",  beCost: 1000,  markup: 1.3 },
            { id: "rel_water",   label: "Relocate main water valve",           unit: "flat",  beCost: 1000,  markup: 1.3 },
        ],
    },
    {
        id: "trenching",
        label: "Trenching & utility runs",
        items: [
            { id: "trench",      label: "Trench",                              unit: "lft",   beCost: 48,    markup: 1.4 },
            { id: "tr_water",    label: "Water / sewer run",                   unit: "lft",   beCost: 12,    markup: 1.4 },
            { id: "tr_elec",     label: "Electrical run",                      unit: "lft",   beCost: 8,     markup: 1.4 },
            { id: "tr_gas",      label: "Gas run",                             unit: "lft",   beCost: 10,    markup: 1.4 },
            { id: "tr_data",     label: "Data line run",                       unit: "lft",   beCost: 5,     markup: 1.4 },
        ],
    },
    {
        id: "concrete",
        label: "Concrete & hardscape",
        items: [
            { id: "conc_cut",    label: 'Concrete cut (4" slab)',              unit: "sqft",  beCost: 8,     markup: 1.3 },
            { id: "conc_repour", label: "Concrete repour",                     unit: "sqft",  beCost: 15,    markup: 1.3 },
            { id: "pavers",      label: "Pavers",                              unit: "sqft",  beCost: 15,    markup: 1.8 },
            { id: "overex",      label: "Over-excavation (per day)",           unit: "flat",  beCost: 5000,  markup: 1.3 },
        ],
    },
    {
        id: "roofing",
        label: "Roofing & exterior",
        items: [
            { id: "tile_roof",   label: "Tile roof",                           unit: "sqft",  beCost: 9,     markup: 1.2 },
            { id: "slope_roof",  label: "Roof slope > 4:12",                   unit: "flat",  beCost: 5500,  markup: 1.2 },
            { id: "gutters",     label: "Rain gutters",                        unit: "flat",  beCost: 950,   markup: 1.8 },
            { id: "fire_eaves",  label: "Fire rated eaves / vents",            unit: "flat",  beCost: 1500,  markup: 1.15 },
            { id: "siding",      label: "Siding (per 25ft width)",             unit: "flat",  beCost: 2250,  markup: 1.2 },
            { id: "trim",        label: "Exterior trim",                       unit: "flat",  beCost: 2800,  markup: 1.1 },
            { id: "ext_light",   label: "Exterior lighting / unit",            unit: "flat",  beCost: 185,   markup: 1.3 },
        ],
    },
    {
        id: "fire",
        label: "Fire & safety",
        items: [
            { id: "fire_flow",   label: "Fire flow test",                      unit: "flat",  beCost: 700,   markup: 1.0 },
            { id: "fire_spr",    label: "Fire sprinklers",                     unit: "flat",  beCost: 10000, markup: 1.3 },
            { id: "pool_safe",   label: "Pool safety equipment",               unit: "quote", beCost: 0,     markup: 1.0 },
        ],
    },
    {
        id: "demo",
        label: "Demo & site prep",
        items: [
            { id: "demo",        label: "Demo",                                unit: "flat",  beCost: 2500,  markup: 1.2 },
            { id: "small_tree",  label: "Small tree (10–25 ft)",               unit: "flat",  beCost: 700,   markup: 1.3 },
            { id: "med_tree",    label: "Medium tree (25–50 ft)",              unit: "flat",  beCost: 1800,  markup: 1.3 },
            { id: "large_tree",  label: "Large tree (50 ft+)",                 unit: "flat",  beCost: 3000,  markup: 1.3 },
            { id: "mini_equip",  label: "Mini equipment (< 6ft access)",       unit: "flat",  beCost: 3500,  markup: 1.2 },
            { id: "slight_grade",label: "Slight grading of dirt",              unit: "flat",  beCost: 350,   markup: 1.2 },
            { id: "rel_pool",    label: "Relocate pool equipment",             unit: "flat",  beCost: 3500,  markup: 1.0 },
        ],
    },
    {
        id: "structure",
        label: "Structural & special",
        items: [
            { id: "attached",    label: "Attached ADU",                        unit: "flat",  beCost: 7500,  markup: 1.0 },
            { id: "found_h",     label: "Foundation height (> 1 ft)",          unit: "flat",  beCost: 2500,  markup: 1.2 },
            { id: "ejector",     label: "Ejector pump",                        unit: "flat",  beCost: 8740,  markup: 1.1 },
            { id: "connect_gar", label: "Connect ADU to garage",               unit: "flat",  beCost: 6500,  markup: 1.2 },
            { id: "ceil_height", label: "Ceiling height per foot",             unit: "flat",  beCost: 4500,  markup: 1.1 },
            { id: "fence",       label: "Fence removal & rebuild",             unit: "lft",   beCost: 326,   markup: 1.2 },
            { id: "stackstone",  label: "Stackstone wall 2–3 ft",              unit: "lft",   beCost: 100,   markup: 1.2 },
            { id: "drain_lines", label: "Drainage lines",                      unit: "flat",  beCost: 3500,  markup: 1.0 },
        ],
    },
    {
        id: "interior",
        label: "Interior upgrades",
        items: [
            { id: "tile_shower", label: "Tile shower / floor",                 unit: "sqft",  beCost: 35,    markup: 1.5 },
            { id: "hot_mop",     label: "Hot mop",                             unit: "flat",  beCost: 1600,  markup: 1.5 },
            { id: "shower_bench",label: "Shower bench",                        unit: "flat",  beCost: 500,   markup: 1.5 },
            { id: "island",      label: "Kitchen island",                      unit: "flat",  beCost: 4000,  markup: 1.2 },
            { id: "porch",       label: "Porch",                               unit: "flat",  beCost: 500,   markup: 1.2 },
            { id: "back_door",   label: "Back door + lighting steps",          unit: "flat",  beCost: 1250,  markup: 1.2 },
            { id: "cover_win",   label: "Cover windows / add back door",       unit: "flat",  beCost: 3500,  markup: 1.0 },
            { id: "taller_win",  label: "Taller windows and doors",            unit: "quote", beCost: 0,     markup: 1.1 },
            { id: "ceil_12ft",   label: "12 ft ceilings",                      unit: "quote", beCost: 0,     markup: 1.1 },
            { id: "cabinet_inc", label: "Cabinet increase",                    unit: "quote", beCost: 0,     markup: 1.2 },
        ],
    },
    {
        id: "landscaping",
        label: "Landscaping & drainage",
        items: [
            { id: "land_plans",  label: "Landscaping plans",                   unit: "flat",  beCost: 4500,  markup: 1.0 },
            { id: "plant_tree",  label: "Plant trees (15 gal)",                unit: "flat",  beCost: 350,   markup: 1.2 },
            { id: "barrels",     label: "Barrels (4 = 1,000 gal)",             unit: "flat",  beCost: 1000,  markup: 1.2 },
            { id: "rain_garden", label: "Rain garden",                         unit: "flat",  beCost: 4000,  markup: 1.2 },
        ],
    },
    {
        id: "windows",
        label: "Windows & doors",
        items: [
            { id: "add_win",     label: "Add window",                          unit: "flat",  beCost: 175,   markup: 1.0 },
            { id: "add_ext_door",label: "Add exterior door",                   unit: "flat",  beCost: 600,   markup: 1.0 },
            { id: "add_slide",   label: "Add sliding glass door",              unit: "flat",  beCost: 1150,  markup: 1.0 },
            { id: "tempered",    label: "Tempered windows",                    unit: "flat",  beCost: 250,   markup: 1.1 },
            { id: "outlet",      label: "Add interior / exterior outlet",      unit: "flat",  beCost: 60,    markup: 1.0 },
        ],
    },
];

// ─── State types ──────────────────────────────────────────────────────────────

export type RowOverride = {
    beCost?: number;
    markup?: number;
};

export type CustomItemData = {
    id: string;
    catId: string;
    label: string;
    qty: number;
    beCost: number;
    markup: number;
};

export type EstimatorState = {
    quantities: Record<string, number>;      // presetItemId → qty (0 = inactive)
    overrides: Record<string, RowOverride>;  // presetItemId → cost/markup overrides
    customItems: CustomItemData[];
};

// ─── Snapshot type — structured output for proposal/report generation ─────────

export type ActiveLineItem = {
    catId: string;
    catLabel: string;
    itemId: string;
    label: string;
    qty: number;
    unit: string;
    beCost: number;       // effective (override ?? catalog)
    markup: number;       // effective (override ?? catalog)
    unitPrice: number;    // beCost × markup  (0 for quote items)
    customerTotal: number;
    beTotal: number;      // internal cost before markup
    isOverridden: boolean;
    isCustom: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function effectiveBeCost(item: SiteWorkPreset, overrides: Record<string, RowOverride>): number {
    return overrides[item.id]?.beCost ?? item.beCost;
}

export function effectiveMarkup(item: SiteWorkPreset, overrides: Record<string, RowOverride>): number {
    return overrides[item.id]?.markup ?? item.markup;
}

// ─── State helpers ────────────────────────────────────────────────────────────

export function createEmptyState(): EstimatorState {
    const quantities: Record<string, number> = {};
    for (const cat of SITE_WORK_CATEGORIES) {
        for (const item of cat.items) {
            quantities[item.id] = 0;
        }
    }
    return { quantities, overrides: {}, customItems: [] };
}

export function rowCustomerPrice(
    item: SiteWorkPreset,
    qty: number,
    overrides: Record<string, RowOverride> = {}
): number {
    if (qty <= 0) return 0;
    const beCost = effectiveBeCost(item, overrides);
    const markup = effectiveMarkup(item, overrides);
    if (item.unit === "quote") return qty * markup;
    return qty * beCost * markup;
}

export function computeTotal(state: EstimatorState): number {
    const overrides = state.overrides ?? {};
    let total = 0;
    for (const cat of SITE_WORK_CATEGORIES) {
        for (const item of cat.items) {
            total += rowCustomerPrice(item, state.quantities[item.id] ?? 0, overrides);
        }
    }
    for (const ci of state.customItems) {
        if (ci.qty > 0 && ci.beCost > 0) {
            total += ci.qty * ci.beCost * ci.markup;
        }
    }
    return total;
}

export function mergeEstimatorStates(source: EstimatorState, target: EstimatorState): EstimatorState {
    const quantities = { ...target.quantities };
    for (const [id, qty] of Object.entries(source.quantities)) {
        if (qty > 0 && (quantities[id] ?? 0) === 0) {
            quantities[id] = qty;
        }
    }
    // Merge overrides — target overrides take precedence
    const overrides = { ...source.overrides, ...target.overrides };

    const existingLabels = new Set(target.customItems.map((ci) => ci.label.trim().toLowerCase()));
    const toAdd = source.customItems
        .filter((ci) => !existingLabels.has(ci.label.trim().toLowerCase()))
        .map((ci) => ({ ...ci, id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }));
    return { quantities, overrides, customItems: [...target.customItems, ...toAdd] };
}

// ─── Snapshot builder — call this when estimate is finalized ──────────────────

export function buildActiveSnapshot(state: EstimatorState): ActiveLineItem[] {
    const overrides = state.overrides ?? {};
    const items: ActiveLineItem[] = [];

    for (const cat of SITE_WORK_CATEGORIES) {
        for (const item of cat.items) {
            const qty = state.quantities[item.id] ?? 0;
            if (qty <= 0) continue;

            const beCost = effectiveBeCost(item, overrides);
            const markup = effectiveMarkup(item, overrides);
            const isQuote = item.unit === "quote";
            const unitPrice = isQuote ? 0 : beCost * markup;
            const customerTotal = isQuote ? qty * markup : qty * beCost * markup;
            const beTotal = isQuote ? qty : qty * beCost;

            items.push({
                catId: cat.id,
                catLabel: cat.label,
                itemId: item.id,
                label: item.label,
                qty,
                unit: item.unit,
                beCost,
                markup,
                unitPrice,
                customerTotal,
                beTotal,
                isOverridden: !!overrides[item.id],
                isCustom: false,
            });
        }
    }

    for (const ci of state.customItems) {
        if (ci.qty <= 0 || ci.beCost <= 0) continue;
        const cat = SITE_WORK_CATEGORIES.find((c) => c.id === ci.catId);
        const unitPrice = ci.beCost * ci.markup;
        const customerTotal = ci.qty * unitPrice;
        const beTotal = ci.qty * ci.beCost;
        items.push({
            catId: ci.catId,
            catLabel: cat?.label ?? ci.catId,
            itemId: ci.id,
            label: ci.label || "Custom item",
            qty: ci.qty,
            unit: "custom",
            beCost: ci.beCost,
            markup: ci.markup,
            unitPrice,
            customerTotal,
            beTotal,
            isOverridden: false,
            isCustom: true,
        });
    }

    return items;
}
