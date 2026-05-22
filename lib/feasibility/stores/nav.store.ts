import { create } from "zustand";

export type FlowItem = {
    id: string;
    step: string;
    order: number;
    required?: boolean;
};

export type Flow = ReadonlyArray<FlowItem>;


type NavState = {
    cursor: number;
    goToIndex: (i: number, flow: Flow) => void;
    goPrev: () => void;
    goNext: (flow: Flow, answers: any) => void;
    goToStep: (flow: Flow, step: string) => void;
    goToId: (flow: readonly any[], id: string) => void
};

export const useNavStore = create<NavState>((set, get) => ({
    cursor: 0,
    setCursor: (i: number) => set({ cursor: i }),
    goToId: (flow, id) => {
        const idx = flow.findIndex((q) => q.id === id);
        if (idx >= 0) set({ cursor: idx });
    },

    goToIndex: (i, flow) => {
        const safe = Math.max(0, Math.min(i, flow.length - 1));
        set({ cursor: safe });
    },

    goPrev: () => set((s) => ({ cursor: Math.max(s.cursor - 1, 0) })),

    goNext: (flow, answers) => {
        const idx = get().cursor;
        const current = flow[idx];

        // // branching (optional)
        // const branched = current.next?.(answers);
        // if (branched) {
        //     const nextIndex = flow.findIndex((q) => q.step === branched.step && q.id === branched.id);
        //     if (nextIndex >= 0) return set({ cursor: nextIndex });
        // }

        set({ cursor: Math.min(idx + 1, flow.length - 1) });
    },

    goToStep: (flow, step) => {
        const firstIndex = flow.findIndex((q) => q.step === step);
        if (firstIndex >= 0) set({ cursor: firstIndex });
    },
}));
