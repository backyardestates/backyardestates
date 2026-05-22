import * as React from "react";

export const STEP_KEYS = ["property", "vision", "floorplans", "reality", "finance", "review"] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export type StepDef = {
    key: StepKey;
    title: string;
    Icon: React.FC;
    index: number;
};

export type FinanceStatus = "secured" | "exploring" | "not_sure";

export type FinancePath =
    | "cash"
    | "heloc"
    | "cash_out_refi"
    | "construction_loan"
    | "personal_loan"
    | "other";

export type FinanceData = {
    status?: FinanceStatus;
    path?: FinancePath;

    // Keep 5,6,7
    downPayment?: number; // estimate (optional)
    termMonths?: 180 | 240 | 360;
    ratePct?: number; // estimate (optional / defaulted)

    // Improved step 11
    wantsValueBoostAnalysis?: "yes" | "no";
    homeValueEstimate?: number | null; // only if wantsValueBoostAnalysis === "yes"
    mortgageBalance?: number | null; // optional
};

export function isComplete(screen: { id: string }, answers: any) {
    const finance = (answers.finance ?? {}) as FinanceData;

    switch (screen.id) {

        case "contact":
            return !!answers.contact;

        case "motivation":
            return !!answers.motivation;

        case "aduType":
            return !!answers.aduType;

        case "floorplansStep":
            return answers.bed != null && answers.bath != null && !!answers.timeframe && !!answers.selectedFloorplanId;

        case "financeStatus":
            return !!answers.finance?.status;

        case "financePath":
            return !!answers.finance?.path;

        case "financeAssumptions": {
            const f = answers.finance ?? {};
            const basicOk = f.downPayment != null && !!f.termMonths && f.ratePct != null;
            const valueBoostAnswered = f.wantsValueBoostAnalysis === "yes" || f.wantsValueBoostAnalysis === "no";
            return basicOk && valueBoostAnswered;
        }


        default:
            return true;
    }
}

export type SelectedFloorplan = {
    id: string;
    name: string;
    price: number;
    sqft: number;
    bed: number;
    bath: number;
    drawingUrl?: string;
};