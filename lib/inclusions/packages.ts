export type PackageKey = "light" | "dark" | "blue" | "monochrome" | "olive";

export type PackageSlot =
    | "cabinets"
    | "countertops"
    | "cabinetPulls"
    | "interiorDoorHandles"
    | "entryDoorHandset"
    | "bathroomFaucet"
    | "flooring"
    | "showerTile";

export type PackageDefinition = {
    key: PackageKey;
    label: string;
    // slot -> selection _id from sanity
    slots: Partial<Record<PackageSlot, string>>;
};

export const INCLUSION_PACKAGES: Record<PackageKey, PackageDefinition> = {
    light: {
        key: "light",
        label: "Contemporary light",
        slots: {
            cabinets: "dd50e411-9239-470b-902a-c9698f3b197e", // Shaker Cabinets - White
            cabinetPulls: "679e2a04-f07c-447d-81b3-e01946a0bc09", // Pulls - Brushed Gold
            countertops: "7baa901e-dd91-4d69-994c-d5ff9937abfe", // Bella Calacatta
            interiorDoorHandles: "135b171b-4e1d-4015-ae92-06ee30326d4e", // Satin Brass
            entryDoorHandset: "bcd003e4-bdff-412e-b179-b67536dffaa1", // Brushed Gold
            flooring: "b65a09d8-7ac0-4c0c-b1ab-2afe0714af8b", // Oyster
            bathroomFaucet: "986a5008-aae2-48be-9f69-6a8ecb37aae7", // Satin Nickel (or swap)
            showerTile: "840b38fe-99f0-4b42-b1b1-82c5b640e318", // Bright White
        },
    },

    dark: {
        key: "dark",
        label: "Contemporary dark",
        slots: {
            cabinets: "9063ac4a-8dfb-4179-9714-c024d5f475f6", // Espresso
            cabinetPulls: "b56b2ce0-4469-4cd9-8529-56f422834017", // Matte Black
            countertops: "bf30bb0d-a5d6-4e1e-8fbb-cc877a1dbcad", // Black Sparkle (or Pure Black)
            interiorDoorHandles: "7e53f8a5-c519-4c15-b9eb-d55c00e3d17c", // Matte Black
            entryDoorHandset: "1d50b05e-8a53-4bab-819d-7f4a367682b1", // Matte Black
            flooring: "7df197ab-3596-4cff-8f85-2e454191cc2f", // Espresso flooring
            bathroomFaucet: "70d13b34-d4cd-4295-9660-f8688aa6ac8d", // Matte Black
            showerTile: "840b38fe-99f0-4b42-b1b1-82c5b640e318",
        },
    },

    blue: {
        key: "blue",
        label: "Modern blue",
        slots: {
            cabinets: "3627ffd7-8518-484a-9452-0e3c907b1e97", // Blue
            cabinetPulls: "5c442e06-18e4-483f-ac20-aa18abdec9fe", // Satin Nickel (or Matte Black)
            countertops: "fcc3de73-eb27-42d8-8abb-155c2125d8af", // Fairy White
            interiorDoorHandles: "c8522dde-8d2a-42c9-bb62-9cda828cfe96", // Satin Nickel
            entryDoorHandset: "a524f16f-89f9-471c-8b87-316cff00a6c2", // Satin Nickel
            flooring: "14a22dfe-fa4d-4598-a5cc-5f078fd196a8", // Malibu
            bathroomFaucet: "986a5008-aae2-48be-9f69-6a8ecb37aae7",
            showerTile: "840b38fe-99f0-4b42-b1b1-82c5b640e318",
        },
    },

    monochrome: {
        key: "monochrome",
        label: "Modern monochrome",
        slots: {
            cabinets: "c2f5207d-b7ef-407b-b335-7e3700ff409b", // Misty Gray (or Black)
            cabinetPulls: "b56b2ce0-4469-4cd9-8529-56f422834017", // Matte Black
            countertops: "6a76ffae-dd7f-4c16-b4a1-ba5e2e315a8c", // Pure White
            interiorDoorHandles: "7e53f8a5-c519-4c15-b9eb-d55c00e3d17c",
            entryDoorHandset: "1d50b05e-8a53-4bab-819d-7f4a367682b1",
            flooring: "ac42a817-b5b7-4974-b691-2a77b90fdf50", // Oxford
            bathroomFaucet: "70d13b34-d4cd-4295-9660-f8688aa6ac8d",
            showerTile: "840b38fe-99f0-4b42-b1b1-82c5b640e318",
        },
    },

    olive: {
        key: "olive",
        label: "Urban olive",
        slots: {
            cabinets: "5926cac6-3c67-4054-b94e-c1c4160a362d", // Olive Green
            cabinetPulls: "5c442e06-18e4-483f-ac20-aa18abdec9fe", // Satin Nickel (or Brass)
            countertops: "7baa901e-dd91-4d69-994c-d5ff9937abfe", // Bella Calacatta (or something warmer)
            interiorDoorHandles: "c8522dde-8d2a-42c9-bb62-9cda828cfe96",
            entryDoorHandset: "a524f16f-89f9-471c-8b87-316cff00a6c2",
            flooring: "b65a09d8-7ac0-4c0c-b1ab-2afe0714af8b",
            bathroomFaucet: "986a5008-aae2-48be-9f69-6a8ecb37aae7",
            showerTile: "840b38fe-99f0-4b42-b1b1-82c5b640e318",
        },
    },
};