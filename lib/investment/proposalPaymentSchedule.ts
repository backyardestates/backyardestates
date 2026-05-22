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

// ─── DB-backed catalog generator (pure — usable on client + server) ──────────

/**
 * Serializable shape of a payment milestone definition from the DB catalog.
 * Mirrors `PaymentMilestoneDef` from Prisma but without DB-only audit columns,
 * so it can cross the server/client boundary safely.
 */
export type PaymentMilestoneDefData = {
    id: string;
    slug: string;
    label: string;
    trigger: string;
    sortOrder: number;
    weight: number;
    fixedAmount: number | null;
};

/**
 * Catalog-driven balloon schedule. Same algorithm as `generateBalloonSchedule`
 * but reads the milestone shape + weights + fixed-amount endpoints from a
 * caller-supplied catalog array (typically SSR-fetched from the DB).
 *
 * - Fixed-amount milestones receive their `fixedAmount` directly
 * - Remaining = totalPrice - sum(fixedAmount)
 * - Flex milestones split the remainder proportional to their `weight`
 * - Rounding diff is added to the highest-weight flex milestone (the peak)
 *   so the sum equals totalPrice exactly
 */
export function generateBalloonFromCatalogDefs(
    totalPrice: number,
    defs: PaymentMilestoneDefData[]
): ProposalPaymentEntry[] {
    if (defs.length === 0) return [];

    const fixedSum = defs.reduce((s, d) => s + (d.fixedAmount ?? 0), 0);
    const remaining = Math.max(0, totalPrice - fixedSum);
    const flexWeights = defs
        .filter((d) => d.fixedAmount == null)
        .reduce((s, d) => s + d.weight, 0) || 1;

    let peakIdx = 0;
    let peakWeight = -1;

    const amounts = defs.map((d, i) => {
        const amount =
            d.fixedAmount ??
            Math.round((remaining * d.weight) / flexWeights);
        if (d.fixedAmount == null && d.weight > peakWeight) {
            peakWeight = d.weight;
            peakIdx = i;
        }
        return amount;
    });

    // Settle rounding diff on the peak flex milestone.
    const sum = amounts.reduce((s, a) => s + a, 0);
    const diff = totalPrice - sum;
    if (diff !== 0 && defs[peakIdx]?.fixedAmount == null) {
        amounts[peakIdx] = Math.max(0, amounts[peakIdx] + diff);
    }

    return defs.map((d, i) => ({
        id: d.slug, // use slug as the entry id so it's stable across regenerations
        label: d.label,
        trigger: d.trigger,
        amount: amounts[i],
    }));
}

/** Fixed-amount endpoints derived from a catalog. Returns the FIRST and LAST
 *  fixed-amount milestones in sort order, or the legacy constants when no
 *  fixed-amount milestones exist. Used for the "first locked to $X" copy. */
export function getFixedEndpointsFromCatalog(
    defs: PaymentMilestoneDefData[]
): { first: number; last: number } {
    const fixed = defs.filter((d) => d.fixedAmount != null);
    if (fixed.length === 0) {
        return { first: PROPOSAL_FIRST_AMOUNT, last: PROPOSAL_LAST_AMOUNT };
    }
    return {
        first: fixed[0]!.fixedAmount!,
        last: fixed[fixed.length - 1]!.fixedAmount!,
    };
}
