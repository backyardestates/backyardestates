import { StepDef } from "./types";
import { House } from "lucide-react";
import { POTENTIAL_SITE_SPECIFIC } from "@/lib/IncludedScope";

export const STEPS: StepDef[] = [
    { key: "vision", title: "Vision", Icon: House, index: 0 },
    { key: "floorplans", title: "Floorplans", Icon: House, index: 1 },
    { key: "reality", title: "Site-Specific Work", Icon: House, index: 2 },
    { key: "finance", title: "Finance", Icon: House, index: 3 },
    { key: "review", title: "Review", Icon: House, index: 4 },
    { key: "submit", title: "Generate PDF", Icon: House, index: 5 },
];

// optional: used only if you want FLOW to carry options (not required if step renders pills itself)
export const RISK_FLAG_OPTIONS = POTENTIAL_SITE_SPECIFIC.map((x) => ({
    value: x.id,
    label: x.title,
}));

export const FLOW = [
    // Vision
    { id: "motivation", step: "vision", order: 1, required: true },
    { id: "aduType", step: "vision", order: 2, required: true },

    // Floorplans (single screen)
    { id: "floorplansStep", step: "floorplans", order: 3, required: true },

    // Site-Specific Work (3 sub-screens)
    { id: "includedBrowse", step: "reality", order: 4, required: false },
    { id: "upgradesBrowse", step: "reality", order: 5, required: false },
    { id: "riskFlags", step: "reality", order: 6, required: false },

    // Finance (single screen)
    { id: "financeStep", step: "finance", order: 7, required: true },

    // Review / Submit
    { id: "reviewScreen", step: "review", order: 8, required: false },
    { id: "generatePdf", step: "submit", order: 9, required: false },
] as const;
