// Single source of truth for the /pricing financing experience: the interactive
// payment estimator, the "how it pencils out" math, the financing-option cards,
// and the financing FAQ.
//
// ⚠️  PLACEHOLDER FIGURES  ⚠️
// The `rate`, `RENT_BY_PLAN`, rent fallback, and `PROPERTY_VALUE_INCREASE`
// numbers below are reasonable placeholders so the page is fully functional.
// Replace them with Backyard Estates' real figures before publishing — every
// number a customer sees lives in THIS file, so updates happen in one place.

// Company contact used across the pricing page CTAs.
export const PHONE_DISPLAY = '(425) 494-4705'
export const PHONE_HREF = 'tel:+14254944705'
export const SPECIALIST_HREF = '/talk-to-an-adu-specialist'
export const OFFICE_VISIT_HREF =
    '/talk-to-an-adu-specialist/office-consultation'

// ---------------------------------------------------------------------------
// Estimator: financing types + terms
// ---------------------------------------------------------------------------
export type FinancingTypeKey = 'heloc' | 'equity' | 'refi'

export interface FinancingType {
    key: FinancingTypeKey
    label: string
    /** Assumed APR the estimator uses for this option (PLACEHOLDER). */
    rate: number
    /** HELOC during the draw period is interest-only. */
    interestOnly: boolean
    note: string
}

export const FINANCING_TYPES: FinancingType[] = [
    {
        key: 'heloc',
        label: 'HELOC',
        rate: 8.0,
        interestOnly: true,
        note: 'Interest-only draw',
    },
    {
        key: 'equity',
        label: 'Home equity loan',
        rate: 7.5,
        interestOnly: false,
        note: 'Fixed payment',
    },
    {
        key: 'refi',
        label: 'Cash-out refinance',
        rate: 6.75,
        interestOnly: false,
        note: 'One mortgage',
    },
]

export const LOAN_TERMS = [10, 15, 20, 30] as const
export const DEFAULT_TERM = 30
export const DEFAULT_FINANCING: FinancingTypeKey = 'heloc'

// ---------------------------------------------------------------------------
// Rent estimates (PLACEHOLDER — replace with real comparable-market rents)
// ---------------------------------------------------------------------------
export const RENT_BY_PLAN: Record<string, number> = {
    'Estate 350': 1850,
    'Estate 400': 2100,
    'Estate 450': 2250,
    'Estate 500': 2400,
    'Estate 600': 2556,
    'Estate 615': 2600,
    'Estate 715+': 2850,
    'Estate 750': 2800,
    'Estate 750+': 2900,
    'Estate 800': 3000,
    'Estate 950': 3300,
    'Estate 1200': 3500,
}

/** Estimated monthly market rent for a plan, with a bedroom-scaled fallback. */
export function estimatedRent(plan: {
    name?: string | null
    bed?: number | null
    sqft?: number | null
}): number {
    if (plan.name && RENT_BY_PLAN[plan.name]) return RENT_BY_PLAN[plan.name]
    const base = 1500
    const perBed = 550
    return base + (plan.bed ?? 1) * perBed
}

/** Property-value increase the day the ADU is complete (PLACEHOLDER range). */
export const PROPERTY_VALUE_INCREASE = { low: 150_000, high: 250_000 }

// ---------------------------------------------------------------------------
// Math
// ---------------------------------------------------------------------------
/**
 * Monthly payment for a loan. Amortized by default; pass interestOnly for a
 * HELOC-style interest-only draw payment.
 *   M = P·r·(1+r)^n / ((1+r)^n − 1)
 */
