// Editable payment schedule for the customer's ADU agreement.
// Distinct from the auto-computed `paymentSchedules` map — this one is
// hand-tuned by an admin in Step 12 and surfaced on a dedicated slide.

export type ProposalPaymentEntry = {
    id: string;
    label: string;
    trigger: string;
    amount: number;
};

export type ProposalPaymentSchedule = {
    aduId: string;          // Floorplan _id of the ADU this schedule is based on
    totalPrice: number;     // snapshot of finalAduPrice when the schedule was generated
    entries: ProposalPaymentEntry[];
};

// First and last payments are fixed dollar amounts per the proposal contract.
export const PROPOSAL_FIRST_AMOUNT = 7500;
export const PROPOSAL_LAST_AMOUNT  = 7854;

// 10 contract milestones (labels + triggers). Order matters — payments rise to
// a peak between #5 (rebar) and #6 (framing), then decrease.
export const PROPOSAL_MILESTONE_DEFS: Omit<ProposalPaymentEntry, "amount">[] = [
    { id: "signing",   label: "Due at signing",                 trigger: "Contract signed" },
    { id: "sub1",      label: "First submittal",                trigger: "Plans submitted to city" },
    { id: "sub2",      label: "Second submittal",               trigger: "Second city submittal" },
    { id: "demo",      label: "Demolition initiated",           trigger: "Construction begins" },
    { id: "rebar",     label: "Rebar inspection passed",        trigger: "Foundation ready" },
    { id: "framing",   label: "Framing initiated",              trigger: "Framing begins" },
    { id: "rough_mep", label: "Plumbing & electrical rough-in", trigger: "MEP rough-in starts" },
    { id: "fin_start", label: "Interior finishes initiated",    trigger: "Interior work begins" },
    { id: "fin_done",  label: "Interior finishes complete",     trigger: "Interior complete" },
    { id: "final",     label: "Final inspection",               trigger: "City final inspection" },
];

// Bell-shaped weights for the middle 8 milestones (indices 1..8).
// Peaks at #5 (rebar) and #6 (framing) — the heart of construction.
const MIDDLE_WEIGHTS = [5, 9, 13, 17, 20, 19, 12, 5];

/**
 * Generate the default balloon payment schedule for an ADU agreement.
 *
 * - First payment locked to PROPOSAL_FIRST_AMOUNT ($7,500)
 * - Last payment locked to PROPOSAL_LAST_AMOUNT ($7,854)
 * - Middle 8 distributed in a bell, peaking between #5 and #6
 * - Sum is guaranteed to equal totalPrice exactly (rounding diff applied to peak)
 */
export function generateBalloonSchedule(totalPrice: number): ProposalPaymentEntry[] {
    const remaining = Math.max(0, totalPrice - PROPOSAL_FIRST_AMOUNT - PROPOSAL_LAST_AMOUNT);
    const weightSum = MIDDLE_WEIGHTS.reduce((a, b) => a + b, 0);

    const amounts: number[] = PROPOSAL_MILESTONE_DEFS.map((_, i) => {
        if (i === 0) return PROPOSAL_FIRST_AMOUNT;
        if (i === PROPOSAL_MILESTONE_DEFS.length - 1) return PROPOSAL_LAST_AMOUNT;
        const weight = MIDDLE_WEIGHTS[i - 1];
        return Math.round((remaining * weight) / weightSum);
    });

    // Distribute rounding diff to the peak so the total matches exactly.
    const sum = amounts.reduce((a, b) => a + b, 0);
    const diff = totalPrice - sum;
    if (diff !== 0) amounts[5] = Math.max(0, amounts[5] + diff);

    return PROPOSAL_MILESTONE_DEFS.map((def, i) => ({ ...def, amount: amounts[i] }));
}

/** Returns the sum of all entry amounts. Useful for displaying variance vs total. */
export function sumPaymentEntries(entries: ProposalPaymentEntry[]): number {
    return entries.reduce((acc, e) => acc + (Number.isFinite(e.amount) ? e.amount : 0), 0);
}
