import { StepDef } from "./types";
import { House } from "lucide-react";

export const STEPS: StepDef[] = [
    { key: "property", title: "Property", Icon: House, index: 0 },
    { key: "vision", title: "Vision", Icon: House, index: 1 },
    { key: "floorplans", title: "Floorplans", Icon: House, index: 2 },
    { key: "reality", title: "Site-Specific Work", Icon: House, index: 3 },
    { key: "finance", title: "Finance", Icon: House, index: 4 },
    { key: "review", title: "Review", Icon: House, index: 5 },
];

// // optional: used only if you want FLOW to carry options (not required if step renders pills itself)
// export const RISK_FLAG_OPTIONS = POTENTIAL_SITE_SPECIFIC.map((x) => ({
//     value: x.id,
//     label: x.title,
// }));

export const FLOW = [
    { id: "property", step: "property", order: 0, required: true },

    { id: "motivation", step: "vision", order: 1, required: true },
    { id: "aduType", step: "vision", order: 2, required: true },

    { id: "floorplansStep", step: "floorplans", order: 3, required: true },

    { id: "includedBrowse", step: "reality", order: 4, required: false },
    { id: "upgradesBrowse", step: "reality", order: 5, required: false },
    { id: "riskFlags", step: "reality", order: 6, required: false },

    { id: "financeStatus", step: "finance", order: 7, required: true },
    { id: "financePath", step: "finance", order: 8, required: true },
    { id: "financeAssumptions", step: "finance", order: 9, required: true },

    { id: "reviewScreen", step: "review", order: 10, required: false },
] as const;

