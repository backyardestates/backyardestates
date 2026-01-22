import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AduType = "attached" | "detached" | "garageConversion" | "";
export type IntendedUse = "family" | "investment" | "both" | "";

/** Step 2 (Vision) - new fields */
export type Motivation =
    | "family"
    | "rental"
    | "office"
    | "guest"
    | "value"
    | "other"
    | "";

export type Priority =
    | "lowestCost"
    | "maxPrivacy"
    | "fastTimeline"
    | "maxRental"
    | "resaleValue"
    | "";


export type SiteAuditAnswer = "not_sure" | "confirmed_needed" | "confirmed_not_needed";

export type SiteAuditState = {
    groupIndex: number;
    answers: Record<string, SiteAuditAnswer>;
    totals?: {
        totalAdded?: number;
        totalUnverified?: number;
        totalKnown?: number;
    };
};

export type FeasibilityState = {
    // step 1: contact + address
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;

    // step 2: vision (existing)
    aduType: AduType;
    bed: number | null;
    bath: number | null;
    intendedUse: IntendedUse;

    // step 2: vision (new)
    motivation: Motivation; // keep "" for “not chosen yet”
    motivationOther: string;
    priority: Priority; // keep "" for “not chosen yet”
    occupant: string; // you can make this a union later if you want
    timeframe: string; // you can make this a union later if you want

    // step 3-7: selections + derived outputs
    selectedFloorplanId: string | null;
    riskFlags: string[];

    outputs: {
        estimatedTotalCost?: number;
        monthlyPayment?: number;
        interestRate?: number;
        termMonths?: number;
    };

    set: <K extends keyof FeasibilityState>(key: K, value: FeasibilityState[K]) => void;
    setOutputs: (patch: Partial<FeasibilityState["outputs"]>) => void;
    toggleRisk: (flag: string) => void;
    reset: () => void;

    siteAudit: SiteAuditState;

    setSiteAuditGroupIndex: (index: number) => void;
    setSiteAuditAnswer: (questionId: string, answer: SiteAuditAnswer) => void;
    resetSiteAudit: (questionIds?: string[]) => void;
    setSiteAuditTotals: (patch: Partial<NonNullable<FeasibilityState["siteAudit"]["totals"]>>) => void;

};

const initial: Omit<
    FeasibilityState,
    "set" | "setOutputs" | "toggleRisk" | "reset"
> = {
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",

    aduType: "",
    bed: null,
    bath: null,
    intendedUse: "",

    // new defaults
    motivation: "",
    motivationOther: "",
    priority: "",
    occupant: "",
    timeframe: "",

    selectedFloorplanId: null,
    riskFlags: [],
    outputs: {
        interestRate: 7.5,
        termMonths: 360,
    },

    siteAudit: {
        groupIndex: 0,
        answers: {},
        totals: {
            totalAdded: 0,
            totalUnverified: 0,
            totalKnown: 0,
        },
    },
    setSiteAuditGroupIndex: function (index: number): void {
        throw new Error("Function not implemented.");
    },
    setSiteAuditAnswer: function (questionId: string, answer: SiteAuditAnswer): void {
        throw new Error("Function not implemented.");
    },
    resetSiteAudit: function (questionIds?: string[]): void {
        throw new Error("Function not implemented.");
    },
    setSiteAuditTotals: function (patch: Partial<NonNullable<FeasibilityState["siteAudit"]["totals"]>>): void {
        throw new Error("Function not implemented.");
    }
};

export const useFeasibilityStore = create<FeasibilityState>()(
    persist(
        (set, get) => ({
            ...initial,
            set: (key, value) => set({ [key]: value } as any),
            setOutputs: (patch) => set({ outputs: { ...get().outputs, ...patch } }),
            toggleRisk: (flag) =>
                set({
                    riskFlags: get().riskFlags.includes(flag)
                        ? get().riskFlags.filter((f) => f !== flag)
                        : [...get().riskFlags, flag],
                }),
            reset: () => set(initial),
            setSiteAuditGroupIndex: (index) =>
                set({ siteAudit: { ...get().siteAudit, groupIndex: index } }),

            setSiteAuditAnswer: (questionId, answer) =>
                set({
                    siteAudit: {
                        ...get().siteAudit,
                        answers: { ...get().siteAudit.answers, [questionId]: answer },
                    },
                }),

            setSiteAuditTotals: (patch) =>
                set({
                    siteAudit: {
                        ...get().siteAudit,
                        totals: { ...get().siteAudit.totals, ...patch },
                    },
                }),

            resetSiteAudit: (questionIds) => {
                const current = get().siteAudit.answers || {};
                if (!questionIds?.length) {
                    set({ siteAudit: { groupIndex: 0, answers: {}, totals: get().siteAudit.totals } });
                    return;
                }

                const next = { ...current };
                for (const id of questionIds) delete next[id];

                set({
                    siteAudit: {
                        ...get().siteAudit,
                        answers: next,
                        groupIndex: 0,
                    },
                });
            },

        }),
        { name: "adu-feasibility-engine-v1" }

    )
);