export function monthlyPayment(
    principal: number,
    annualRatePct: number,
    years: number,
    interestOnly = false
): number {
    const r = annualRatePct / 100 / 12
    if (interestOnly) return principal * r
    const n = years * 12
    if (r === 0) return principal / n
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// ---------------------------------------------------------------------------
// Financing-option cards (educational section — richer than the estimator set)
// ---------------------------------------------------------------------------
export interface FinancingOption {
    badge: string
    name: string
    description: string
    details: string[]
    bestFor: string
}

export const FINANCING_OPTIONS: FinancingOption[] = [
    {
        badge: 'Most popular',
        name: 'HELOC',
        description:
            "Borrow against your home's equity with flexible, interest-only payments during the draw period.",
        details: [
            'Interest-only payments while you draw',
            'Draw funds as the build progresses',
            'Keep your existing low-rate mortgage',
        ],
        bestFor: 'Homeowners with built-up equity',
    },
    {
        badge: 'Fixed rate',
        name: 'Home equity loan',
        description:
            'A fixed rate with predictable monthly payments, disbursed as a single lump sum up front.',
        details: [
            'Fixed, predictable payment',
            'Lump-sum disbursement',
            'Keep your existing mortgage',
        ],
        bestFor: 'Those who want payment certainty',
    },
    {
        badge: 'Consolidate',
        name: 'Cash-out refinance',
        description:
            'Replace your current mortgage with a larger one and take the difference as cash for the build.',
        details: [
            'One loan, one payment',
            'Access equity as cash',
            'May reset your mortgage term',
        ],
        bestFor: 'Consolidating into a single loan',
    },
    {
        badge: 'Specialized',
        name: 'Construction loan',
        description:
            'A short-term loan for the build that converts to permanent financing once your ADU is complete.',
        details: [
            'Draw-based as milestones are met',
            'Converts to a permanent mortgage',
            'Useful without existing equity',
        ],
        bestFor: 'Buyers building without home equity',
    },
]

// ---------------------------------------------------------------------------
// Financing FAQ
// ---------------------------------------------------------------------------
export interface FinancingFaq {
    question: string
    answer: string
}

export const FINANCING_FAQS: FinancingFaq[] = [
    {
        question: 'Is the price on this page my final price?',
        answer: "It's your starting point — the standard all-in price that covers the home and everything standard. Your exact number is confirmed through a Formal Property Analysis, where our architects and engineers verify 130+ property-specific items (utilities, site conditions, city rules). Once that's done, you have a reliable price you can actually build on — no assumptions, no surprises.",
    },
    {
        question: 'What is the Formal Property Analysis?',
        answer: "It's the on-site verification step that turns ideas into certainty. For $500 — fully credited toward your build — our architects and engineering team visits your property and confirms 130+ items: setbacks and property lines, easements, sewer and electrical capacity, site conditions, and every city-specific rule. You walk away with a confirmed buildable plan, a reliable project cost, and a clear path forward.",
    },
    {
        question: 'Can I build an ADU with no money out of pocket?',
        answer: "Often, yes. HELOC and cash-out refinance options draw on the equity you already have in your home, so there's no separate down payment required. During your free office visit we'll help you see what's possible for your situation.",
    },
    {
        question: 'What credit score do I need?',
        answer: 'Most lenders look for a score around 620 or higher, and 680+ typically earns the best rates and terms. We work with ADU-specialized lenders and can point you toward the right fit.',
    },
    {
        question: 'How long does financing approval take?',
        answer: 'Pre-approval is usually just a few days; full approval typically takes 2–4 weeks. We recommend starting the conversation early so financing is ready by the time your plans are permit-ready.',
    },
    {
        question: 'Does Backyard Estates help with financing?',
        answer: "Yes. We partner with lenders who specialize in ADUs and walk you through your options during your free office visit — no obligation, just clarity on what makes sense for you.",
    },
    {
        question: "What's included in the all-in price?",
        answer: 'Everything to get from your backyard today to a finished, permitted home: design, plans and permits, site prep and utility connections, appliances, fixtures and finishes, full project management, and solar on Estate 500 and larger. Anything unique to your property is verified up front in the Formal Property Analysis, so the price you sign is the price you pay.',
    },
]
