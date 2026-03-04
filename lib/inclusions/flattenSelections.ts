// lib/inclusions/flattenSelections.ts
type SelectionItem = {
    _id: string;
    title: string;
    images?: { secure_url: string }[];
    category?: { slug?: { current?: string }; title?: string };
    type?: { slug?: { current?: string }; title?: string };
    finishColor?: string | null;
    isStandard?: boolean;
};

export function flattenSelectionsToIdMap(selections: any) {
    const map = new Map<string, SelectionItem>();

    // ✅ CASE A: already a flat array
    if (Array.isArray(selections)) {
        for (const item of selections) {
            if (item?._id) map.set(item._id, item);
        }
        return map;
    }

    // ✅ CASE B: nested object shape { interior: { types: { ... } } }
    for (const categoryKey of Object.keys(selections ?? {})) {
        const category = selections?.[categoryKey];
        const types = category?.types ?? {};

        for (const typeKey of Object.keys(types)) {
            const typeObj = types?.[typeKey];
            const items: SelectionItem[] = Array.isArray(typeObj?.items) ? typeObj.items : [];

            for (const item of items) {
                if (item?._id) map.set(item._id, item);
            }
        }
    }

    return map;
}
