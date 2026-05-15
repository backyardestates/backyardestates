export type PaymentPhase = "pre-construction" | "permitting" | "construction" | "final";

export type PaymentMilestone = {
    id: string;
    label: string;
    pct: number;
    phase: PaymentPhase;
    trigger: string;
    amount: number;
};

// Verified to sum to exactly 100.00%
export const PAYMENT_MILESTONES: Omit<PaymentMilestone, "amount">[] = [
    { id: "signing",   label: "Due at signing (minus $500 deposit)",  pct: 1.76,  phase: "pre-construction", trigger: "Contract signed" },
    { id: "sub1",      label: "First submittal",                       pct: 5.26,  phase: "pre-construction", trigger: "Plans submitted to city" },
    { id: "sub2",      label: "Second submittal",                      pct: 8.95,  phase: "permitting",       trigger: "Second city submittal" },
    { id: "demo",      label: "Demolition initiated",                  pct: 13.65, phase: "construction",     trigger: "Construction begins" },
    { id: "rebar",     label: "Rebar inspection passed",               pct: 16.24, phase: "construction",     trigger: "Foundation ready" },
    { id: "framing",   label: "Framing initiated",                     pct: 18.57, phase: "construction",     trigger: "Framing begins" },
    { id: "rough_mep", label: "Plumbing & electrical rough-in",        pct: 13.80, phase: "construction",     trigger: "MEP rough-in starts" },
    { id: "fin_start", label: "Interior finishes initiated",           pct: 13.30, phase: "construction",     trigger: "Interior work begins" },
    { id: "fin_done",  label: "Interior finishes complete",            pct: 6.76,  phase: "construction",     trigger: "Interior complete" },
    { id: "final",     label: "Final inspection",                      pct: 1.71,  phase: "final",            trigger: "City final inspection" },
];

export function calculatePaymentSchedule(totalPrice: number): PaymentMilestone[] {
    const schedule: PaymentMilestone[] = PAYMENT_MILESTONES.map((m) => ({
        ...m,
        amount: Math.round(totalPrice * m.pct / 100),
    }));

    // Distribute rounding error to last milestone so sum === totalPrice exactly
    const sum = schedule.reduce((acc, m) => acc + m.amount, 0);
    schedule[schedule.length - 1].amount += totalPrice - sum;

    return schedule;
}
