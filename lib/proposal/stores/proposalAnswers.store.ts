import { create } from "zustand";

export type MoneyRange = { min: number; max: number; display?: string };

export type SiteApplicability = "unknown" | "might_apply" | "not_apply";

export type ScopeItemState = {
    status: SiteApplicability;
    cost?: MoneyRange;
};

export type UpgradeItemState = {
    selected: boolean;
    cost?: MoneyRange;
};

type Answers = Record<string, any> & {
    // ✅ New structured fields (kept alongside your existing free-form answers)
    siteSpecific: Record<string, ScopeItemState>;
    optionalUpgrades: Record<string, UpgradeItemState>;
};

type AnswersState = {
    answers: Answers;

    // existing API (keep)
    setAnswer: (id: string, value: any) => void;
    clearAnswer: (id: string) => void;
    hydrate: (next: Record<string, any>) => void;

    // ✅ new helpers
    setSiteSpecificStatus: (id: string, status: SiteApplicability, cost?: MoneyRange, title?: string) => void;
    clearSiteSpecific: (id: string) => void;

    setUpgradeSelected: (id: string, selected: boolean, cost?: MoneyRange, title?: string) => void;
    toggleUpgrade: (id: string, cost?: MoneyRange) => void;
    clearUpgrade: (id: string) => void;

    // ✅ convenience selectors
    getSiteSpecificStatus: (id: string) => SiteApplicability;
    isUpgradeSelected: (id: string) => boolean;
};

const ensureShape = (next: Record<string, any>): Answers => ({
    ...(next || {}),
    siteSpecific: (next?.siteSpecific as Answers["siteSpecific"]) ?? {},
    optionalUpgrades: (next?.optionalUpgrades as Answers["optionalUpgrades"]) ?? {},
});

export const useAnswersStore = create<AnswersState>((set, get) => ({
    answers: ensureShape({}),

    // -------------------------
    // existing API (unchanged)
    // -------------------------
    setAnswer: (id, value) =>
        set((s) => ({
            answers: ensureShape({ ...s.answers, [id]: value }),
        })),

    clearAnswer: (id) =>
        set((s) => {
            const next = { ...s.answers };
            delete (next as any)[id];
            return { answers: ensureShape(next) };
        }),

    hydrate: (next) => set({ answers: ensureShape(next || {}) }),

    // -------------------------
    // ✅ site-specific helpers
    // -------------------------
    setSiteSpecificStatus: (id, status, cost, title) =>
        set((s) => ({
            answers: ensureShape({
                ...s.answers,
                siteSpecific: {
                    ...s.answers.siteSpecific,
                    [id]: { title, status, cost },
                },
            }),
        })),

    clearSiteSpecific: (id) =>
        set((s) => {
            const next = { ...s.answers.siteSpecific };
            delete next[id];
            return {
                answers: ensureShape({
                    ...s.answers,
                    siteSpecific: next,
                }),
            };
        }),

    // -------------------------
    // ✅ optional upgrade helpers
    // -------------------------
    setUpgradeSelected: (id, selected, cost, title) =>
        set((s) => ({
            answers: ensureShape({
                ...s.answers,
                optionalUpgrades: {
                    ...s.answers.optionalUpgrades,
                    [id]: { selected, cost, title },
                },
            }),
        })),

    toggleUpgrade: (id, cost) => {
        const cur = get().answers.optionalUpgrades[id]?.selected ?? false;
        get().setUpgradeSelected(id, !cur, cost ?? get().answers.optionalUpgrades[id]?.cost);
    },

    clearUpgrade: (id) =>
        set((s) => {
            const next = { ...s.answers.optionalUpgrades };
            delete next[id];
            return {
                answers: ensureShape({
                    ...s.answers,
                    optionalUpgrades: next,
                }),
            };
        }),

    // -------------------------
    // ✅ convenience selectors
    // -------------------------
    getSiteSpecificStatus: (id) => get().answers.siteSpecific[id]?.status ?? "unknown",
    isUpgradeSelected: (id) => get().answers.optionalUpgrades[id]?.selected ?? false,
}));
