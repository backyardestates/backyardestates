// lib/inclusions/buildPackageDisplay.ts
import type { PackageKey, PackageSlot } from "./packages";
import { INCLUSION_PACKAGES } from "./packages";

type SelectionItem = {
    _id: string;
    title: string;
    images?: { secure_url: string }[] | null;
    category?: { slug?: { current?: string }; title?: string };
    type?: { slug?: { current?: string }; title?: string };
    finishColor?: string | null;
    isStandard?: boolean;
    upgradePrice?: number | null;
};

type DisplayItem = {
    slot: PackageSlot;
    title: string;
    image?: string;
    meta?: {
        categoryTitle?: string;
        typeTitle?: string;
    };
    shouldContain?: boolean; // optional if you already compute this
    selectionId?: string;    // optional if you track ids
    item?: SelectionItem;
};

const SLOT_LABEL: Record<PackageSlot, string> = {
    cabinets: "Cabinets",
    countertops: "Countertops",
    cabinetPulls: "Cabinet Pulls",
    interiorDoorHandles: "Interior Door Handles",
    entryDoorHandset: "Entry Door Handset",
    bathroomFaucet: "Bathroom Faucet",
    flooring: "Flooring",
    showerTile: "Shower Tile",
};

export function buildPackageDisplay(opts: {
    selectionsById: Map<string, any>;
    packageKey: PackageKey;
}): DisplayItem[] {
    const def = INCLUSION_PACKAGES[opts.packageKey];
    const out: DisplayItem[] = [];

    for (const slot of Object.keys(def.slots) as PackageSlot[]) {
        const id = def.slots[slot];
        if (!id) continue;

        const item = opts.selectionsById.get(id) as SelectionItem | undefined;
        if (!item?._id) continue;

        const typeTitle = item?.type?.title ?? "";

        const shouldContain =
            typeTitle === "Appliances" ||
            typeTitle === "Cabinets" ||
            typeTitle === "Kitchen Sinks" ||
            typeTitle === "Faucets" ||
            typeTitle === "Lighting Fixtures" ||
            typeTitle === "Interior Finishes";

        out.push({
            slot,
            title: SLOT_LABEL[slot],
            image: item.images?.[0]?.secure_url,
            meta: { categoryTitle: item.category?.title, typeTitle },
            item, // ✅ THIS is the key
            shouldContain,
            selectionId: item._id,
        });
    }

    return out;
}
