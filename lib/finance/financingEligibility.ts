export type FinancingInputs = {
    owed: number;          // current loan balance
    value: number;         // property value (AVM)
    aduCost: number;       // floorplan price
    termYears?: number;    // default 30

    // Optional: if you later add current mortgage payment
    currentFirstPmtMonthly?: number; // default 0 to match your sheet
};

export type FinancingPolicy = {
    cashOutRefi: {
        maxLTVs: number[];   // e.g. [0.8, 0.9, 0.95]
        rate: number;        // e.g. 0.0625
        termYears?: number;
    };

    heloc: {
        maxCLTV: number;     // e.g. 0.9
        rate: number;        // e.g. 0.07
        interestOnly: boolean; // true (matches your sheet)
    };

    cashOutSecond: {
        maxCLTV: number;     // e.g. 0.9
        rate: number;        // e.g. 0.0725
        termYears?: number;
    };

    renovation: {
        maxLTV: number;      // e.g. 0.95
        rate: number;        // e.g. 0.085
        termYears?: number;
    };
};

export type FinancingOptionResult = {
    key: string;
    label: string;
    ok: boolean;

    // core numbers
    newLoanAmount?: number;      // total balance if refi/reno
    secondLoanAmount?: number;   // aduCost for HELOC/2nd
    maxAllowedLoan?: number;     // based on LTV/CLTV
    cashAvailable?: number;      // maxAllowed - owed (for refi logic)

    // payments
    aduPmtMonthly?: number;      // payment attributable to ADU financing path
    totalPmtMonthly?: number;    // current + new
    deltaPmtMonthly?: number;    // total - current

    notes: string[];
};

function isFiniteNumber(n: any): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

function pmt(annualRate: number, termYears: number, principal: number) {
    const r = annualRate / 12;
    const n = termYears * 12;
    if (!isFiniteNumber(principal) || principal <= 0) return 0;
    if (r === 0) return principal / n;
    return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function evaluateFinancingOptions(
    input: FinancingInputs,
    policy: FinancingPolicy
): FinancingOptionResult[] {
    const owed = input.owed;
    const value = input.value;
    const aduCost = input.aduCost;
    const termYears = input.termYears ?? 30;
    const currentFirst = input.currentFirstPmtMonthly ?? 0;

    const out: FinancingOptionResult[] = [];

    // -----------------------
    // Cash-out refi (1st)
    // -----------------------
    for (const maxLTV of policy.cashOutRefi.maxLTVs) {
        const maxAllowed = value * maxLTV;
        const needed = owed + aduCost;

        const ok = needed <= maxAllowed;

        const newLoanAmount = needed; // matches your sheet logic
        const newPmt = pmt(policy.cashOutRefi.rate, policy.cashOutRefi.termYears ?? termYears, newLoanAmount);

        out.push({
            key: `cashout_refi_${Math.round(maxLTV * 100)}`,
            label: `Cash-Out Refi (${Math.round(maxLTV * 100)}% LTV)`,
            ok,
            newLoanAmount,
            maxAllowedLoan: maxAllowed,
            cashAvailable: maxAllowed - owed,
            aduPmtMonthly: newPmt - currentFirst, // if you add current PMT later, this becomes meaningful
            totalPmtMonthly: newPmt,
            deltaPmtMonthly: newPmt - currentFirst,
            notes: [
                `Eligibility: (owed + aduCost) ≤ value × ${maxLTV.toFixed(2)}`,
                `New loan = owed + aduCost ($${Math.round(owed).toLocaleString()} + $${Math.round(aduCost).toLocaleString()})`,
            ],
        });
    }

    // -----------------------
    // HELOC (interest only)
    // -----------------------
    {
        const maxAllowed = value * policy.heloc.maxCLTV;
        const needed = owed + aduCost;
        const ok = needed <= maxAllowed;

        const interestOnlyPmt = policy.heloc.interestOnly
            ? (aduCost * policy.heloc.rate) / 12
            : pmt(policy.heloc.rate, termYears, aduCost);

        out.push({
            key: "heloc",
            label: `HELOC (${Math.round(policy.heloc.maxCLTV * 100)}% CLTV)`,
            ok,
            secondLoanAmount: aduCost,
            maxAllowedLoan: maxAllowed,
            aduPmtMonthly: interestOnlyPmt,
            totalPmtMonthly: currentFirst + interestOnlyPmt,
            deltaPmtMonthly: interestOnlyPmt,
            notes: [
                `Eligibility: (owed + aduCost) ≤ value × ${policy.heloc.maxCLTV.toFixed(2)}`,
                policy.heloc.interestOnly ? "Payment modeled as interest-only (matches your sheet)." : "Payment modeled amortized.",
            ],
        });
    }

    // -----------------------
    // Cash-out 2nd (amortized)
    // -----------------------
    {
        const maxAllowed = value * policy.cashOutSecond.maxCLTV;
        const needed = owed + aduCost;
        const ok = needed <= maxAllowed;

        const secondPmt = pmt(policy.cashOutSecond.rate, policy.cashOutSecond.termYears ?? termYears, aduCost);

        out.push({
            key: "cashout_second",
            label: `Cash-Out 2nd (${Math.round(policy.cashOutSecond.maxCLTV * 100)}% CLTV)`,
            ok,
            secondLoanAmount: aduCost,
            maxAllowedLoan: maxAllowed,
            aduPmtMonthly: secondPmt,
            totalPmtMonthly: currentFirst + secondPmt,
            deltaPmtMonthly: secondPmt,
            notes: [
                `Eligibility: (owed + aduCost) ≤ value × ${policy.cashOutSecond.maxCLTV.toFixed(2)}`,
                "Payment modeled amortized (matches your sheet).",
            ],
        });
    }

    // -----------------------
    // Renovation / single-loan
    // -----------------------
    {
        const maxAllowed = value * policy.renovation.maxLTV;
        const newLoanAmount = owed + aduCost;
        const ok = newLoanAmount <= maxAllowed;

        const renoPmt = pmt(policy.renovation.rate, policy.renovation.termYears ?? termYears, newLoanAmount);

        out.push({
            key: "renovation_single_loan",
            label: `Renovation Mortgage (${Math.round(policy.renovation.maxLTV * 100)}% LTV)`,
            ok,
            newLoanAmount,
            maxAllowedLoan: maxAllowed,
            aduPmtMonthly: renoPmt - currentFirst,
            totalPmtMonthly: renoPmt,
            deltaPmtMonthly: renoPmt - currentFirst,
            notes: [
                `Eligibility: (owed + aduCost) ≤ value × ${policy.renovation.maxLTV.toFixed(2)}`,
                "Single new loan replaces existing + finances ADU (matches your sheet logic).",
            ],
        });
    }

    return out;
}
