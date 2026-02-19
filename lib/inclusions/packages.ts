export type PackageKey = "light" | "dark" | "blue" | "monochrome" | "olive";

export type PackageSlot =
    // existing
    | "cabinets"
    | "countertops"
    | "cabinetPulls"
    | "interiorDoorHandles"
    | "entryDoorHandset"
    | "bathroomFaucet"
    | "flooring"
    | "showerTile"

    // NEW — Kitchen
    | "kitchenSink"
    | "kitchenFaucet"
    | "dishwasher"
    | "fridge"
    | "microwave"
    | "range"

    // NEW — Bathroom
    | "bathroomSink"
    | "toilet"
    | "bathtubInsert"
    | "showerPanInsert"

    // NEW — Interior
    | "recessedLighting"
    | "orangePeelWallFinish";

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
            // existing core
            cabinets: "dd50e411-9239-470b-902a-c9698f3b197e", // Shaker Cabinets - White
            cabinetPulls: "5c442e06-18e4-483f-ac20-aa18abdec9fe", // Pulls - Satin Nickel
            countertops: "7baa901e-dd91-4d69-994c-d5ff9937abfe", // Bella Calacatta
            interiorDoorHandles: "c8522dde-8d2a-42c9-bb62-9cda828cfe96", // Satin Nickel
            entryDoorHandset: "a524f16f-89f9-471c-8b87-316cff00a6c2", // Satin Nickel
            flooring: "b65a09d8-7ac0-4c0c-b1ab-2afe0714af8b", // Oyster
            bathroomFaucet: "986a5008-aae2-48be-9f69-6a8ecb37aae7", // Satin Nickel
            showerTile: "840b38fe-99f0-4b42-b1b1-82c5b640e318", // Bright White

            // kitchen add-ons
            kitchenSink: "db5bf717-df6a-4839-bc35-0987d5283fb8", // Kitchen Sink (standard)
            kitchenFaucet: "9fec8931-6654-4652-bac7-34dac8615eb6", // Kitchen Faucet - Satin Nickel
            dishwasher: "47badfb0-95eb-44ac-bab9-3612a46b6e89", // Samsung Dishwasher
            fridge: "fc78a9bb-817d-46b0-8a09-2fa947673660", // Samsung Fridge
            microwave: "c2a118d9-8372-44b1-b083-b989f25807fb", // Samsung Microwave
            range: "f3b17b84-3fa5-490b-a34a-6398904345a8", // Samsung Range

            // bathroom add-ons
            bathroomSink: "958d8666-6e9d-4a97-8cff-3f630e9fa4b1", // Bathroom Sink (standard)
            toilet: "fa64d2b9-324b-41e4-9519-9a1f74f47f63", // Dual Flush Toilet
            bathtubInsert: "bb70bbdd-f1b1-441d-a15e-e957347fe062", // Bathtub Insert
            showerPanInsert: "a09f474c-ecdc-4495-9390-668a42e88ef0", // Shower Pan Insert

            // interior add-ons
            recessedLighting: "5eea3100-1bd4-42d6-91c6-bba6adcddf98", // Recessed Lighting
            orangePeelWallFinish: "e34a0ef2-c04a-4151-b46d-7c7eba4c8dc6", // Orange Peel Wall Finish
        },
    },

    dark: {
        key: "dark",
        label: "Contemporary dark",
        slots: {
            cabinets: "c2f5207d-b7ef-407b-b335-7e3700ff409b", // Misty Gray
            cabinetPulls: "b56b2ce0-4469-4cd9-8529-56f422834017", // Matte Black
            countertops: "ea738543-0248-4d91-a9c4-5943b708f44b", // Calacatas Alaska
            interiorDoorHandles: "7e53f8a5-c519-4c15-b9eb-d55c00e3d17c", // Matte Black
            entryDoorHandset: "1d50b05e-8a53-4bab-819d-7f4a367682b1", // Matte Black
            flooring: "7df197ab-3596-4cff-8f85-2e454191cc2f", // Espresso
            bathroomFaucet: "70d13b34-d4cd-4295-9660-f8688aa6ac8d", // Matte Black
            showerTile: "840b38fe-99f0-4b42-b1b1-82c5b640e318",

            kitchenSink: "db5bf717-df6a-4839-bc35-0987d5283fb8",
            kitchenFaucet: "5ea890b2-1c8f-4885-a251-6e3b005aa656", // Kitchen Faucet - Matte Black
            dishwasher: "47badfb0-95eb-44ac-bab9-3612a46b6e89",
            fridge: "fc78a9bb-817d-46b0-8a09-2fa947673660",
            microwave: "c2a118d9-8372-44b1-b083-b989f25807fb",
            range: "f3b17b84-3fa5-490b-a34a-6398904345a8",

            bathroomSink: "958d8666-6e9d-4a97-8cff-3f630e9fa4b1",
            toilet: "fa64d2b9-324b-41e4-9519-9a1f74f47f63",
            bathtubInsert: "bb70bbdd-f1b1-441d-a15e-e957347fe062",
            showerPanInsert: "a09f474c-ecdc-4495-9390-668a42e88ef0",

            recessedLighting: "5eea3100-1bd4-42d6-91c6-bba6adcddf98",
            orangePeelWallFinish: "e34a0ef2-c04a-4151-b46d-7c7eba4c8dc6",
        },
    },

    blue: {
        key: "blue",
        label: "Modern blue",
        slots: {
            cabinets: "3627ffd7-8518-484a-9452-0e3c907b1e97", // Blue
            cabinetPulls: "5c442e06-18e4-483f-ac20-aa18abdec9fe", // Satin Nickel
            countertops: "fcc3de73-eb27-42d8-8abb-155c2125d8af", // Fairy White
            interiorDoorHandles: "c8522dde-8d2a-42c9-bb62-9cda828cfe96", // Satin Nickel
            entryDoorHandset: "a524f16f-89f9-471c-8b87-316cff00a6c2", // Satin Nickel
            flooring: "14a22dfe-fa4d-4598-a5cc-5f078fd196a8", // Malibu
            bathroomFaucet: "986a5008-aae2-48be-9f69-6a8ecb37aae7", // Satin Nickel
            showerTile: "840b38fe-99f0-4b42-b1b1-82c5b640e318",

            kitchenSink: "db5bf717-df6a-4839-bc35-0987d5283fb8",
            kitchenFaucet: "9fec8931-6654-4652-bac7-34dac8615eb6", // Kitchen Faucet - Satin Nickel
            dishwasher: "47badfb0-95eb-44ac-bab9-3612a46b6e89",
            fridge: "fc78a9bb-817d-46b0-8a09-2fa947673660",
            microwave: "c2a118d9-8372-44b1-b083-b989f25807fb",
            range: "f3b17b84-3fa5-490b-a34a-6398904345a8",

            bathroomSink: "958d8666-6e9d-4a97-8cff-3f630e9fa4b1",
            toilet: "fa64d2b9-324b-41e4-9519-9a1f74f47f63",
            bathtubInsert: "bb70bbdd-f1b1-441d-a15e-e957347fe062",
            showerPanInsert: "a09f474c-ecdc-4495-9390-668a42e88ef0",

            recessedLighting: "5eea3100-1bd4-42d6-91c6-bba6adcddf98",
            orangePeelWallFinish: "e34a0ef2-c04a-4151-b46d-7c7eba4c8dc6",
        },
    },

    monochrome: {
        key: "monochrome",
        label: "Modern monochrome",
        slots: {
            cabinets: "41fd8d66-54cd-4d79-bbee-f6f53c41c01b", // Black
            cabinetPulls: "b56b2ce0-4469-4cd9-8529-56f422834017", // Matte Black (better match)
            countertops: "bff97e22-1968-4f90-b41e-929183f6b1b2", // Calacatas River
            interiorDoorHandles: "7e53f8a5-c519-4c15-b9eb-d55c00e3d17c", // Matte Black
            entryDoorHandset: "1d50b05e-8a53-4bab-819d-7f4a367682b1", // Matte Black
            flooring: "ac42a817-b5b7-4974-b691-2a77b90fdf50", // Oxford
            bathroomFaucet: "70d13b34-d4cd-4295-9660-f8688aa6ac8d", // Matte Black
            showerTile: "840b38fe-99f0-4b42-b1b1-82c5b640e318",

            kitchenSink: "db5bf717-df6a-4839-bc35-0987d5283fb8",
            kitchenFaucet: "5ea890b2-1c8f-4885-a251-6e3b005aa656", // Matte Black
            dishwasher: "47badfb0-95eb-44ac-bab9-3612a46b6e89",
            fridge: "fc78a9bb-817d-46b0-8a09-2fa947673660",
            microwave: "c2a118d9-8372-44b1-b083-b989f25807fb",
            range: "f3b17b84-3fa5-490b-a34a-6398904345a8",

            bathroomSink: "958d8666-6e9d-4a97-8cff-3f630e9fa4b1",
            toilet: "fa64d2b9-324b-41e4-9519-9a1f74f47f63",
            bathtubInsert: "bb70bbdd-f1b1-441d-a15e-e957347fe062",
            showerPanInsert: "a09f474c-ecdc-4495-9390-668a42e88ef0",

            recessedLighting: "5eea3100-1bd4-42d6-91c6-bba6adcddf98",
            orangePeelWallFinish: "e34a0ef2-c04a-4151-b46d-7c7eba4c8dc6",
        },
    },

    olive: {
        key: "olive",
        label: "Urban olive",
        slots: {
            cabinets: "5926cac6-3c67-4054-b94e-c1c4160a362d", // Olive Green
            cabinetPulls: "679e2a04-f07c-447d-81b3-e01946a0bc09", // Brushed Gold (pairs best w/ olive)
            countertops: "7baa901e-dd91-4d69-994c-d5ff9937abfe", // Bella Calacatta
            interiorDoorHandles: "135b171b-4e1d-4015-ae92-06ee30326d4e", // Satin Brass
            entryDoorHandset: "bcd003e4-bdff-412e-b179-b67536dffaa1", // Brushed Gold
            flooring: "85c9b41a-5d97-4335-a77e-a431bd259e4f", // Fox Hound
            bathroomFaucet: "986a5008-aae2-48be-9f69-6a8ecb37aae7", // Satin Nickel (OK) — swap if you add brass later
            showerTile: "840b38fe-99f0-4b42-b1b1-82c5b640e318",

            kitchenSink: "db5bf717-df6a-4839-bc35-0987d5283fb8",
            kitchenFaucet: "c504d011-834d-4d50-a108-b66edd1ae964", // Brushed Gold
            dishwasher: "47badfb0-95eb-44ac-bab9-3612a46b6e89",
            fridge: "fc78a9bb-817d-46b0-8a09-2fa947673660",
            microwave: "c2a118d9-8372-44b1-b083-b989f25807fb",
            range: "f3b17b84-3fa5-490b-a34a-6398904345a8",

            bathroomSink: "958d8666-6e9d-4a97-8cff-3f630e9fa4b1",
            toilet: "fa64d2b9-324b-41e4-9519-9a1f74f47f63",
            bathtubInsert: "bb70bbdd-f1b1-441d-a15e-e957347fe062",
            showerPanInsert: "a09f474c-ecdc-4495-9390-668a42e88ef0",

            recessedLighting: "5eea3100-1bd4-42d6-91c6-bba6adcddf98",
            orangePeelWallFinish: "e34a0ef2-c04a-4151-b46d-7c7eba4c8dc6",
        },
    },
};
