import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AduType = "attached" | "detached" | "garageConversion" | "";
export type IntendedUse = "family" | "investment" | "both" | "";

export type FeasibilityState = {
    // step 1: contact + address
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;

    // step 2: vision
    aduType: AduType;
    bed: number | null;
    bath: number | null;
    intendedUse: IntendedUse;

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
    selectedFloorplanId: null,
    riskFlags: [],
    outputs: {
        interestRate: 7.5,
        termMonths: 360,
    },
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
        }),
        { name: "adu-feasibility-engine-v1" }
    )
);
