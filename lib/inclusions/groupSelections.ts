// lib/groupSelections.ts
type Item = {
    _id: string;
    title: string;
    images?: { secure_url: string }[] | null;
    isStandard?: boolean;
    upgradePrice?: number | null;
    finishColor?: string | null;
    category?: { slug?: { current?: string }; title?: string } | null;
    type?: { slug?: { current?: string }; title?: string } | null;
};

type TypeGroup = { title: string; items: Item[] };
type CategoryGroup = { title: string; types: Record<string, TypeGroup> };

export function groupSelections(items: Item[]): Record<string, CategoryGroup> {
    const grouped: Record<string, CategoryGroup> = {};

    for (const item of items ?? []) {
        if (!item?._id) continue;

        const categoryKey = item.category?.slug?.current ?? "other";
        const categoryTitle = item.category?.title ?? "Other";

        const typeKey = item.type?.slug?.current ?? "other";
        const typeTitle = item.type?.title ?? "Other";

        grouped[categoryKey] ??= { title: categoryTitle, types: {} };
        grouped[categoryKey].types[typeKey] ??= { title: typeTitle, items: [] };

        grouped[categoryKey].types[typeKey].items.push(item);
    }

    return grouped;

}

type DisplayItem = { item?: Item };

export function groupSelectionsFromPackage(packageItems: DisplayItem[]) {
    const items = (packageItems ?? [])
        .map((x) => x.item)
        .filter((x): x is Item => Boolean(x?._id));

    return groupSelections(items);
}